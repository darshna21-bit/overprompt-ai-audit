type AuditInput = {
  tool: string;
  plan: string;
  monthlySpend: number;
  seats: number;
  useCase: string;
};

type AuditResult = {
  recommendation: string;
  monthlySavings: number;
  annualSavings: number;
  reason: string;
};

export function generateAudit(
  input: AuditInput
): AuditResult {
  const { tool, plan, monthlySpend, seats } = input;

  // ChatGPT logic
  if (
    tool === "ChatGPT" &&
    plan === "Team" &&
    seats <= 2
  ) {
    return {
      recommendation: "Switch to ChatGPT Plus",
      monthlySavings: 20,
      annualSavings: 240,
      reason:
        "Small teams using Team plans often overpay compared to individual Plus subscriptions.",
    };
  }

  // Cursor logic
  if (
    tool === "Cursor" &&
    plan === "Business" &&
    seats <= 3
  ) {
    return {
      recommendation: "Downgrade to Cursor Pro",
      monthlySavings: 40,
      annualSavings: 480,
      reason:
        "Business-tier Cursor plans are typically unnecessary for very small engineering teams.",
    };
  }

  // Claude logic
  if (
    tool === "Claude" &&
    plan === "Team" &&
    monthlySpend < 100
  ) {
    return {
      recommendation: "Switch to Claude Pro",
      monthlySavings: 30,
      annualSavings: 360,
      reason:
        "Claude Team pricing becomes inefficient for lower monthly usage levels.",
    };
  }

  // Default case
  return {
    recommendation: "Current setup looks optimized",
    monthlySavings: 0,
    annualSavings: 0,
    reason:
      "Your current AI tooling setup appears cost-efficient based on the provided usage.",
  };
}