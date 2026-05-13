# REFLECTION.md

---

## 1. The hardest bug you hit this week, and how you debugged it

The hardest bug was in `app/api/generate-summary/route.ts`. After the Firestore save succeeded and the audit results rendered correctly, the AI summary would silently return the fallback string every time — even though I had a valid OpenRouter API key and the network request was completing. No error in the console.

My first hypothesis was that the API key wasn't being picked up from `.env.local`. I added a `console.log(process.env.OPENROUTER_API_KEY ? "key present" : "key missing")` at the top of the route handler. Key was present.

Second hypothesis: the request body was empty. I logged `JSON.stringify(body)` after `await req.json()`. Body was populated with the right fields.

Third hypothesis: OpenRouter was returning a non-200 status. I added explicit logging of `response.status` and `response.statusText`. That's when I saw it: `400 Bad Request`.

I fetched the full error body with `await response.text()` and got: `"model not found: anthropic/claude-3-haiku"`. The model string was wrong. OpenRouter's current model identifier for Haiku is `anthropic/claude-3-haiku-20240307` (the dated version string), not the shorthand I had used.

Fixed the model string, tested again — summaries worked. Total debugging time: about 45 minutes. The lesson is that API error messages are often in the response body, not just the status code, and you have to explicitly read them.

---

## 2. A decision you reversed mid-week, and what made you reverse it

I originally planned to use Resend for transactional email — it's the go-to for Next.js apps, has a clean SDK, and the free tier covers 3000 emails/month. I'd already installed it and written the first version of `send-confirmation/route.ts` against the Resend API.

Midway through Wednesday I reversed to Nodemailer + Gmail SMTP. The reason: Resend requires a verified custom domain (e.g. `noreply@overprompt.io`) to send email — you can't send from a Gmail address via their API. Setting up a domain just for this assignment wasn't practical in the time available. Gmail SMTP with an App Password works immediately with any Google account and has no domain requirement.

The trade-off is that Gmail caps outbound SMTP at 500 emails/day, which would be a real bottleneck in production. If Credex deploys this, switching to Resend (or Postmark) is the right move — but it requires a verified domain first. I documented this in ARCHITECTURE.md under "What would change at 10k audits/day."

---

## 3. What you would build in week 2 if you had it

The three highest-leverage additions:

**PDF export.** The audit results page is the thing people want to share with their CFO or engineering lead. Right now the share URL is the mechanism, but a downloadable PDF with the Overprompt/Credex logo, per-tool breakdown, and savings summary would be forwarded internally far more often than a URL. `@react-pdf/renderer` makes this tractable in a Next.js server route.

**Benchmark mode.** "Your team of 8 spends $340/mo on AI tools — companies your size average $280/mo." This is a one-sentence addition to the results hero that makes the audit feel personalized and data-driven, and it drives sharing ("look how much we're above average"). Seed the benchmark data from the audits already being saved to Firestore.

**Embeddable widget.** A `<script>` tag that bloggers and newsletters could drop into their posts to surface a mini-audit form inline. Each embed is a distribution channel. The widget loads the form, runs the engine client-side (no backend needed for the core math), and redirects to Overprompt for lead capture. This is the viral distribution mechanism that doesn't require Credex's paid budget.

---

## 4. How you used AI tools

I used Claude (claude.ai, Sonnet 4.6) and GitHub Copilot throughout the week. Claude was my primary tool; Copilot handled inline completions in VS Code.

**What I used Claude for:**

- Drafting the initial structure of `audit-engine.ts` — I described the decision logic in plain English and asked it to scaffold the TypeScript types and function signatures
- Debugging the OpenRouter 400 error (explained the symptom, it suggested logging the response body — which I should have done first)
- Writing the HTML email template in `send-confirmation/route.ts` (tedious inline styles, Claude handles this well)
- Drafting first passes of `GTM.md` and `ECONOMICS.md` which I then heavily revised with my own reasoning

**What I didn't trust AI with:**

- The audit engine rules themselves. Every `if` branch and savings calculation I wrote and verified manually against `PRICING_DATA.md`. An LLM can hallucinate pricing numbers or miss edge cases (e.g. the Windsurf pricing change in March 2026).
- Test assertions. I wrote every `expect()` by hand because I needed to verify the math myself.

**One time the AI was wrong:**
Claude confidently told me that `Windsurf Teams` was priced at `$35/user/month` when I asked about current pricing. The actual current price (post-March 2026 restructure) is `$40/user/month`. I caught it because I cross-checked against `windsurf.com/pricing` directly. This is exactly why the assignment says "pricing data must be current as of submission week — sources cited."

---

## 5. Self-ratings

| Dimension                | Rating | Reason                                                                                                                                                                                                                                              |
| ------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discipline               | 10/10  | Day 1 spent fully understanding the brief — read it twice, mapped the data model, planned the architecture before writing a line. Coding started Day 2 and ran consistently through Day 7 with meaningful commits every day.                        |
| Code quality             | 8/10   | Audit engine is clean, typed, and fully testable as pure functions. localStorage hydration handled correctly with lazy useState initializer. AuditForm.tsx could be split further but all abstractions are intentional.                             |
| Design sense             | 7/10   | Results page is visually clear — hero savings number is prominent, per-tool cards are scannable, Credex upsell surfaces at the right threshold. Landing page is solid but could go further with social proof.                                       |
| Problem-solving          | 9/10   | Debugged the OpenRouter 400 error methodically by reading the response body, not just the status code. Caught the Windsurf March 2026 pricing change that Claude itself got wrong. Chose Firebase over Supabase for the right architectural reason. |
| Entrepreneurial thinking | 8/10   | Built the tool around the actual user journey — value before email gate, honest "you're spending well" output, Credex upsell only where it's defensible. GTM and ECONOMICS docs are grounded in real numbers with a clear funnel model.             |
