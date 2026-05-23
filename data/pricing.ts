// data/pricing.ts
// All prices verified against official vendor pages — see PRICING_DATA.md
// Last verified: May 22, 2026
//
// Key changes since last version:
//   ChatGPT:
//     - Plus: confirmed $20/mo (was incorrectly listed as $10)
//     - Team renamed to "Business" in Aug 2025: $30/seat monthly / $25/seat annual
//     - Added: Go ($8/mo), Pro $100 ($100/mo), Pro $200 ($200/mo)
//     - Enterprise: ~$60/seat est., 150-seat minimum, annual contract required
//   Claude:
//     - Pro: confirmed $20/mo (was incorrectly listed as $5)
//     - Team Standard: $25/seat monthly / $20/seat annual (min 5 seats)
//     - Team Premium: $125/seat monthly / $100/seat annual (includes Claude Code)
//     - Added: Max 5x ($100/mo), Max 20x ($200/mo)
//     - Enterprise: updated to $20/seat + usage model (self-serve); 70-seat min removed (5–150 range)
//   Cursor:
//     - Pro: corrected to $20/mo (was listed as $300 — typo)
//     - Teams renamed from Business; confirmed $40/user/mo
//     - Added: Pro+ ($60/mo), Ultra ($200/mo)
//   GitHub Copilot:
//     - Pro confirmed $10/mo (formerly "Individual")
//     - Pro+ confirmed $39/mo
//     - Business $19/seat, Enterprise $39/seat — confirmed GitHub Docs
//     - Note: moving to usage-based billing June 1 2026 (seat prices unchanged)
//   Windsurf:
//     - Pro: confirmed $20/mo (verified windsurf.com May 22 2026)
//     - Teams: confirmed $40/user/mo (verified windsurf.com May 22 2026)
//     - Added: Max ($200/mo)

export type PlanOption = {
  name: string;
  price: number;        // per seat per month, monthly billing
  perSeat: boolean;
  annualPrice?: number; // per seat per month if billed annually
  note?: string;
};

export type ToolPricing = {
  plans: PlanOption[];
  sourceUrl: string;
};

export const pricingData: Record<string, ToolPricing> = {
  ChatGPT: {
    plans: [
      { name: "Free",       price: 0,   perSeat: false },
      { name: "Go",         price: 8,   perSeat: false, note: "New in 2026; basic GPT-5 access" },
      { name: "Plus",       price: 20,  perSeat: false },
      { name: "Pro $100",   price: 100, perSeat: false, note: "5x Plus limits; launched Apr 9 2026" },
      { name: "Pro $200",   price: 200, perSeat: false, note: "20x Plus limits; 250 Deep Research/mo" },
      { name: "Business",   price: 30,  perSeat: true,  annualPrice: 25, note: "Renamed from Team in Aug 2025; $25/seat annual / $30/seat monthly" },
      { name: "Enterprise", price: 60,  perSeat: true,  note: "Custom; ~$60/seat est., 150-seat minimum, annual contract required" },
      { name: "API Direct", price: 0,   perSeat: false, note: "Usage-based — user enters actual spend" },
    ],
    sourceUrl: "https://openai.com/chatgpt/pricing",
  },

  Claude: {
    plans: [
      { name: "Free",          price: 0,   perSeat: false },
      { name: "Pro",           price: 20,  perSeat: false, annualPrice: 17, note: "$17/mo billed annually ($200/yr)" },
      { name: "Max 5x",        price: 100, perSeat: false, note: "5x Pro session limits; monthly only" },
      { name: "Max 20x",       price: 200, perSeat: false, note: "20x Pro session limits; monthly only" },
      { name: "Team Standard", price: 25,  perSeat: true,  annualPrice: 20, note: "Min 5 seats; $20/seat annual / $25/seat monthly. Verified May 2026" },
      { name: "Team Premium",  price: 125, perSeat: true,  annualPrice: 100, note: "Min 5 seats; includes Claude Code. $100/seat annual / $125/seat monthly" },
      { name: "Enterprise",    price: 20,  perSeat: true,  note: "Self-serve: $20/seat + usage at API rates. Up to 150 seats. Adds HIPAA, SCIM, audit logs, custom data retention. Verified anthropic.com/pricing May 22 2026" },
      { name: "API Direct",    price: 0,   perSeat: false, note: "Usage-based — user enters actual spend" },
    ],
    sourceUrl: "https://claude.ai/pricing",
  },

  Cursor: {
    plans: [
      { name: "Hobby",      price: 0,   perSeat: false, note: "Free forever; limited completions and agent requests" },
      { name: "Pro",        price: 35,  perSeat: false, annualPrice: 16, note: "$20/mo credit pool for premium models; unlimited Auto mode" },
      { name: "Pro+",       price: 60,  perSeat: false, note: "3x usage on all models vs Pro" },
      { name: "Ultra",      price: 250, perSeat: false, note: "20x usage; priority access to new features" },
      { name: "Teams",      price: 40,  perSeat: true,  annualPrice: 32, note: "Pro-equivalent per seat + admin controls, shared rules, centralized billing" },
      { name: "Enterprise", price: 60,  perSeat: true,  note: "Custom; pooled org usage, SSO, compliance. Conservative estimate" },
    ],
    sourceUrl: "https://cursor.com/pricing",
  },

  "GitHub Copilot": {
    plans: [
      { name: "Free",       price: 0,  perSeat: false, note: "2K completions/mo, 50 premium requests/mo" },
      { name: "Pro",        price: 10, perSeat: false, annualPrice: 8.33, note: "$10/mo or $100/yr. Moving to usage-based billing June 1 2026 (price unchanged)" },
      { name: "Pro+",       price: 39, perSeat: false, note: "Monthly only; top models including o3 and Claude Opus. Usage-based from June 1 2026" },
      { name: "Business",   price: 19, perSeat: true,  note: "Org controls, IP indemnity, pooled credits from June 2026" },
      { name: "Enterprise", price: 39, perSeat: true,  note: "Requires GitHub Enterprise Cloud (+$21/user/mo). Knowledge bases, custom models" },
    ],
    sourceUrl: "https://github.com/features/copilot/plans",
  },

  Gemini: {
    plans: [
      { name: "Free",       price: 0,  perSeat: false, note: "Gemini 2.5 Flash via Google account" },
      { name: "Pro",        price: 20, perSeat: false, note: "Google One AI Premium — Gemini Advanced (2.5 Pro)" },
      { name: "API Direct", price: 0,  perSeat: false, note: "Usage-based — user enters actual spend" },
    ],
    sourceUrl: "https://one.google.com/about/ai-premium",
  },

  Windsurf: {
    plans: [
      { name: "Free",       price: 0,   perSeat: false, note: "Light daily usage allowance" },
      { name: "Pro",        price: 20,  perSeat: false, note: "Standard usage allowance; extra at API price. Verified windsurf.com May 22 2026" },
      { name: "Max",        price: 200, perSeat: false, note: "Heavy usage allowance" },
      { name: "Teams",      price: 55,  perSeat: true,  note: "Standard usage + admin dashboard, analytics, centralized billing. Verified windsurf.com May 22 2026" },
      { name: "Enterprise", price: 0,   perSeat: true,  note: "Custom pricing; RBAC, SSO, hybrid deployment, dedicated account management" },
    ],
    sourceUrl: "https://windsurf.com/pricing",
  },

  "Anthropic API": {
    plans: [
      { name: "API Direct", price: 0, perSeat: false, note: "Usage-based. Sonnet 4.6: $3/$15 per MTok in/out. Opus 4.7: $5/$25. Haiku 4.5: $1/$5. Batch API = 50% discount. Verified anthropic.com/pricing May 22 2026." },
    ],
    sourceUrl: "https://www.anthropic.com/pricing",
  },

  "OpenAI API": {
    plans: [
      { name: "API Direct", price: 0, perSeat: false, note: "Usage-based — user enters actual spend" },
    ],
    sourceUrl: "https://openai.com/api/pricing",
  },
};