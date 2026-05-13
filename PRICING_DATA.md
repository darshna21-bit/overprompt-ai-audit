# PRICING_DATA.md

Every number in the audit engine traces to an official vendor pricing page.
All prices are per user per month unless noted. Verified during submission week (May 2026).

---

## Cursor

- Hobby: $0 — https://cursor.sh/pricing — verified 2026-05-13
- Pro: $20/user/month — https://cursor.sh/pricing — verified 2026-05-13
- Business: $40/user/month — https://cursor.sh/pricing — verified 2026-05-13
- Enterprise: custom pricing (estimate ~$60–80/user/month based on public benchmarks) — https://cursor.sh/pricing — verified 2026-05-13

---

## GitHub Copilot

**Note:** GitHub renamed tiers in 2025/2026. "Individual" is now "Copilot Pro." The seat prices are unchanged.

- Copilot Free: $0 — https://github.com/features/copilot/plans — verified 2026-05-13
- Copilot Pro (formerly Individual): $10/month per user — https://docs.github.com/en/copilot/concepts/billing/billing-for-individuals — verified 2026-05-13
- Copilot Pro+: $39/month per user — https://docs.github.com/en/copilot/concepts/billing/billing-for-individuals — verified 2026-05-13
- Copilot Business: $19/user/month — https://docs.github.com/en/copilot/concepts/billing/organizations-and-enterprises — verified 2026-05-13
- Copilot Enterprise: $39/user/month — https://docs.github.com/en/copilot/concepts/billing/organizations-and-enterprises — verified 2026-05-13

---

## Claude (Anthropic)

**Note:** Claude Team pricing changed from $30/seat to $25/seat (annual) / $25/seat (monthly for Standard). There is now also a Team Premium tier. Prices below reflect May 2026 claude.com/pricing.

- Free: $0 — https://claude.com/pricing — verified 2026-05-13
- Pro: $20/month (or $17/month billed annually) — https://claude.com/pricing — verified 2026-05-13
- Max 5x: $100/month — https://claude.com/pricing — verified 2026-05-13
- Max 20x: $200/month — https://claude.com/pricing — verified 2026-05-13
- Team (Standard): $25/seat/month (billed annually) or $25/seat/month monthly — https://claude.com/pricing — verified 2026-05-13
- Team (Premium): $125/seat/month — https://claude.com/pricing — verified 2026-05-13
- Enterprise: custom pricing (contact sales; floor estimated ~$60/seat/month based on user reports) — https://claude.com/pricing — verified 2026-05-13
- API Direct: usage-based — https://www.anthropic.com/pricing — verified 2026-05-13

---

## ChatGPT (OpenAI)

- Free: $0 — https://openai.com/chatgpt/pricing — verified 2026-05-13
- Plus: $20/month — https://openai.com/chatgpt/pricing — verified 2026-05-13
- Team: $30/user/month (billed monthly) or $25/user/month (billed annually) — https://openai.com/chatgpt/pricing — verified 2026-05-13
- Enterprise: custom pricing (conservative estimate ~$60/user/month) — https://openai.com/chatgpt/pricing — verified 2026-05-13
- API Direct: usage-based — https://openai.com/api/pricing — verified 2026-05-13

---

## Gemini (Google)

- Google One AI Premium (Gemini Pro access): $20/month — https://one.google.com/about/ai-premium — verified 2026-05-13
- API Direct: usage-based — https://ai.google.dev/pricing — verified 2026-05-13

**Note:** "Gemini Ultra" as a distinct consumer tier was replaced by the Google One AI Premium plan. The $30 "Ultra" estimate in the original pricing.ts has been removed; use $20 for Pro (Google One AI Premium) as the verified price.

---

## Windsurf (Codeium)

**Note:** Windsurf restructured pricing in March 2026. New prices as of that change:

- Free: $0 — https://windsurf.com/pricing — verified 2026-05-13
- Pro: $20/user/month (up from $15 in March 2026 restructure) — https://windsurf.com/pricing — verified 2026-05-13
- Teams: $40/user/month (up from $30 in March 2026 restructure) — https://windsurf.com/pricing — verified 2026-05-13
- Enterprise: custom pricing — https://windsurf.com/pricing — verified 2026-05-13

**Source for restructure:** https://windsurf.com/blog/windsurf-pricing-plans (March 2026 announcement)

---

## Anthropic API

- Usage-based pricing (per token, varies by model) — https://www.anthropic.com/pricing — verified 2026-05-13
- Claude Haiku 4.5: $1.00/MTok input, $5.00/MTok output
- Claude Sonnet 4.6: $3.00/MTok input, $15.00/MTok output
- Claude Opus 4.7: $5.00/MTok input, $25.00/MTok output

---

## OpenAI API

- Usage-based pricing (per token, varies by model) — https://openai.com/api/pricing — verified 2026-05-13
- GPT-4o mini: $0.15/MTok input, $0.60/MTok output
- GPT-4o: $2.50/MTok input, $10.00/MTok output

---

## Notes on Estimates

Enterprise pricing for Claude, ChatGPT, Cursor, and Windsurf is not publicly listed — vendors require a sales call. Conservative floor estimates used in the audit engine are based on publicly available reports and community data. Actual enterprise pricing may vary. All estimates are labelled as such in `data/pricing.ts`.

**Critical price corrections from original submission (May 7 → May 13 recheck):**

- Claude Team: corrected from $30/seat to $25/seat (annual rate per claude.com/pricing)
- Windsurf Pro: corrected from $15/month to $20/month (March 2026 restructure)
- Windsurf Teams: corrected from $35/user to $40/user (March 2026 restructure)
- GitHub Copilot Individual: renamed "Copilot Pro" — price unchanged at $10/month
- Gemini Ultra: removed as a distinct tier; replaced with Google One AI Premium at $20/month
