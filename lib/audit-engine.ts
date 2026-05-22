// lib/audit-engine.ts
// Audit logic uses hardcoded rules (correct) — AI is used only for the summary paragraph.
// Every savings figure = currentSpend - (recommendedPrice * seats), verifiable against pricing.ts.
//
// Prices verified May 22, 2026. Key corrections vs prior version:
//   - ChatGPT Plus: confirmed $20/mo
//   - ChatGPT Team renamed to "Business": $30/seat monthly / $25/seat annual
//   - Claude Pro: confirmed $20/mo
//   - Claude Team Standard: $25/seat monthly / $20/seat annual (min 5 seats)
//   - Claude Team Premium: $125/seat monthly (includes Claude Code)
//   - Claude Max 5x: $100/mo (was $80 — corrected)
//   - Claude Enterprise: $20/seat + usage at API rates (was $60 est.; self-serve, up to 150 seats)
//   - Cursor plans: Hobby(free), Pro($35), Pro+($60), Ultra($250), Teams($40/seat) — corrected
//   - GitHub Copilot: Pro($10), Pro+($39), Business($19/seat), Enterprise($39/seat)
//   - Windsurf: Pro($20), Max($200), Teams($55/seat) — corrected

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
  showCredexUpsell: boolean;
};

// ── Canonical plan prices ─────────────────────────────────────────────────────
// Single source of truth. Update here when vendor prices change —
// the snapshot diff in route.ts will automatically detect and email users.
// Prices = per-seat monthly (monthly billing). Annual prices in comments.
export const PLAN_PRICES: Record<string, Record<string, number>> = {
  ChatGPT: {
    "Free":       0,
    "Go":         8,
    "Plus":       20,
    "Pro $100":   100,
    "Pro $200":   200,
    "Business":   30,   // $25/seat if annual
    "Enterprise": 60,   // estimated; 150-seat min
  },
  Claude: {
    "Free":          0,
    "Pro":           20,  // $17/mo if annual
    "Max 5x":        100,
    "Max 20x":       200,
    "Team":          25,  // alias for Team Standard; $20/seat if annual
    "Team Standard": 25,  // $20/seat if annual
    "Team Premium":  125, // $100/seat if annual; includes Claude Code
    "Enterprise":    20,  // $20/seat + usage at API rates; self-serve, up to 150 seats
  },
  Cursor: {
    "Hobby":      0,
    "Pro":        35,  // $16/mo if annual
    "Pro+":       60,
    "Ultra":      250,
    "Teams":      40,  // $32/seat if annual
    "Enterprise": 60,  // estimated
  },
  "GitHub Copilot": {
    "Free":       0,
    "Pro":        10,  // $8.33/mo if annual ($100/yr)
    "Pro+":       39,  // monthly only
    "Business":   19,
    "Enterprise": 39,  // + $21 GitHub Enterprise Cloud = ~$60 effective
  },
  Gemini: {
    "Free":       0,
    "Pro":        20,
    "API Direct": 0,
  },
  Windsurf: {
    "Free":       0,
    "Pro":        20,
    "Max":        200,
    "Teams":      55,  // verified windsurf.com May 22 2026
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function knownPlanPrice(tool: string, plan: string): number | null {
  const price = PLAN_PRICES[tool]?.[plan];
  return price !== undefined ? price : null;
}

/**
 * Given a tool and a per-seat budget, return the most capable plan whose
 * per-seat price does NOT exceed that budget. Plans with price 0 (Free) are
 * excluded from "best paid" logic — callers handle free-tier separately.
 *
 * Returns { name, pricePerSeat } or null if nothing fits.
 */
function bestPlanForBudget(
  tool: string,
  maxPricePerSeat: number,
  excludePlans: string[] = []
): { name: string; pricePerSeat: number } | null {
  const plans = PLAN_PRICES[tool];
  if (!plans) return null;

  const candidates = Object.entries(plans)
    .filter(([name, price]) =>
      price > 0 &&
      price <= maxPricePerSeat &&
      !excludePlans.includes(name)
    )
    // Sort descending by price — highest affordable plan is the most capable
    .sort((a, b) => b[1] - a[1]);

  if (candidates.length === 0) return null;
  return { name: candidates[0][0], pricePerSeat: candidates[0][1] };
}

/**
 * Given a tool and a minimum required price per seat (exclusive), return the
 * cheapest plan above that threshold. Used for "next tier up" suggestions.
 */
function cheapestPlanAbove(
  tool: string,
  minPricePerSeat: number,
  excludePlans: string[] = []
): { name: string; pricePerSeat: number } | null {
  const plans = PLAN_PRICES[tool];
  if (!plans) return null;

  const candidates = Object.entries(plans)
    .filter(([name, price]) =>
      price > minPricePerSeat &&
      !excludePlans.includes(name)
    )
    .sort((a, b) => a[1] - b[1]);

  if (candidates.length === 0) return null;
  return { name: candidates[0][0], pricePerSeat: candidates[0][1] };
}

/**
 * Billing sanity check — fires when user is paying >10% over the known
 * current price for their plan. Catches legacy pricing, duplicate seats,
 * and invoicing errors without needing a tier change to apply.
 */
function billingDiscrepancyCheck(input: AuditInput, src: string): AuditResult | null {
  const { tool, plan, monthlySpend, seats } = input;
  const pricePerSeat = knownPlanPrice(tool, plan);
  if (pricePerSeat === null || pricePerSeat === 0) return null;

  const expected = pricePerSeat * seats;
  if (monthlySpend <= expected * 1.1) return null;

  const monthly = Math.round(monthlySpend - expected);
  return {
    tool, currentPlan: plan, currentMonthlySpend: monthlySpend,
    recommendedPlan: `${plan} (billing audit)`,
    recommendedMonthlyCost: expected,
    monthlySavings: monthly, annualSavings: monthly * 12,
    recommendation: `Audit your ${tool} billing — you may be on legacy pricing`,
    reason: `${tool} ${plan} should cost $${pricePerSeat}/seat × ${seats} seat${seats !== 1 ? "s" : ""} = $${expected}/mo at current pricing. You're reporting $${monthlySpend}/mo — a $${monthly}/mo discrepancy. This often means a legacy rate, duplicate seats, or an invoicing error. Contact ${tool} support to reconcile.`,
    confidence: 78, category: "api_review", risk: "Low",
    impact: monthly > 50 ? "High" : "Medium", sourceUrl: src,
  };
}

/**
 * "Already optimal" fallback — uses canonical price (not user's spend)
 * so when PLAN_PRICES changes, the snapshot diff fires automatically.
 */
function optimalFallback(input: AuditInput): AuditResult {
  const { tool, plan, monthlySpend, seats, useCase } = input;
  const src = getSourceUrl(tool);
  const pricePerSeat = knownPlanPrice(tool, plan);
  const canonicalCost =
    pricePerSeat !== null && pricePerSeat > 0 ? pricePerSeat * seats : monthlySpend;

  return {
    tool, currentPlan: plan, currentMonthlySpend: monthlySpend,
    recommendedPlan: plan,
    recommendedMonthlyCost: canonicalCost,
    monthlySavings: 0, annualSavings: 0,
    recommendation: "No change recommended",
    reason: `Your ${tool} ${plan} plan appears well-matched to your team (${seats} seat${seats !== 1 ? "s" : ""}, ${useCase} use case) at $${canonicalCost}/mo.`,
    confidence: 80, category: "already_optimal", risk: "Low", impact: "Low",
    sourceUrl: src,
  };
}

// ── Shared downgrade builder ──────────────────────────────────────────────────
// Used by every tool that detects a cheaper plan exists for the same capability.

function buildDowngradeResult(
  input: AuditInput,
  recommendedPlanName: string,
  recommendedPricePerSeat: number,
  reasonText: string,
  confidence: number,
  src: string,
  risk: "Low" | "Medium" | "High" = "Low"
): AuditResult {
  const { tool, plan, monthlySpend, seats } = input;
  const { monthly, annual, recommendedTotal } = calcSavings(
    monthlySpend,
    recommendedPricePerSeat,
    seats
  );
  return {
    tool, currentPlan: plan, currentMonthlySpend: monthlySpend,
    recommendedPlan: recommendedPlanName,
    recommendedMonthlyCost: recommendedTotal,
    monthlySavings: monthly, annualSavings: annual,
    recommendation: `Switch to ${recommendedPlanName} — ${seats} × $${recommendedPricePerSeat}/seat = $${recommendedTotal}/mo`,
    reason: reasonText,
    confidence,
    category: "downgrade",
    risk,
    impact: monthly >= 200 ? "Very High" : monthly > 100 ? "High" : monthly > 50 ? "Medium" : "Low",
    sourceUrl: src,
  };
}

// ── Shared wrong-tool result builder ─────────────────────────────────────────

function buildWrongToolResult(
  input: AuditInput,
  alternativeTool: string,
  alternativePricePerSeat: number,
  src: string
): AuditResult {
  const { tool, plan, monthlySpend, seats, useCase } = input;
  const recommendedTotal = alternativePricePerSeat * seats;
  const monthly = Math.max(0, Math.round(monthlySpend - recommendedTotal));
  return {
    tool, currentPlan: plan, currentMonthlySpend: monthlySpend,
    recommendedPlan: alternativeTool,
    recommendedMonthlyCost: recommendedTotal,
    monthlySavings: monthly, annualSavings: monthly * 12,
    recommendation: `Switch to ${alternativeTool} for ${useCase} workflows`,
    reason: `${tool} is purpose-built for code. For ${useCase} tasks, ${alternativeTool} ($${alternativePricePerSeat}/seat) delivers significantly better value — you're paying for IDE features you're not using.`,
    confidence: 85, category: "switch_tool", risk: "Low",
    impact: monthly >= 100 ? "High" : "Medium",
    sourceUrl: src,
  };
}

// ── Shared negotiate / credits result builder ─────────────────────────────────

function buildNegotiateResult(
  input: AuditInput,
  savingsPct: number,
  description: string,
  src: string
): AuditResult {
  const { tool, plan, monthlySpend } = input;
  const saving = Math.round(monthlySpend * savingsPct);
  return {
    tool, currentPlan: plan, currentMonthlySpend: monthlySpend,
    recommendedPlan: "Pre-purchased AI credits",
    recommendedMonthlyCost: monthlySpend - saving,
    monthlySavings: saving, annualSavings: saving * 12,
    recommendation: description,
    reason: `At $${monthlySpend}/mo API spend, pre-purchased credit blocks typically run ${Math.round(savingsPct * 100)}% below retail pay-as-you-go rates. ${description}. Credex sources these from companies that overforecast AI usage — the discount is real.`,
    confidence: 80, category: "negotiate", risk: "Low",
    impact: monthlySpend >= 1000 ? "Very High" : "High",
    sourceUrl: src,
  };
}

// ── Per-tool audit functions ──────────────────────────────────────────────────
// Each function derives its recommendations entirely from PLAN_PRICES —
// no plan names or thresholds are hardcoded inside the decision logic.

function auditCursor(input: AuditInput): AuditResult {
  const { plan, monthlySpend, seats } = input;
  const src = getSourceUrl("Cursor");
  const plans = PLAN_PRICES["Cursor"];

  const currentPricePerSeat = knownPlanPrice("Cursor", plan) ?? 0;

  // Find the cheapest plan that covers the same per-seat price bracket
  // (i.e., any plan strictly cheaper than what they're on)
  const cheaper = bestPlanForBudget("Cursor", currentPricePerSeat - 1, [plan, "Hobby"]);

  if (cheaper) {
    const projectedTotal = cheaper.pricePerSeat * seats;
    const monthly = Math.max(0, Math.round(monthlySpend - projectedTotal));

    if (monthly > 0) {
      // Determine why current plan is overkill
      let reason = "";
      if (plan === "Teams" || plan === "Enterprise") {
        reason = `${plan} adds admin controls and centralised billing, but ${cheaper.name} at $${cheaper.pricePerSeat}/seat delivers the same AI capabilities. At ${seats} seat${seats !== 1 ? "s" : ""}, the overhead features aren't worth the $${monthly}/mo premium.`;
      } else if (plan === "Ultra" || plan === "Pro+") {
        reason = `${plan} ($${currentPricePerSeat}/seat) is designed for very high-volume usage. Dropping to ${cheaper.name} ($${cheaper.pricePerSeat}/seat) and paying overflow charges only when you exceed limits is likely cheaper for ${seats} seat${seats !== 1 ? "s" : ""}. Monitor usage for one month before committing.`;
      } else {
        reason = `${cheaper.name} at $${cheaper.pricePerSeat}/seat covers your workflow at $${monthly}/mo less than ${plan}.`;
      }

      return buildDowngradeResult(
        input,
        `Cursor ${cheaper.name}`,
        cheaper.pricePerSeat,
        reason,
        plan === "Teams" ? 92 : plan === "Enterprise" ? 88 : 72,
        src,
        plan === "Enterprise" ? "Medium" : "Low"
      );
    }
  }

  const discrepancy = billingDiscrepancyCheck(input, src);
  if (discrepancy) return discrepancy;

  return optimalFallback(input);
}

function auditClaude(input: AuditInput): AuditResult {
  const { plan, monthlySpend, seats, useCase } = input;
  const src = getSourceUrl("Claude");
  const plans = PLAN_PRICES["Claude"];

  const currentPricePerSeat = knownPlanPrice("Claude", plan) ?? 0;

  // Normalise Team alias so comparisons are consistent
  const normalisedPlan = plan === "Team" ? "Team Standard" : plan;

  // Find the cheapest plan that is strictly less expensive than current
  const cheaper = bestPlanForBudget(
    "Claude",
    currentPricePerSeat - 1,
    [normalisedPlan, plan, "Free"]
  );

  if (cheaper) {
    const projectedTotal = cheaper.pricePerSeat * seats;
    const monthly = Math.max(0, Math.round(monthlySpend - projectedTotal));

    if (monthly > 0) {
      let reason = "";

      if (normalisedPlan === "Enterprise") {
        reason = `Claude Enterprise ($${currentPricePerSeat}/seat + usage at API rates) adds HIPAA readiness, SCIM, audit logs, and custom data retention. At ${seats} seat${seats !== 1 ? "s" : ""}, ${cheaper.name} provides the same model access with SSO and admin controls at $${monthly}/mo less.`;
      } else if (normalisedPlan === "Team Premium") {
        reason = `Claude Team Premium ($${currentPricePerSeat}/seat) includes Claude Code and admin controls. For ${seats} user${seats !== 1 ? "s" : ""}, ${cheaper.name} at $${cheaper.pricePerSeat}/seat provides the same frontier model access. Individual subscriptions avoid the team overhead at $${monthly}/mo less.`;
      } else if (normalisedPlan === "Team Standard") {
        reason = `Claude Team Standard is $${currentPricePerSeat}/seat vs ${cheaper.name} at $${cheaper.pricePerSeat}/seat. For ${seats} user${seats !== 1 ? "s" : ""} without enterprise admin or SSO requirements, ${cheaper.name} provides identical model access at $${monthly}/mo less. Note: Team Standard requires a 5-seat minimum — if you're under that, individual plans are your only self-serve option anyway.`;
      } else {
        reason = `${cheaper.name} at $${cheaper.pricePerSeat}/seat covers your usage at $${monthly}/mo less than ${normalisedPlan}.`;
      }

      return buildDowngradeResult(
        input,
        `Claude ${cheaper.name}`,
        cheaper.pricePerSeat,
        reason,
        normalisedPlan === "Team Standard" ? 91 : 87,
        src
      );
    }
  }

  // API Direct — high spend → Credex angle
  if (plan === "API Direct" && monthlySpend >= 300) {
    return buildNegotiateResult(
      input,
      0.25,
      "Explore pre-purchased Anthropic API credits through Credex",
      src
    );
  }

  // Coding use case on subscription — mention API for burst workloads
  if (
    useCase === "Coding" &&
    (plan === "Pro" || plan === "Team" || plan === "Team Standard") &&
    monthlySpend > 40
  ) {
    const discrepancy = billingDiscrepancyCheck(input, src);
    if (discrepancy) return discrepancy;
    return {
      tool: "Claude", currentPlan: plan, currentMonthlySpend: monthlySpend,
      recommendedPlan: plan,
      recommendedMonthlyCost: monthlySpend,
      monthlySavings: 0, annualSavings: 0,
      recommendation: "Consider Anthropic API direct for burst coding workloads",
      reason: `For variable coding workflows (heavy some weeks, light others), pay-per-token API access can undercut flat subscriptions. Claude Pro/Team suits steady daily use; API suits burst patterns. Worth benchmarking your monthly token usage against the $3/$15 per MTok Sonnet 4.6 rate.`,
      confidence: 68, category: "api_review", risk: "Low",
      impact: "Medium", sourceUrl: src,
    };
  }

  const discrepancy = billingDiscrepancyCheck(input, src);
  if (discrepancy) return discrepancy;

  return optimalFallback(input);
}

function auditChatGPT(input: AuditInput): AuditResult {
  const { plan, monthlySpend, seats } = input;
  const src = getSourceUrl("ChatGPT");

  const currentPricePerSeat = knownPlanPrice("ChatGPT", plan) ?? 0;

  // Find the cheapest plan strictly less expensive than current
  const cheaper = bestPlanForBudget(
    "ChatGPT",
    currentPricePerSeat - 1,
    [plan, "Free"]
  );

  if (cheaper) {
    const projectedTotal = cheaper.pricePerSeat * seats;
    const monthly = Math.max(0, Math.round(monthlySpend - projectedTotal));

    if (monthly > 0) {
      let reason = "";

      if (plan === "Enterprise") {
        reason = `ChatGPT Enterprise (~$${currentPricePerSeat}/seat, 150-seat min, annual contract) adds multi-region data residency, 24/7 SLA, and full audit logs. At ${seats} seat${seats !== 1 ? "s" : ""}, ${cheaper.name} covers the latest GPT model access, SAML SSO, and SOC 2 compliance at $${monthly}/mo less.`;
      } else if (plan === "Business" || plan === "Team") {
        reason = `ChatGPT ${plan} ($${currentPricePerSeat}/seat) adds shared workspace and admin console. For ${seats} user${seats !== 1 ? "s" : ""}, these admin features add no practical value. ${cheaper.name} at $${cheaper.pricePerSeat}/seat is identical in AI capability. Saving: $${monthly}/mo.`;
      } else {
        reason = `${cheaper.name} at $${cheaper.pricePerSeat}/seat covers your usage at $${monthly}/mo less than ${plan}.`;
      }

      return buildDowngradeResult(
        input,
        `ChatGPT ${cheaper.name}`,
        cheaper.pricePerSeat,
        reason,
        plan === "Business" || plan === "Team" ? 93 : 88,
        src
      );
    }
  }

  // API Direct — high spend
  if (plan === "API Direct" && monthlySpend >= 300) {
    return buildNegotiateResult(
      input,
      0.25,
      "Explore pre-purchased OpenAI API credits through Credex",
      src
    );
  }

  const discrepancy = billingDiscrepancyCheck(input, src);
  if (discrepancy) return discrepancy;

  return optimalFallback(input);
}

function auditGitHubCopilot(input: AuditInput): AuditResult {
  const { plan, monthlySpend, seats, useCase } = input;
  const src = getSourceUrl("GitHub Copilot");

  // Non-coding use case — tool mismatch
  // Use the cheapest general-purpose alternative ($20/seat) from Claude/ChatGPT
  if (useCase !== "Coding" && useCase !== "Mixed") {
    const alternativePricePerSeat = 20; // Claude Pro / ChatGPT Plus
    return buildWrongToolResult(
      input,
      "Claude Pro or ChatGPT Plus",
      alternativePricePerSeat,
      src
    );
  }

  const currentPricePerSeat = knownPlanPrice("GitHub Copilot", plan) ?? 0;

  // Find the cheapest plan strictly less expensive than current
  const cheaper = bestPlanForBudget(
    "GitHub Copilot",
    currentPricePerSeat - 1,
    [plan, "Free"]
  );

  if (cheaper) {
    const projectedTotal = cheaper.pricePerSeat * seats;
    const monthly = Math.max(0, Math.round(monthlySpend - projectedTotal));

    if (monthly > 0) {
      let reason = "";

      if (plan === "Enterprise") {
        // Effective Enterprise price includes GitHub Enterprise Cloud add-on
        const effectiveEnterprice = currentPricePerSeat + 21;
        reason = `Copilot Enterprise ($${currentPricePerSeat}/seat + ~$21 GitHub Enterprise Cloud = ~$${effectiveEnterprice} effective) adds knowledge bases, custom models, and private-repo fine-tuning. At ${seats} seat${seats !== 1 ? "s" : ""}, ${cheaper.name} at $${cheaper.pricePerSeat}/seat covers multi-model completions, IP indemnity, and pooled usage credits. Saving: $${monthly}/mo.`;
      } else if (plan === "Pro+") {
        // Break-even analysis derived from plan prices, not hardcoded
        const proPrice = PLAN_PRICES["GitHub Copilot"]["Pro"] ?? 10;
        const breakEvenRequests = Math.round(
          ((currentPricePerSeat - proPrice) / proPrice) * 100
        );
        reason = `Copilot ${plan} ($${currentPricePerSeat}/mo) is worth it above roughly ${breakEvenRequests} premium model requests/month. If you're not consistently hitting that volume, ${cheaper.name} at $${cheaper.pricePerSeat}/mo plus on-demand overflow is cheaper. Track your premium request usage for one month before deciding.`;
      } else {
        reason = `${cheaper.name} at $${cheaper.pricePerSeat}/seat covers your coding workflow at $${monthly}/mo less than ${plan}.`;
      }

      return buildDowngradeResult(
        input,
        `GitHub Copilot ${cheaper.name}`,
        cheaper.pricePerSeat,
        reason,
        plan === "Enterprise" ? 91 : 70,
        src
      );
    }
  }

  const discrepancy = billingDiscrepancyCheck(input, src);
  if (discrepancy) return discrepancy;

  return optimalFallback(input);
}

function auditGemini(input: AuditInput): AuditResult {
  const { plan, monthlySpend } = input;
  const src = getSourceUrl("Gemini");

  if (plan === "API Direct" && monthlySpend >= 300) {
    // Google Cloud committed-use is typically 15–25% — use 20% as conservative midpoint
    return buildNegotiateResult(
      input,
      0.2,
      "Consider Google Cloud committed-use discounts or Credex pre-purchased Gemini API credits",
      src
    );
  }

  const discrepancy = billingDiscrepancyCheck(input, src);
  if (discrepancy) return discrepancy;

  return optimalFallback(input);
}

function auditWindsurf(input: AuditInput): AuditResult {
  const { plan, monthlySpend, seats, useCase } = input;
  const src = getSourceUrl("Windsurf");

  // Non-coding use case — full tool mismatch, recommend cancellation
  if (useCase !== "Coding" && useCase !== "Mixed") {
    return {
      tool: "Windsurf", currentPlan: plan, currentMonthlySpend: monthlySpend,
      recommendedPlan: "Cancel and switch to Claude Pro or ChatGPT Plus",
      recommendedMonthlyCost: 20 * seats,
      monthlySavings: Math.max(0, monthlySpend - 20 * seats),
      annualSavings: Math.max(0, monthlySpend - 20 * seats) * 12,
      recommendation: `Cancel Windsurf — wrong tool for ${useCase} workflows`,
      reason: `Windsurf is an AI-native code editor. For ${useCase} workflows, you're paying for IDE features you're not using. Claude Pro or ChatGPT Plus ($20/seat) would serve your team significantly better.`,
      confidence: 88, category: "switch_tool", risk: "Low",
      impact: monthlySpend > 100 ? "High" : "Medium", sourceUrl: src,
    };
  }

  const currentPricePerSeat = knownPlanPrice("Windsurf", plan) ?? 0;

  // Find the cheapest plan strictly less expensive than current
  const cheaper = bestPlanForBudget(
    "Windsurf",
    currentPricePerSeat - 1,
    [plan, "Free"]
  );

  if (cheaper) {
    const projectedTotal = cheaper.pricePerSeat * seats;
    const monthly = Math.max(0, Math.round(monthlySpend - projectedTotal));

    if (monthly > 0) {
      let reason = "";

      if (plan === "Max") {
        // Max is high-volume; derive break-even from plan prices
        const proPrice = PLAN_PRICES["Windsurf"]["Pro"] ?? 20;
        reason = `Windsurf Max ($${currentPricePerSeat}/seat) is designed for very high-volume usage. ${cheaper.name} at $${cheaper.pricePerSeat}/seat delivers identical AI-assisted editing for typical workloads. At ${seats} seat${seats !== 1 ? "s" : ""}, that's $${monthly}/mo in savings. Track your flow credit consumption for one month to confirm you won't hit Max limits on ${cheaper.name}.`;
      } else if (plan === "Teams" || plan === "Team") {
        reason = `Windsurf ${plan} ($${currentPricePerSeat}/seat) adds admin dashboard, centralised billing, and analytics. At ${seats} seat${seats !== 1 ? "s" : ""}, individual ${cheaper.name} subscriptions at $${cheaper.pricePerSeat}/seat cover the same AI-assisted coding at $${monthly}/mo less.`;
      } else {
        reason = `${cheaper.name} at $${cheaper.pricePerSeat}/seat covers your workflow at $${monthly}/mo less than ${plan}.`;
      }

      return buildDowngradeResult(
        input,
        `Windsurf ${cheaper.name}`,
        cheaper.pricePerSeat,
        reason,
        plan === "Max" ? 80 : 87,
        src
      );
    }
  }

  const discrepancy = billingDiscrepancyCheck(input, src);
  if (discrepancy) return discrepancy;

  return optimalFallback(input);
}

function auditAPISpend(input: AuditInput): AuditResult {
  const { tool, monthlySpend } = input;
  const src = getSourceUrl(tool);

  if (monthlySpend >= 500) {
    return buildNegotiateResult(
      input,
      0.25,
      "Explore pre-purchased AI credits through Credex",
      src
    );
  }

  return optimalFallback(input);
}

// ── Router ────────────────────────────────────────────────────────────────────

export function generateAudit(input: AuditInput): AuditResult {
  const t = input.tool.toLowerCase();

  if (t.includes("cursor"))                                    return auditCursor(input);
  if (t.includes("claude"))                                    return auditClaude(input);
  if (t.includes("chatgpt"))                                   return auditChatGPT(input);
  if (t.includes("copilot"))                                   return auditGitHubCopilot(input);
  if (t.includes("gemini"))                                    return auditGemini(input);
  if (t.includes("windsurf"))                                  return auditWindsurf(input);
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