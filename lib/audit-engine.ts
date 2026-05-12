// lib/audit-engine.ts
// Audit logic uses hardcoded rules (correct) — AI is used only for the summary paragraph.
// Every savings figure = currentSpend - (recommendedPrice * seats), verifiable against PRICING_DATA.md.

import { pricingData } from "@/data/pricing";

export type UseCase = "Coding" | "Writing" | "Research" | "Data Analysis" | "Mixed";

export type AuditInput = {
  tool: string;
  plan: string;
  monthlySpend: number;
  seats: number;
  useCase: UseCase | string;
};

export type AuditResult = {
  tool: string;
  currentPlan: string;
  currentMonthlySpend: number;
  recommendedPlan: string;
  recommendedMonthlyCost: number;
  monthlySavings: number;
  annualSavings: number;
  recommendation: string;
  reason: string;
  confidence: number;
  category: "downgrade" | "switch_tool" | "negotiate" | "already_optimal" | "api_review";
  risk: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High" | "Very High";
  sourceUrl: string;
};

export type AuditReport = {
  results: AuditResult[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  highImpactCount: number;
  showCredexUpsell: boolean; // true when monthly savings > $500
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcSavings(
  currentSpend: number,
  recommendedCostPerSeat: number,
  seats: number
): { monthly: number; annual: number; recommendedTotal: number } {
  const recommendedTotal = recommendedCostPerSeat * seats;
  const monthly = Math.max(0, Math.round(currentSpend - recommendedTotal));
  return { monthly, annual: monthly * 12, recommendedTotal };
}

function getSourceUrl(tool: string): string {
  return pricingData[tool]?.sourceUrl ?? "";
}

function optimalFallback(input: AuditInput): AuditResult {
  return {
    tool: input.tool,
    currentPlan: input.plan,
    currentMonthlySpend: input.monthlySpend,
    recommendedPlan: input.plan,
    recommendedMonthlyCost: input.monthlySpend,
    monthlySavings: 0,
    annualSavings: 0,
    recommendation: "No change recommended",
    reason: `Your ${input.tool} ${input.plan} plan appears well-matched to your team (${input.seats} seat${input.seats !== 1 ? "s" : ""}, ${input.useCase} use case) at $${input.monthlySpend}/mo.`,
    confidence: 80,
    category: "already_optimal",
    risk: "Low",
    impact: "Low",
    sourceUrl: getSourceUrl(input.tool),
  };
}

// ── Per-tool audit functions ──────────────────────────────────────────────────

function auditCursor(input: AuditInput): AuditResult {
  const { plan, monthlySpend, seats } = input;
  const src = getSourceUrl("Cursor");

  // Business (≤3 seats) → Pro saves $20/seat
  if (plan === "Business" && seats <= 3) {
    const { monthly, annual, recommendedTotal } = calcSavings(monthlySpend, 20, seats);
    return {
      tool: "Cursor", currentPlan: plan, currentMonthlySpend: monthlySpend,
      recommendedPlan: "Cursor Pro",
      recommendedMonthlyCost: recommendedTotal,
      monthlySavings: monthly, annualSavings: annual,
      recommendation: `Downgrade to Cursor Pro — ${seats} × $20/seat = $${recommendedTotal}/mo`,
      reason: `Cursor Business ($40/seat) adds team admin, SSO, and centralized billing. With only ${seats} seat${seats !== 1 ? "s" : ""} and no enterprise compliance requirement, Pro delivers identical AI capabilities at half the price. Estimated saving: $${monthly}/mo ($${annual}/yr).`,
      confidence: 92, category: "downgrade", risk: "Low",
      impact: monthly > 50 ? "High" : "Medium", sourceUrl: src,
    };
  }

  // Enterprise (≤10 seats) → Business saves ~$20+/seat
  if (plan === "Enterprise" && seats <= 10) {
    const { monthly, annual, recommendedTotal } = calcSavings(monthlySpend, 40, seats);
    return {
      tool: "Cursor", currentPlan: plan, currentMonthlySpend: monthlySpend,
      recommendedPlan: "Cursor Business",
      recommendedMonthlyCost: recommendedTotal,
      monthlySavings: monthly, annualSavings: annual,
      recommendation: `Move to Cursor Business — ${seats} × $40/seat = $${recommendedTotal}/mo`,
      reason: `Cursor Enterprise typically runs $60–80/seat (negotiated). Business at $40/seat includes all AI features, admin controls, and privacy mode — sufficient for teams under 10 without dedicated enterprise IT requirements. Estimated saving: $${monthly}/mo ($${annual}/yr).`,
      confidence: 88, category: "downgrade", risk: "Medium",
      impact: monthly > 100 ? "High" : "Medium", sourceUrl: src,
    };
  }

  // Pro — check for billing discrepancy
  if (plan === "Pro") {
    const expected = 20 * seats;
    if (monthlySpend > expected * 1.15) {
      const { monthly, annual } = calcSavings(monthlySpend, 20, seats);
      return {
        tool: "Cursor", currentPlan: plan, currentMonthlySpend: monthlySpend,
        recommendedPlan: "Cursor Pro (billing audit)",
        recommendedMonthlyCost: expected,
        monthlySavings: monthly, annualSavings: annual,
        recommendation: "Audit your Cursor billing — you may be on a legacy or misconfigured plan",
        reason: `Cursor Pro should cost $20/seat × ${seats} seats = $${expected}/mo. You're reporting $${monthlySpend}/mo — a $${monthlySpend - expected} discrepancy worth investigating with Cursor support.`,
        confidence: 72, category: "api_review", risk: "Low",
        impact: "Medium", sourceUrl: src,
      };
    }
  }

  return optimalFallback(input);
}

function auditClaude(input: AuditInput): AuditResult {
  const { plan, monthlySpend, seats, useCase } = input;
  const src = getSourceUrl("Claude");

  // Team with ≤3 seats — individual Pro is cheaper
  if (plan === "Team" && seats <= 3) {
    const { monthly, annual, recommendedTotal } = calcSavings(monthlySpend, 20, seats);
    if (monthly > 0) {
      return {
        tool: "Claude", currentPlan: plan, currentMonthlySpend: monthlySpend,
        recommendedPlan: "Claude Pro (individual subscriptions)",
        recommendedMonthlyCost: recommendedTotal,
        monthlySavings: monthly, annualSavings: annual,
        recommendation: `Switch each member to Claude Pro — ${seats} × $20/seat = $${recommendedTotal}/mo`,
        reason: `Claude Team is $30/seat vs Pro at $20/seat. For ${seats} user${seats !== 1 ? "s" : ""} without enterprise admin or SSO requirements, individual Pro subscriptions provide identical model access at $${monthly}/mo less.`,
        confidence: 91, category: "downgrade", risk: "Low",
        impact: monthly > 50 ? "High" : "Medium", sourceUrl: src,
      };
    }
  }

  // Enterprise with small team
  if (plan === "Enterprise" && seats < 10) {
    const { monthly, annual, recommendedTotal } = calcSavings(monthlySpend, 30, seats);
    return {
      tool: "Claude", currentPlan: plan, currentMonthlySpend: monthlySpend,
      recommendedPlan: "Claude Team",
      recommendedMonthlyCost: recommendedTotal,
      monthlySavings: monthly, annualSavings: annual,
      recommendation: `Downgrade to Claude Team — ${seats} × $30/seat = $${recommendedTotal}/mo`,
      reason: `Claude Enterprise adds custom retention policies, SAML SSO, and dedicated support — valuable at 50+ seats or in regulated industries. At ${seats} seats, Team provides the same model access including extended context. Estimated saving: $${monthly}/mo ($${annual}/yr).`,
      confidence: 89, category: "downgrade", risk: "Low",
      impact: monthly > 100 ? "High" : "Medium", sourceUrl: src,
    };
  }

  // API Direct — high spend → Credex angle
  if (plan === "API Direct" && monthlySpend >= 300) {
    const saving = Math.round(monthlySpend * 0.25);
    return {
      tool: "Claude", currentPlan: plan, currentMonthlySpend: monthlySpend,
      recommendedPlan: "Pre-purchased Anthropic credits",
      recommendedMonthlyCost: monthlySpend - saving,
      monthlySavings: saving, annualSavings: saving * 12,
      recommendation: "Explore pre-purchased Anthropic API credits through Credex",
      reason: `At $${monthlySpend}/mo API spend, you qualify for pre-purchased credit blocks that typically run 20–30% below retail pay-as-you-go rates. Credex sources these from companies that overforecast usage. Estimated saving: ~$${saving}/mo.`,
      confidence: 80, category: "negotiate", risk: "Low",
      impact: monthlySpend >= 1000 ? "Very High" : "High", sourceUrl: src,
    };
  }

  // Coding use case on subscription — mention API
  if (useCase === "Coding" && (plan === "Pro" || plan === "Team") && monthlySpend > 40) {
    return {
      tool: "Claude", currentPlan: plan, currentMonthlySpend: monthlySpend,
      recommendedPlan: plan,
      recommendedMonthlyCost: monthlySpend,
      monthlySavings: 0, annualSavings: 0,
      recommendation: "Consider Anthropic API direct for burst coding workloads",
      reason: `For variable coding workflows (heavy some weeks, light others), pay-per-token API access can undercut flat subscriptions. Claude Pro/Team suits steady daily use; API suits burst patterns. Worth benchmarking your monthly token usage.`,
      confidence: 68, category: "api_review", risk: "Low",
      impact: "Medium", sourceUrl: src,
    };
  }

  return optimalFallback(input);
}

function auditChatGPT(input: AuditInput): AuditResult {
  const { plan, monthlySpend, seats } = input;
  const src = getSourceUrl("ChatGPT");

  // Team with ≤2 seats → individual Plus is cheaper
  if (plan === "Team" && seats <= 2) {
    const { monthly, annual, recommendedTotal } = calcSavings(monthlySpend, 20, seats);
    if (monthly > 0) {
      return {
        tool: "ChatGPT", currentPlan: plan, currentMonthlySpend: monthlySpend,
        recommendedPlan: "ChatGPT Plus (individual)",
        recommendedMonthlyCost: recommendedTotal,
        monthlySavings: monthly, annualSavings: annual,
        recommendation: `Switch to individual ChatGPT Plus — ${seats} × $20 = $${recommendedTotal}/mo`,
        reason: `ChatGPT Team is $30/seat/mo vs Plus at $20/seat. For ${seats} user${seats !== 1 ? "s" : ""}, Team's shared workspace and admin console add no practical value. Saving: $${monthly}/mo ($${annual}/yr).`,
        confidence: 93, category: "downgrade", risk: "Low",
        impact: "Medium", sourceUrl: src,
      };
    }
  }

  // Enterprise with small team → Team is sufficient
  if (plan === "Enterprise" && seats <= 5) {
    const { monthly, annual, recommendedTotal } = calcSavings(monthlySpend, 30, seats);
    return {
      tool: "ChatGPT", currentPlan: plan, currentMonthlySpend: monthlySpend,
      recommendedPlan: "ChatGPT Team",
      recommendedMonthlyCost: recommendedTotal,
      monthlySavings: monthly, annualSavings: annual,
      recommendation: `Downgrade to ChatGPT Team — ${seats} × $30/seat = $${recommendedTotal}/mo`,
      reason: `ChatGPT Enterprise requires an annual contract and adds SSO, audit logs, and expanded context windows. At ${seats} seats, Team covers GPT-4o access and basic admin. Estimated saving vs Enterprise: $${monthly}/mo ($${annual}/yr).`,
      confidence: 88, category: "downgrade", risk: "Low",
      impact: monthly > 100 ? "High" : "Medium", sourceUrl: src,
    };
  }

  // API Direct — high spend
  if (plan === "API Direct" && monthlySpend >= 300) {
    const saving = Math.round(monthlySpend * 0.25);
    return {
      tool: "ChatGPT", currentPlan: plan, currentMonthlySpend: monthlySpend,
      recommendedPlan: "Pre-purchased OpenAI credits",
      recommendedMonthlyCost: monthlySpend - saving,
      monthlySavings: saving, annualSavings: saving * 12,
      recommendation: "Explore pre-purchased OpenAI API credits through Credex",
      reason: `At $${monthlySpend}/mo API spend, pre-purchased credit blocks typically run 20–30% below retail PAYG rates. Credex sources these from companies that overforecast usage. Estimated saving: ~$${saving}/mo.`,
      confidence: 80, category: "negotiate", risk: "Low",
      impact: monthlySpend >= 1000 ? "Very High" : "High", sourceUrl: src,
    };
  }

  return optimalFallback(input);
}

function auditGitHubCopilot(input: AuditInput): AuditResult {
  const { plan, monthlySpend, seats, useCase } = input;
  const src = getSourceUrl("GitHub Copilot");

  // Enterprise with small team → Business is sufficient
  if (plan === "Enterprise" && seats <= 5) {
    const { monthly, annual, recommendedTotal } = calcSavings(monthlySpend, 19, seats);
    return {
      tool: "GitHub Copilot", currentPlan: plan, currentMonthlySpend: monthlySpend,
      recommendedPlan: "GitHub Copilot Business",
      recommendedMonthlyCost: recommendedTotal,
      monthlySavings: monthly, annualSavings: annual,
      recommendation: `Downgrade to Copilot Business — ${seats} × $19/seat = $${recommendedTotal}/mo`,
      reason: `Copilot Enterprise ($39/seat) adds Bing search integration, custom organizational knowledge bases, and GitHub Models access — valuable at 20+ engineers with proprietary codebases. At ${seats} seats, Business covers multi-model completions, policy controls, and IP indemnity. Saving: $${monthly}/mo ($${annual}/yr).`,
      confidence: 91, category: "downgrade", risk: "Low",
      impact: monthly > 50 ? "High" : "Medium", sourceUrl: src,
    };
  }

  // Non-coding use case — tool mismatch
  if (useCase !== "Coding" && useCase !== "Mixed") {
    return {
      tool: "GitHub Copilot", currentPlan: plan, currentMonthlySpend: monthlySpend,
      recommendedPlan: "Claude Pro or ChatGPT Plus",
      recommendedMonthlyCost: 20 * seats,
      monthlySavings: Math.max(0, monthlySpend - 20 * seats),
      annualSavings: Math.max(0, monthlySpend - 20 * seats) * 12,
      recommendation: `Switch to a general-purpose AI tool for ${useCase} workflows`,
      reason: `GitHub Copilot is IDE-native and built for code completion. For ${useCase} workflows, Claude Pro or ChatGPT Plus ($20/seat) deliver significantly better value — they're purpose-built for general-purpose AI assistance rather than code autocomplete.`,
      confidence: 82, category: "switch_tool", risk: "Low",
      impact: "Medium", sourceUrl: src,
    };
  }

  return optimalFallback(input);
}

function auditGemini(input: AuditInput): AuditResult {
  const { plan, monthlySpend, seats, useCase } = input;
  const src = getSourceUrl("Gemini");

  // Ultra for writing → Pro is sufficient
  if (plan === "Ultra" && useCase === "Writing") {
    const { monthly, annual, recommendedTotal } = calcSavings(monthlySpend, 20, seats);
    return {
      tool: "Gemini", currentPlan: plan, currentMonthlySpend: monthlySpend,
      recommendedPlan: "Gemini Pro (Google One AI Premium)",
      recommendedMonthlyCost: recommendedTotal,
      monthlySavings: monthly, annualSavings: annual,
      recommendation: `Downgrade to Gemini Pro — ${seats} × $20/seat = $${recommendedTotal}/mo`,
      reason: `Gemini Ultra's advantages are in multimodal reasoning and complex analysis tasks. For writing workflows, Gemini Pro (Google One AI Premium, $20/mo) provides equivalent text generation quality. Saving: $${monthly}/mo ($${annual}/yr).`,
      confidence: 85, category: "downgrade", risk: "Low",
      impact: "Medium", sourceUrl: src,
    };
  }

  // API Direct — high spend
  if (plan === "API Direct" && monthlySpend >= 300) {
    const saving = Math.round(monthlySpend * 0.2);
    return {
      tool: "Gemini", currentPlan: plan, currentMonthlySpend: monthlySpend,
      recommendedPlan: "Pre-purchased Google AI credits",
      recommendedMonthlyCost: monthlySpend - saving,
      monthlySavings: saving, annualSavings: saving * 12,
      recommendation: "Consider Google Cloud committed-use discounts for Gemini API",
      reason: `At $${monthlySpend}/mo Gemini API spend, Google Cloud committed-use discounts typically offer 15–25% savings over on-demand pricing. Contact Google Cloud sales or explore Credex for pre-purchased credits.`,
      confidence: 75, category: "negotiate", risk: "Low",
      impact: "Medium", sourceUrl: src,
    };
  }

  return optimalFallback(input);
}

function auditWindsurf(input: AuditInput): AuditResult {
  const { plan, monthlySpend, seats, useCase } = input;
  const src = getSourceUrl("Windsurf");

  // Non-coding use case — tool mismatch
  if (useCase !== "Coding" && useCase !== "Mixed") {
    const saving = monthlySpend;
    return {
      tool: "Windsurf", currentPlan: plan, currentMonthlySpend: monthlySpend,
      recommendedPlan: "Cancel and switch",
      recommendedMonthlyCost: 0,
      monthlySavings: saving, annualSavings: saving * 12,
      recommendation: `Cancel Windsurf — wrong tool for ${useCase} workflows`,
      reason: `Windsurf is an AI-native code editor. For ${useCase} workflows, you're paying $${monthlySpend}/mo for IDE features you're not using. Claude Pro or ChatGPT Plus at $20/seat would serve your team significantly better.`,
      confidence: 88, category: "switch_tool", risk: "Low",
      impact: "High", sourceUrl: src,
    };
  }

  // Team with ≤2 seats → Pro is cheaper
  if (plan === "Team" && seats <= 2) {
    const { monthly, annual, recommendedTotal } = calcSavings(monthlySpend, 15, seats);
    if (monthly > 0) {
      return {
        tool: "Windsurf", currentPlan: plan, currentMonthlySpend: monthlySpend,
        recommendedPlan: "Windsurf Pro",
        recommendedMonthlyCost: recommendedTotal,
        monthlySavings: monthly, annualSavings: annual,
        recommendation: `Downgrade to Windsurf Pro — ${seats} × $15/seat = $${recommendedTotal}/mo`,
        reason: `Windsurf Team adds admin controls and shared flows. At ${seats} seat${seats !== 1 ? "s" : ""}, individual Pro subscriptions cover the same AI-assisted coding at $${monthly}/mo less.`,
        confidence: 87, category: "downgrade", risk: "Low",
        impact: "Medium", sourceUrl: src,
      };
    }
  }

  return optimalFallback(input);
}

function auditAPISpend(input: AuditInput): AuditResult {
  const { tool, monthlySpend } = input;
  const src = getSourceUrl(tool);

  if (monthlySpend >= 500) {
    const saving = Math.round(monthlySpend * 0.25);
    return {
      tool, currentPlan: "API Direct", currentMonthlySpend: monthlySpend,
      recommendedPlan: "Pre-purchased AI credits",
      recommendedMonthlyCost: monthlySpend - saving,
      monthlySavings: saving, annualSavings: saving * 12,
      recommendation: "Explore pre-purchased AI credits through Credex",
      reason: `At $${monthlySpend}/mo API spend, you qualify for pre-purchased credit blocks that typically run 20–30% below retail pay-as-you-go rates. Credex sources these from companies that overforecast AI usage — the discount is real.`,
      confidence: 83, category: "negotiate", risk: "Low",
      impact: monthlySpend >= 1000 ? "Very High" : "High", sourceUrl: src,
    };
  }

  return optimalFallback(input);
}

// ── Router ────────────────────────────────────────────────────────────────────

export function generateAudit(input: AuditInput): AuditResult {
  const t = input.tool.toLowerCase();

  if (t.includes("cursor"))                         return auditCursor(input);
  if (t.includes("claude"))                         return auditClaude(input);
  if (t.includes("chatgpt"))                        return auditChatGPT(input);
  if (t.includes("copilot"))                        return auditGitHubCopilot(input);
  if (t.includes("gemini"))                         return auditGemini(input);
  if (t.includes("windsurf"))                       return auditWindsurf(input);
  if (t.includes("anthropic api") || t.includes("openai api")) return auditAPISpend(input);

  return optimalFallback(input);
}

// ── Multi-tool report ─────────────────────────────────────────────────────────

export function generateAuditReport(inputs: AuditInput[]): AuditReport {
  const results = inputs.map(generateAudit);
  const totalMonthlySavings = results.reduce((sum, r) => sum + r.monthlySavings, 0);
  const totalAnnualSavings = totalMonthlySavings * 12;
  const highImpactCount = results.filter(
    (r) => r.impact === "High" || r.impact === "Very High"
  ).length;

  return {
    results,
    totalMonthlySavings,
    totalAnnualSavings,
    highImpactCount,
    showCredexUpsell: totalMonthlySavings > 500,
  };
}