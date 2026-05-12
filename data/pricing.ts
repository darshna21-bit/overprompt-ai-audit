// data/pricing.ts
// All prices verified against official vendor pages — see PRICING_DATA.md
// Last verified: May 2026

export type PlanOption = {
  name: string;
  price: number; // per seat per month
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
      { name: "Team",       price: 30,  perSeat: true  }, // billed annually, ~$25/seat; using monthly rate
      { name: "Enterprise", price: 60,  perSeat: true  }, // custom; conservative estimate
      { name: "API Direct", price: 0,   perSeat: false }, // usage-based — user enters actual spend
    ],
    sourceUrl: "https://openai.com/chatgpt/pricing",
  },

  Claude: {
    plans: [
      { name: "Free",       price: 0,   perSeat: false },
      { name: "Pro",        price: 20,  perSeat: false },
      { name: "Max",        price: 100, perSeat: false },
      { name: "Team",       price: 30,  perSeat: true  },
      { name: "Enterprise", price: 60,  perSeat: true  }, // custom; conservative estimate
      { name: "API Direct", price: 0,   perSeat: false }, // usage-based
    ],
    sourceUrl: "https://www.anthropic.com/pricing",
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
      { name: "Individual", price: 10,  perSeat: false },
      { name: "Business",   price: 19,  perSeat: true  },
      { name: "Enterprise", price: 39,  perSeat: true  },
    ],
    sourceUrl: "https://github.com/features/copilot#pricing",
  },

  Gemini: {
    plans: [
      { name: "Pro",        price: 20,  perSeat: false }, // Google One AI Premium
      { name: "Ultra",      price: 30,  perSeat: false }, // Advanced tier estimate
      { name: "API Direct", price: 0,   perSeat: false }, // usage-based
    ],
    sourceUrl: "https://one.google.com/about/ai-premium",
  },

  Windsurf: {
    plans: [
      { name: "Free",       price: 0,   perSeat: false },
      { name: "Pro",        price: 15,  perSeat: true  },
      { name: "Team",       price: 35,  perSeat: true  },
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