// app/api/send-confirmation/route.ts

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: Request) {
  try {
    const { email, tool, monthlySavings, annualSavings, auditId } =
      await req.json();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email required" },
        { status: 400 }
      );
    }

    const auditUrl = auditId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/audit/${auditId}`
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

    const highSavings = Number(monthlySavings) >= 500;
    const savingsMonth = Number(monthlySavings).toLocaleString();
    const savingsYear  = Number(annualSavings).toLocaleString();

    const credexBlock = highSavings
      ? `<div style="margin-top:32px;padding:16px;border:1px solid #16a34a;border-radius:8px;background:#f0fdf4;">
          <p style="margin:0 0 8px 0;font-weight:600;color:#15803d;">
            💡 You qualify for Credex credits
          </p>
          <p style="margin:0 0 12px 0;font-size:14px;color:#166534;">
            At $${savingsMonth}/mo in savings, you can capture a significant portion
            through Credex — discounted AI credits sourced from companies that
            overforecast usage (up to 60% off retail).
          </p>
          <a href="https://credex.rocks" style="display:inline-block;background:#16a34a;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
            Book a free Credex consultation →
          </a>
        </div>`
      : "";

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111111;">

        <h2 style="margin-bottom:8px;font-size:22px;">Your AI Spend Audit is ready</h2>

        <p style="margin-bottom:12px;">
          We analyzed your <strong>${tool}</strong> spend and found
          <strong style="color:#16a34a;">$${savingsMonth}/mo</strong>
          in potential savings.
        </p>

        <p style="margin-bottom:20px;">
          That's <strong>$${savingsYear}/year</strong> you could be saving.
        </p>

        <a href="${auditUrl}" style="display:inline-block;background:#000000;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;font-size:15px;">
          View your full audit →
        </a>

        ${credexBlock}

        <p style="margin-top:32px;font-size:12px;color:#9ca3af;">
          You received this because you ran an audit at Overprompt.
          Your data is never sold or shared.
        </p>

      </div>
    `;

    await transporter.sendMail({
      from: `"Overprompt Audit" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Your AI Spend Audit — $${savingsYear}/yr savings found`,
      html,
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("[send-confirmation] error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
