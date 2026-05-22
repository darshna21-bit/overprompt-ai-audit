// data/pricing.ts
// All prices verified against official vendor pages — see PRICING_DATA.md
// Last verified: May 13, 2026

export type PlanOption = {
  name: string;
  price: number; // per seat per month (monthly billing)
  perSeat: boolean;
};

export type ToolPricing = {
  plans: PlanOption[];
  sourceUrl: string;
};

export const pricingData: Record<string, ToolPricing> = {
  ChatGPT: {
    plans: [
      { name: "Plus",       price: 20,  perSeat: false },
      { name: "Team",       price: 30,  perSeat: true  }, // monthly rate; $25/seat if billed annually
      { name: "Enterprise", price: 60,  perSeat: true  }, // custom; conservative estimate
      { name: "API Direct", price: 0,   perSeat: false }, // usage-based — user enters actual spend
    ],
    sourceUrl: "https://openai.com/chatgpt/pricing",
  },

  Claude: {
    plans: [
      { name: "Free",          price: 0,   perSeat: false },
      { name: "Pro",           price: 40,  perSeat: false }, // $17/month if billed annually
      { name: "Max 5x",        price: 100, perSeat: false },
      { name: "Max 20x",       price: 200, perSeat: false },
      { name: "Team",          price: 200,  perSeat: true  }, // Standard; $25/seat/month verified May 2026
      { name: "Team Premium",  price: 125, perSeat: true  },
      { name: "Enterprise",    price: 60,  perSeat: true  }, // custom; conservative estimate
      { name: "API Direct",    price: 0,   perSeat: false }, // usage-based
    ],
    sourceUrl: "https://claude.com/pricing",
  },

  Cursor: {
    plans: [
      { name: "Hobby",      price: 0,   perSeat: false },
      { name: "Pro",        price: 20,  perSeat: true  },
      { name: "Business",   price: 40,  perSeat: true  },
      { name: "Enterprise", price: 60,  perSeat: true  }, // custom; conservative estimate
    ],
    sourceUrl: "https://cursor.sh/pricing",
  },

  "GitHub Copilot": {
    plans: [
      { name: "Free",       price: 0,   perSeat: false },
      { name: "Pro",        price: 10,  perSeat: false }, // formerly "Individual"
      { name: "Pro+",       price: 39,  perSeat: false },
      { name: "Business",   price: 19,  perSeat: true  },
      { name: "Enterprise", price: 39,  perSeat: true  },
    ],
    sourceUrl: "https://github.com/features/copilot/plans",
  },

  Gemini: {
    plans: [
      { name: "Pro",        price: 20,  perSeat: false }, // Google One AI Premium (Gemini Advanced)
      { name: "API Direct", price: 0,   perSeat: false }, // usage-based
    ],
    sourceUrl: "https://one.google.com/about/ai-premium",
  },

  Windsurf: {
    plans: [
      { name: "Free",       price: 0,   perSeat: false },
      { name: "Pro",        price: 20,  perSeat: true  }, // updated March 2026: was $15
      { name: "Teams",      price: 40,  perSeat: true  }, // updated March 2026: was $30/$35
    ],
    sourceUrl: "https://windsurf.com/pricing",
  },

  "Anthropic API": {
    plans: [
      { name: "API Direct", price: 0,   perSeat: false }, // usage-based — user enters actual spend
    ],
    sourceUrl: "https://www.anthropic.com/pricing",
  },

  "OpenAI API": {
    plans: [
      { name: "API Direct", price: 0,   perSeat: false }, // usage-based — user enters actual spend
    ],
    sourceUrl: "https://openai.com/api/pricing",
  },
};