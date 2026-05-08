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

  confidence: number;
  category: string;
  risk: string;
  impact: string;
};

export function generateAudit(
  input: AuditInput
): AuditResult {

  const {
    tool,
    plan,
    monthlySpend,
    seats,
    useCase,
  } = input;

  // -------------------------
  // CHATGPT
  // -------------------------

  // TEAM

  if (
    tool === "ChatGPT" &&
    plan === "Team" &&
    seats <= 2
  ) {
    return {
      recommendation:
        "Switch to ChatGPT Plus",

      monthlySavings:
        monthlySpend > 400 ? 10 : 20,

      annualSavings:
        monthlySpend > 400 ? 120 : 240,

      reason:
        "Small teams often overpay for ChatGPT Team when individual Plus subscriptions provide similar value.",

      confidence: 90,
      category: "License Optimization",
      risk: "Low",
      impact: "Medium",
    };
  }

  // ENTERPRISE

  if (
    tool === "ChatGPT" &&
    plan === "Enterprise" &&
    seats <= 5
  ) {
    return {
      recommendation:
        "Downgrade to ChatGPT Team",

      monthlySavings:
        monthlySpend > 500 ? 50 : 150,

      annualSavings:
        monthlySpend > 500 ? 600 : 1800,

      reason:
        "Enterprise pricing is usually unnecessary for smaller organizations with limited operational scale.",

      confidence: 94,
      category: "Enterprise Cost Reduction",
      risk: "Low",
      impact: "High",
    };
  }

  // -------------------------
  // CLAUDE
  // -------------------------

  // TEAM

  if (
    tool === "Claude" &&
    plan === "Team"
  ) {

    if (
      monthlySpend < 100
    ) {
      return {
        recommendation:
          "Switch to Claude Pro",

        monthlySavings: 30,
        annualSavings: 360,

        reason:
          "Claude Team pricing becomes inefficient at lower usage volumes.",

        confidence: 88,
        category: "Usage Optimization",
        risk: "Low",
        impact: "Medium",
      };
    }

    return {
      recommendation:
        "Current Claude setup appears balanced",

      monthlySavings: 10,
      annualSavings: 120,

      reason:
        "Your Claude Team usage appears reasonably aligned with current operational requirements.",

      confidence: 84,
      category: "Usage Review",
      risk: "Low",
      impact: "Low",
    };
  }

  // ENTERPRISE

  if (
    tool === "Claude" &&
    plan === "Enterprise" &&
    seats < 10
  ) {
    return {
      recommendation:
        "Downgrade to Claude Team",

      monthlySavings:
        monthlySpend > 700 ? 40 : 120,

      annualSavings:
        monthlySpend > 700 ? 480 : 1440,

      reason:
        "Enterprise-level Claude plans are generally unnecessary for smaller teams.",

      confidence: 91,
      category: "Enterprise Optimization",
      risk: "Low",
      impact: "High",
    };
  }

  // -------------------------
  // CURSOR
  // -------------------------

  // PRO

  if (
    tool === "Cursor" &&
    plan === "Pro"
  ) {
    return {
      recommendation:
        "Current Cursor setup looks optimized",

      monthlySavings: 0,
      annualSavings: 0,

      reason:
        "Cursor Pro appears appropriately aligned with your current development workflow scale.",

      confidence: 86,
      category: "Engineering Efficiency",
      risk: "Low",
      impact: "Low",
    };
  }

  // BUSINESS

  if (
    tool === "Cursor" &&
    plan === "Business" &&
    seats <= 3
  ) {
    return {
      recommendation:
        "Downgrade to Cursor Pro",

      monthlySavings:
        monthlySpend > 400 ? 15 : 40,

      annualSavings:
        monthlySpend > 400 ? 180 : 480,

      reason:
        "Cursor Business plans are generally optimized for larger engineering teams.",

      confidence: 92,
      category: "Engineering Tool Optimization",
      risk: "Low",
      impact: "Medium",
    };
  }

  // ENTERPRISE

  if (
    tool === "Cursor" &&
    plan === "Enterprise" &&
    seats <= 10
  ) {
    return {
      recommendation:
        "Switch to Cursor Business",

      monthlySavings:
        monthlySpend > 1000 ? 80 : 200,

      annualSavings:
        monthlySpend > 1000 ? 960 : 2400,

      reason:
        "Enterprise tooling costs may not justify the usage scale of smaller development teams.",

      confidence: 95,
      category: "Enterprise Cost Reduction",
      risk: "Medium",
      impact: "High",
    };
  }

  // -------------------------
  // GITHUB COPILOT
  // -------------------------

  // BUSINESS

  if (
    tool === "GitHub Copilot" &&
    plan === "Business"
  ) {

    if (
      seats <= 3
    ) {
      return {
        recommendation:
          "Current GitHub Copilot setup appears efficient",

        monthlySavings:
          monthlySpend > 600 ? 10 : 25,

        annualSavings:
          monthlySpend > 600 ? 120 : 300,

        reason:
          "GitHub Copilot Business appears reasonably aligned with your current engineering workflow scale.",

        confidence: 86,
        category: "Usage Review",
        risk: "Low",
        impact: "Low",
      };
    }

    return {
      recommendation:
        "Consider enterprise governance features",

      monthlySavings: 0,
      annualSavings: 0,

      reason:
        "Larger engineering organizations may benefit from enterprise-grade governance and compliance controls.",

      confidence: 82,
      category: "Engineering Scaling",
      risk: "Medium",
      impact: "Medium",
    };
  }

  // ENTERPRISE

  if (
    tool === "GitHub Copilot" &&
    plan === "Enterprise" &&
    seats <= 5
  ) {

    // LOW SPEND

    if (
      monthlySpend < 300
    ) {
      return {
        recommendation:
          "Switch to GitHub Copilot Business",

        monthlySavings: 100,
        annualSavings: 1200,

        reason:
          "Enterprise Copilot plans appear excessive relative to current engineering team size and operational usage.",

        confidence: 92,
        category: "License Optimization",
        risk: "Low",
        impact: "High",
      };
    }

    // MEDIUM SPEND

    if (
      monthlySpend >= 300 &&
      monthlySpend <= 700
    ) {
      return {
        recommendation:
          "Current enterprise usage appears reasonable",

        monthlySavings: 20,
        annualSavings: 240,

        reason:
          "Your current spend suggests moderate enterprise feature utilization with some remaining optimization opportunities.",

        confidence: 84,
        category: "Usage Review",
        risk: "Low",
        impact: "Low",
      };
    }

    // HIGH SPEND

    if (
      monthlySpend > 700
    ) {
      return {
        recommendation:
          "Enterprise plan appears justified",

        monthlySavings: 0,
        annualSavings: 0,

        reason:
          "Higher engineering utilization and governance requirements may justify enterprise-grade Copilot deployment.",

        confidence: 88,
        category: "Enterprise Scaling",
        risk: "Low",
        impact: "Low",
      };
    }
  }

  // -------------------------
  // GEMINI
  // -------------------------

  // PRO

  if (
    tool === "Gemini" &&
    plan === "Pro"
  ) {
    return {
      recommendation:
        "Current Gemini setup looks balanced",

      monthlySavings: 0,
      annualSavings: 0,

      reason:
        "Gemini Pro appears reasonably aligned with your current AI usage patterns.",

      confidence: 84,
      category: "Operational Efficiency",
      risk: "Low",
      impact: "Low",
    };
  }

  // ULTRA

  if (
    tool === "Gemini" &&
    plan === "Ultra" &&
    useCase === "Writing"
  ) {
    return {
      recommendation:
        "Downgrade to Gemini Pro",

      monthlySavings: 25,
      annualSavings: 300,

      reason:
        "Gemini Ultra capabilities may be unnecessary for lightweight writing-focused workflows.",

      confidence: 85,
      category: "Usage Optimization",
      risk: "Low",
      impact: "Medium",
    };
  }

  // -------------------------
  // HIGH SPEND RULE
  // -------------------------

  if (
    monthlySpend >= 1000
  ) {
    return {
      recommendation:
        "Explore negotiated enterprise AI pricing",

      monthlySavings: 250,
      annualSavings: 3000,

      reason:
        "Organizations with high recurring AI spend often qualify for vendor discounts and infrastructure credits.",

      confidence: 90,
      category: "Procurement Optimization",
      risk: "Medium",
      impact: "High",
    };
  }

  // -------------------------
  // LARGE TEAM RULE
  // -------------------------

  if (
    seats >= 50
  ) {
    return {
      recommendation:
        "Negotiate custom enterprise contracts",

      monthlySavings: 500,
      annualSavings: 6000,

      reason:
        "Larger organizations frequently unlock significant savings through long-term procurement agreements.",

      confidence: 95,
      category: "Enterprise Procurement",
      risk: "Low",
      impact: "Very High",
    };
  }

  // -------------------------
  // DEFAULT
  // -------------------------

  return {
    recommendation:
      "Current setup looks optimized",

    monthlySavings: 0,
    annualSavings: 0,

    reason:
      "Your current AI tooling setup appears cost-efficient based on the provided usage patterns and operational scale.",

    confidence: 80,
    category: "Cost Efficiency",
    risk: "Low",
    impact: "Low",
  };
}