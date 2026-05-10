import { NextResponse } from "next/server";

export async function POST(
  req: Request
) {

  try {

    const body = await req.json();

    const {
      tool,
      plan,
      monthlySpend,
      seats,
      useCase,
      recommendation,
      annualSavings,
    } = body;

    const prompt = `
You are an AI infrastructure cost optimization expert.

Analyze this startup's AI tooling setup and generate a professional 80-100 word optimization summary.

Tool: ${tool}
Plan: ${plan}
Monthly Spend: $${monthlySpend}
Seats: ${seats}
Primary Use Case: ${useCase}

Recommendation:
${recommendation}

Potential Annual Savings:
$${annualSavings}

The tone should sound like a real SaaS audit platform.
Be concise, professional, and practical.
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization:
            `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },

        body: JSON.stringify({

          model:
            "openrouter/auto",

          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    const data =
      await response.json();

    console.log(data);

    const summary =
      data.choices?.[0]?.message?.content;

    return NextResponse.json({
      summary:
        summary ||
        "Your AI stack appears reasonably optimized based on current usage patterns.",
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json({
      summary:
        "AI-generated insights are temporarily unavailable. Your current tooling setup appears operationally balanced.",
    });
  }
}