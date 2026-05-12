import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function POST(
  req: Request
) {

  try {

    const {
      email,
      tool,
      monthlySavings,
      annualSavings,
      auditId,
    } = await req.json();

    const data =
      await resend.emails.send({

        from:
          "onboarding@resend.dev",

        to: email,

        subject:
          `Your AI Spend Audit — $${annualSavings.toLocaleString()}/yr savings found`,

        html: `
          <h2>Your AI Spend Audit is ready</h2>

          <p>
            We analyzed your ${tool} spend and found 
            <strong>$${monthlySavings}/mo</strong> 
            in potential savings.
          </p>

          <p>
            That's 
            <strong>$${annualSavings.toLocaleString()}/year</strong> 
            you could be saving.
          </p>

          <a 
            href="${process.env.NEXT_PUBLIC_APP_URL}/audit/${auditId}"
            style="
              display:inline-block;
              background:#000;
              color:#fff;
              padding:12px 24px;
              border-radius:8px;
              text-decoration:none;
              margin-top:16px;
            "
          >
            View your full audit →
          </a>
        `,
      });

    console.log(data);

    return NextResponse.json({
      ok: true,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to send email",
      },
      {
        status: 500,
      }
    );
  }
}