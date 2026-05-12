// app/api/generate-summary/route.ts

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      tool,
      plan,
      monthlySpend,
      seats,
      useCase,
      recommendation,
      monthlySavings,
      annualSavings,
      company,
    } = body;

    // Basic input validation
    if (!tool || !plan || monthlySpend === undefined) {
      return NextResponse.json(
        { summary: generateFallback({ tool, plan, monthlySavings, annualSavings, recommendation }) },
        { status: 200 }
      );
    }

    const companyContext = company ? `at ${company}` : "at your company";

    const prompt = `You are a direct, no-nonsense AI infrastructure advisor writing a 90-word audit summary.

Your team ${companyContext} is running ${tool} ${plan} for ${seats} seat(s) at $${monthlySpend}/mo, primarily for ${useCase} work.

Top finding: ${recommendation}
Potential saving: $${monthlySavings}/mo ($${annualSavings}/yr)

Write in second person ("Your team..."). Lead with the single most impactful finding. Be specific — cite the dollar amounts. End with one concrete next action.

Rules:
- No filler phrases like "it's worth noting" or "in conclusion"
- No markdown or bullet points
- Plain prose only
- Exactly 80–100 words`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "",
        "X-Title": "AI Spend Audit",
      },
      body: JSON.stringify({
        // Use a specific model — not "openrouter/auto" which is non-deterministic
        model: "anthropic/claude-3-haiku",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter responded with ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    return NextResponse.json({
      summary: summary || generateFallback({ tool, plan, monthlySavings, annualSavings, recommendation }),
    });
  } catch (error) {
    console.error("[generate-summary] error:", error);

    const body = await new Response(req.body).json().catch(() => ({}));
    return NextResponse.json({
      summary: generateFallback(body),
    });
  }
}

// Meaningful templated fallback — not "insights unavailable"
function generateFallback({
  tool,
  plan,
  monthlySavings,
  annualSavings,
  recommendation,
}: {
  tool?: string;
  plan?: string;
  monthlySavings?: number;
  annualSavings?: number;
  recommendation?: string;
}): string {
  if (monthlySavings && monthlySavings > 0) {
    return `Your current ${tool ?? "AI"} ${plan ?? ""} setup has a clear optimization opportunity. ${recommendation ?? "A plan adjustment is recommended"} — this translates to $${monthlySavings}/mo in direct savings, or $${annualSavings}/yr compounded. The switch carries low operational risk and can typically be completed within one billing cycle. Review your current usage against the recommended plan before making changes.`.trim();
  }
  return `Your ${tool ?? "AI"} ${plan ?? ""} setup appears well-optimized for your current team size and use case. No immediate plan changes are recommended. Continue monitoring usage quarterly — as your team scales, revisit your plan tier to ensure you're not paying for unused capacity.`.trim();
}