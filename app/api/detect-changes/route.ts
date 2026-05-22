// app/api/detect-changes/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { pricingData } from "@/data/pricing";
import { generateAudit, AuditInput } from "@/lib/audit-engine";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

// Returns a stable hash of what the audit engine would recommend today
function getPricingSnapshot(inputs: AuditInput[]): Record<string, number> {
  const snapshot: Record<string, number> = {};
  for (const input of inputs) {
    const result = generateAudit(input);
    snapshot[input.tool] = result.recommendedMonthlyCost;
  }
  return snapshot;
}

function hasChanged(
  oldSnapshot: Record<string, number>,
  newSnapshot: Record<string, number>
): boolean {
  for (const tool of Object.keys(newSnapshot)) {
    if (oldSnapshot[tool] !== newSnapshot[tool]) return true;
  }
  return false;
}

function buildEmailHtml(
  oldResults: any[],
  newResults: any[],
  reauditUrl: string
): string {

  const changedTools = newResults
    .map((nr) => {
      const or = oldResults.find((r) => r.tool === nr.tool);

      if (!or) return null;

      // detect ANY meaningful pricing/recommendation change
      const changed =
        or.recommendedMonthlyCost !== nr.recommendedMonthlyCost ||
        or.recommendedPlan !== nr.recommendedPlan ||
        or.monthlySavings !== nr.monthlySavings;

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
    .filter(Boolean);

  const oldTotal = oldResults.reduce(
    (s, r) => s + (r.monthlySavings || 0),
    0
  );

  const newTotal = newResults.reduce(
    (s, r) => s + (r.monthlySavings || 0),
    0
  );

  const delta = newTotal - oldTotal;

  const rows = changedTools
    .map(
      (c: any) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600">
            ${c.tool}
          </td>

          <td style="padding:10px;border-bottom:1px solid #eee;color:#666">
            ${c.oldPlan}
            <br/>
            <span style="font-size:13px">
              $${c.oldPrice}/mo
            </span>
          </td>

          <td style="padding:10px;border-bottom:1px solid #eee;color:#e53e3e">
            ${c.newPlan}
            <br/>
            <span style="font-size:13px">
              $${c.newPrice}/mo
            </span>
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
        Pricing changed for
        <strong>${changedTools.length}</strong>
        tool${changedTools.length !== 1 ? "s" : ""}
        since your last audit.
      </p>

      <h3 style="margin-top:32px;color:#111">
        What changed
      </h3>

      <table
        style="
          width:100%;
          border-collapse:collapse;
          margin-top:12px;
          border:1px solid #eee;
        "
      >
        <thead>
          <tr style="background:#f7f7f7">
            <th style="padding:12px;text-align:left">
              Tool
            </th>

            <th style="padding:12px;text-align:left">
              Old recommendation
            </th>

            <th style="padding:12px;text-align:left">
              New recommendation
            </th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>

      <div
        style="
          margin-top:24px;
          padding:16px;
          background:#fafafa;
          border-radius:8px;
        "
      >
        <strong style="font-size:18px">
          Savings delta:
          ${delta >= 0 ? "+" : ""}$${delta}/mo
        </strong>
      </div>

      <a
        href="${reauditUrl}"
        style="
          display:inline-block;
          margin-top:28px;
          padding:14px 24px;
          background:#000;
          color:#fff;
          text-decoration:none;
          border-radius:8px;
          font-weight:600;
        "
      >
        Re-run audit with new pricing →
      </a>

      <p style="margin-top:40px;font-size:12px;color:#888">
        <a
          href="${reauditUrl}?unsubscribe=1"
          style="color:#888"
        >
          Unsubscribe from re-audit emails
        </a>
      </p>

    </div>
  `;
}

export async function POST(req: Request) {
  // Simple auth — prevent public abuse
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

    const snapshot = await adminDb.collection("audits").get();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  // Group by email to avoid spamming (1 email per user max)
  const byEmail: Record<string, { doc: any; id: string }[]> = {};
  snapshot.forEach((doc) => {
    const data = doc.data();

    const email = data.userEmail || data.email;

    console.log("DOC DATA:", data);
    console.log("EMAIL FOUND:", email);

    if (email) {
        if (!byEmail[email]) byEmail[email] = [];

        byEmail[email].push({
        doc: data,
        id: doc.id,
        });
    }
    });

  let emailsSent = 0;
  let auditsChecked = 0;

  for (const [email, entries] of Object.entries(byEmail)) {
    // Use the most recent audit for this email
    const latest = entries.sort(
      (a, b) => (b.doc.createdAt?.seconds ?? 0) - (a.doc.createdAt?.seconds ?? 0)
    )[0];

    const { doc: auditDoc, id: auditId } = latest;
    auditsChecked++;

    if (!auditDoc.inputs || !auditDoc.results) continue;

    const newSnapshot = getPricingSnapshot(auditDoc.inputs);
    const oldSnapshot = auditDoc.pricingSnapshot ?? {};

    console.log("OLD SNAPSHOT:", oldSnapshot);
    console.log("NEW SNAPSHOT:", newSnapshot);

    const forcePricingChange =
        process.env.NODE_ENV === "development";

    if (!forcePricingChange && !hasChanged(oldSnapshot, newSnapshot)) {
    continue;
    }

    // Generate fresh results
    const newResults = auditDoc.inputs.map((inp: AuditInput) => generateAudit(inp));
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://overprompt-ai-audit.vercel.app";
    const reauditUrl = `${appUrl}/audit/${auditId}?reaudit=1`;

    const html = buildEmailHtml(auditDoc.results, newResults, reauditUrl);

    await transporter.sendMail({
      from: `"Overprompt" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your AI audit needs a refresh — pricing changed",
      html,
    });

    emailsSent++;
  }

  return NextResponse.json({ auditsChecked, emailsSent });
}

// Also support GET for manual browser trigger during testing
export async function GET(req: Request) {
  return POST(req);
}