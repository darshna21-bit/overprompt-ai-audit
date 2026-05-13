# DEVLOG

## Day 1 — 2026-05-07

**Hours worked:** 1.5

**What I did:**
Honestly, I only saw the assignment message after dinner on the 7th — so that's when Day 1 actually started. Sat down, opened it up, and spent the time just reading and absorbing the brief from start to finish. No planning doc, no notes structure yet, just getting the full picture in my head before committing to anything.

**What I learned:**
The assignment has a lot of moving parts — 6 MVP features, 10+ required files, entrepreneurial docs, tests, CI. Even just reading it once gave me a clearer sense of what the week would need to look like.

**Blockers / what I'm stuck on:**
Too early to know. Need to re-read tomorrow with fresh eyes before making any decisions.

**Plan for tomorrow:**
Re-read the brief properly, map out the data model, plan the file structure, and decide on key tech choices before touching any code.

---

## Day 2 — 2026-05-08

**Hours worked:** 6

**What I did:**

- Initialized Next.js project with TypeScript and Tailwind (`feat: initialize Next.js project with TypeScript and Tailwind`)
- Built premium landing page hero section and separated it into a reusable component
- Added responsive Navbar component
- Added supported AI tools showcase section (FeaturesSection)
- Implemented initial AI spend audit form with dynamic multi-tool rows
- Added dynamic pricing and plan selection system — plan dropdown resets on tool change
- Persisted form state using localStorage with lazy useState initializer (SSR-safe)
- Implemented audit recommendations display and savings insights
- Built audit recommendation engine with per-tool rule logic for Cursor, Claude, ChatGPT, Copilot, Gemini, Windsurf

**What I learned:**
Tailwind v4 uses a PostCSS plugin config rather than `tailwind.config.js` — took a while to sort out. Also: lazy `useState` initializer is the correct pattern for localStorage in Next.js. It avoids hydration flash and the setState-in-effect lint error that bites you if you do it the naive way.

**Blockers / what I'm stuck on:**
Need to add analytics and charts tomorrow. Firebase integration still pending.

**Plan for tomorrow:**
Build analytics dashboard, spend chart, add Firebase backend and lead capture.

---

## Day 3 — 2026-05-09

**Hours worked:** 5

**What I did:**

- Built analytics dashboard cards (AnalyticsCards.tsx) showing current spend vs projected savings
- Added spend optimization chart using Recharts (SpendChart.tsx)
- Added audit history component — later removed for stability
- Wired up chart to live audit results

**What I learned:**
Recharts requires `"use client"` — it uses browser APIs internally, so it can't run on the server. Had to wrap it in a client component. Also learned that stacking too many features before the core is stable is a bad idea — audit history got cut later because it was adding complexity without enough value at this stage.

**Blockers / what I'm stuck on:**
Firebase integration is next — need to figure out the singleton initialization pattern for Next.js hot reload before I can safely wire up the backend.

**Plan for tomorrow:**
Add Firebase Firestore backend, lead storage, OpenRouter AI summary integration.

---

## Day 4 — 2026-05-10

**Hours worked:** 6

**What I did:**

- Added Firebase backend with Firestore lead storage (`Added Firebase backend and lead capture workflow`)
- Initialized Firebase with singleton pattern to prevent hot-reload errors
- Built `lib/save-audit.ts` — saves audit inputs + results to Firestore, returns document ID as shareable URL slug
- Integrated OpenRouter API for AI-generated personalized summary (`feat: build AI spend audit dashboard with Firebase lead storage and OpenRouter summaries`)
- Added fallback handling for API failures — templated summary when OpenRouter is down
- Wired up full submit flow: audit engine → Firestore save → AI summary → results render

**What I learned:**
Firebase `initializeApp` throws "already initialized" on Next.js hot reloads unless guarded with `getApps().length === 0`. Classic singleton pattern fixes it. Also: OpenRouter returns errors in the response body, not just the HTTP status code — you have to explicitly read `response.text()` to actually debug what went wrong.

**Blockers / what I'm stuck on:**
Email flow not started. Shareable audit URL page still needs building.

**Plan for tomorrow:**
Build `/audit/[id]` shareable page, add OG tags, build lead capture form, start email confirmation.

---

## Day 5 — 2026-05-11

**Hours worked:** 5

**What I did:**

- Built shareable public audit result page at `app/audit/[id]/page.tsx` — fetches Firestore doc by ID, strips email/company from public view
- Added Open Graph + Twitter Card metadata for clean link previews on shared audits
- Added lead capture form with email, optional company name and role fields, honeypot anti-spam protection
- Started email confirmation flow with Resend API — hit a wall immediately (see blockers)
- Fixed production build issues and finalized deployment setup (`fix: resolve production build issues and finalize deployment setup`)
- Configured environment variables on Vercel

**What I learned:**
Next.js App Router dynamic route `params` is a Promise in Next 15+ — `const { id } = await params` is required. Spent 30 minutes debugging this before finding it in the docs. Would have been a 5-second fix if I'd just read the migration notes first.

**Blockers / what I'm stuck on:**
Resend requires a verified custom domain — can't send from a Gmail address. That makes it a dead end for this MVP. Need to switch to Nodemailer + Gmail SMTP tomorrow.

**Plan for tomorrow:**
Replace Resend with Gmail SMTP, fix shareable audit URL generation, get email flow working end-to-end.

---

## Day 6 — 2026-05-12

**Hours worked:** 7

**What I did:**

- Replaced Resend with Gmail SMTP via Nodemailer — Resend's domain verification requirement wasn't feasible for the MVP timeline (`feat: replace Resend with Gmail SMTP, fix shareable audit URL, add multi-tool engine`)
- Fixed shareable audit URL generation — auditId was not being passed correctly to the share link
- Fixed audit confirmation email flow — email now includes per-tool breakdown and a Credex CTA for high-savings cases
- Fixed audit email share links
- Added CI pipeline with GitHub Actions — lint + test + build on every push to main (`fix: lint errors and add GitHub Actions CI pipeline`)
- Removed audit history feature — was causing instability, pulled it for a clean submission (`refactor: remove audit history feature`)
- Improved dashboard layout responsiveness

**What I learned:**
Gmail SMTP caps at 500 emails/day — fine for MVP, but Resend or Postmark is the right call if this ever scales. Also: cutting a half-built feature before submission is always the right move. Audit history was adding localStorage complexity with no real user value at this stage. Ship less, ship stable.

**Blockers / what I'm stuck on:**
Deployment needed to be solid before touching tests. Vitest tests still unwritten — intentionally holding them until the engine stops changing. Still need to fix the setState lint error and do a final pass on all documentation files.

**Plan for tomorrow:**
Verify deployment is fully stable, then write Vitest tests for the audit engine — holding tests until the engine is locked is the right call here. Final lint fixes and documentation sweep.

---

## Day 7 — 2026-05-13

**Hours worked:** 4

**What I did:**

- Fixed setState-in-effect lint error in AuditForm, fixed save-audit import path (`fix: resolve setState-in-effect lint error, fix save-audit import`)
- Wrote 6 Vitest tests covering the audit engine — Cursor downgrade, Claude Team small seats, ChatGPT Team 2-seat, Copilot use-case mismatch, multi-tool totals, Credex upsell threshold. Tests were intentionally held until Day 6–7 once deployment was stable and the engine wasn't going to change anymore. Updated CI pipeline to run tests (`test: add 6 audit engine tests with vitest, update CI pipeline`)
- Fixed final dashboard UI issues (`fix: improve dashboard`)
- Updated PRICING_DATA.md with corrected prices verified against live vendor pages — caught Windsurf's March 2026 pricing restructure ($15 → $20 Pro, $35 → $40 Teams) and a Claude Team correction ($30 → $25)
- Wrote all required documentation: ARCHITECTURE.md, DEVLOG.md, REFLECTION.md, GTM.md, ECONOMICS.md, USER_INTERVIEWS.md, LANDING_COPY.md, METRICS.md, PROMPTS.md, README.md
- Final deployed URL verified on Vercel

**What I learned:**
Windsurf had a significant pricing restructure in March 2026 — Pro went $15 → $20, Teams $30 → $40. I asked Claude directly and got the wrong numbers. Always verify prices against the live vendor page, not an AI's training data. Also: writing tests after deployment rather than before was the right call here — the engine was stable, the tests were meaningful, and nothing broke at the last minute.

**Blockers / what I'm stuck on:**
None — submitted.

**Plan for tomorrow:**
N/A — waiting on Round 2 results.
