// app/api/detect-changes/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { generateAudit, AuditInput, AuditResult, PLAN_PRICES } from "@/lib/audit-engine";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

type SnapshotMap = Record<string, number>;

type ChangedTool = {
  tool: string;
  oldPrice: number;
  newPrice: number;
  oldPlan: string;
  newPlan: string;
  oldSavings: number;
  newSavings: number;
};

type StoredAuditDoc = {
  inputs: AuditInput[];
  results: AuditResult[];
  pricingSnapshot?: SnapshotMap;
  userEmail?: string;
  email?: string;
  createdAt?: { seconds: number };
};

// Stores the current plan's canonical price per seat — NOT the recommended cost.
// When a vendor changes their price, old !== new → email fires.
function getPricingSnapshot(inputs: AuditInput[]): SnapshotMap {
  const snapshot: SnapshotMap = {};
  for (const input of inputs) {
    const price = PLAN_PRICES[input.tool]?.[input.plan] ?? 0;
    snapshot[input.tool] = price;
  }
  return snapshot;
}

function getChangedTools(
  oldSnapshot: SnapshotMap,
  newSnapshot: SnapshotMap,
  oldResults: AuditResult[],
  newResults: AuditResult[]
): ChangedTool[] {
  return newResults
    .map((nr): ChangedTool | null => {
      const or = oldResults.find((r) => r.tool === nr.tool);
      if (!or) return null;

      const changed =
        (oldSnapshot[nr.tool] ?? 0) !== (newSnapshot[nr.tool] ?? 0) || // price moved
        or.recommendedPlan !== nr.recommendedPlan ||                    // plan changed
        or.monthlySavings !== nr.monthlySavings;                        // savings changed

      if (!changed) return null;

      return {
        tool: nr.tool,
        oldPrice: or.recommendedMonthlyCost,
        newPrice: nr.recommendedMonthlyCost,
        oldPlan: or.recommendedPlan,
        newPlan: nr.recommendedPlan,
        oldSavings: or.monthlySavings,
        newSavings: nr.monthlySavings,
      };
    })
    .filter((x): x is ChangedTool => x !== null);
}

function buildEmailHtml(
  changedTools: ChangedTool[],
  oldResults: AuditResult[],
  newResults: AuditResult[],
  reauditUrl: string
): string {
  const oldTotal = oldResults.reduce((s, r) => s + (r.monthlySavings || 0), 0);
  const newTotal = newResults.reduce((s, r) => s + (r.monthlySavings || 0), 0);
  const delta = newTotal - oldTotal;

  const rows = changedTools
    .map(
      (c) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600">
            ${c.tool}
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee;color:#666">
            ${c.oldPlan}<br/>
            <span style="font-size:13px">$${c.oldSavings}/mo saved</span>
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee;color:#e53e3e">
            ${c.newPlan}<br/>
            <span style="font-size:13px">$${c.newSavings}/mo saved</span>
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:20px">
      <h2 style="color:#111;font-size:28px;margin-bottom:12px">
        Your AI audit is out of date
      </h2>
      <p style="font-size:16px;line-height:1.6;color:#444">
        Pricing changed for <strong>${changedTools.length}</strong>
        tool${changedTools.length !== 1 ? "s" : ""} since your last audit.
      </p>
      <h3 style="margin-top:32px;color:#111">What changed</h3>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;border:1px solid #eee;">
        <thead>
          <tr style="background:#f7f7f7">
            <th style="padding:12px;text-align:left">Tool</th>
            <th style="padding:12px;text-align:left">Previous savings</th>
            <th style="padding:12px;text-align:left">New savings</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:24px;padding:16px;background:#fafafa;border-radius:8px;">
        <strong style="font-size:18px">
          Savings delta: ${delta >= 0 ? "+" : ""}$${delta}/mo
        </strong>
      </div>
      <a
        href="${reauditUrl}"
        style="display:inline-block;margin-top:28px;padding:14px 24px;background:#000;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;"
      >
        See what changed →
      </a>
      <p style="margin-top:40px;font-size:12px;color:#888">
        <a href="${reauditUrl}?unsubscribe=1" style="color:#888">
          Unsubscribe from re-audit emails
        </a>
      </p>
    </div>
  `;
}

function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  return (
    secret === process.env.CRON_SECRET ||
    authHeader === `Bearer ${process.env.CRON_SECRET}`
  );
}

async function handleRequest() {
  if (!adminDb) {
  return Response.json(
    { error: "Firebase admin not initialized" },
    { status: 500 }
  );
}

const snapshot = await adminDb!.collection("pricingAudits").get();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  // Group by email — 1 email per user max
  const byEmail: Record<string, { doc: StoredAuditDoc; id: string }[]> = {};
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as StoredAuditDoc;
    const email = data.userEmail ?? data.email;
    if (email) {
      if (!byEmail[email]) byEmail[email] = [];
      byEmail[email].push({ doc: data, id: docSnap.id });
    }
  });

  let emailsSent = 0;
  let auditsChecked = 0;
  const errors: string[] = [];

  for (const [email, entries] of Object.entries(byEmail)) {
    // Use most recent audit for this email
    const latest = entries.sort(
      (a, b) =>
        (b.doc.createdAt?.seconds ?? 0) - (a.doc.createdAt?.seconds ?? 0)
    )[0];

    const { doc: auditDoc, id: auditId } = latest;
    auditsChecked++;

    if (!auditDoc.inputs || !auditDoc.results) {
      console.warn(`Skipping audit ${auditId}: missing inputs or results`);
      continue;
    }

    // New snapshot uses canonical plan price (not recommended cost)
    const newSnapshot = getPricingSnapshot(auditDoc.inputs);
    const oldSnapshot: SnapshotMap = auditDoc.pricingSnapshot ?? {};

    // Fresh results with today's pricing
    const newResults: AuditResult[] = auditDoc.inputs.map((inp) =>
      generateAudit(inp)
    );

    const changedTools = getChangedTools(
      oldSnapshot,
      newSnapshot,
      auditDoc.results,
      newResults
    );

    console.log(`[${auditId}] changed tools:`, changedTools.length);

    // ✅ Skip early if nothing changed — do NOT update snapshot yet
    if (changedTools.length === 0) {
      console.log(`[${auditId}] No changes — skipping email for ${email}`);
      continue;
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      "https://overprompt-ai-audit.vercel.app";

    // Points to diff page — shows old vs new side by side
    const reauditUrl = `${appUrl}/audit/${auditId}/diff`;

    const html = buildEmailHtml(
      changedTools,
      auditDoc.results,
      newResults,
      reauditUrl
    );

    try {
      await transporter.sendMail({
        from: `"Overprompt" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Your AI audit needs a refresh — pricing changed",
        html,
      });
      emailsSent++;
      console.log(`[${auditId}] Email sent to ${email}`);

      // ✅ Update snapshot ONLY after email sent successfully
      // Next run will use new prices as baseline — no duplicate emails
      await adminDb.collection("audits").doc(auditId).update({
        pricingSnapshot: newSnapshot,
        lastCheckedAt: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Failed to send email to ${email}:`, message);
      errors.push(`${email}: ${message}`);
      // ✅ Do NOT update snapshot if email failed — will retry next run
    }
  }

  return NextResponse.json({
    auditsChecked,
    emailsSent,
    ...(errors.length ? { errors } : {}),
  });
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handleRequest();
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handleRequest();
}