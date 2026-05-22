# ROUND2_PR.md

## What this PR does

Adds the "Re-audit on Pricing Change" feature to Overprompt. Every completed audit is now persisted to Firestore with a pricing snapshot. A daily cron job detects when vendor pricing has changed since any stored audit, emails the affected user with a summary of what changed, and links them to a new diff view showing old vs new recommendations side by side.

---

## Why

A one-time audit goes stale. Cursor raised prices, Claude restructured tiers, Copilot added a Pro+ plan — users who ran their audit three months ago are now making decisions based on outdated data. Stale audits are worse than no audit because they create false confidence. This feature makes Overprompt's output live rather than a snapshot.

The email-driven re-engagement loop also creates a reason for users to come back, which matters for Credex's lead quality — a user who clicks "re-audit" after a pricing change is a warmer lead than one who ran it once and never returned.

---

## How it works

    PLAN_PRICES (audit-engine.ts)
          ↓
    saveAuditToFirestore — stores inputs[], results[], pricingSnapshot{tool: vendorPrice}
          ↓
    vercel.json cron → POST /api/detect-changes (daily, 9am UTC)
          ↓
      For each user (grouped by email, most recent audit only):
        1. Compute new snapshot from today's PLAN_PRICES
        2. Re-run generateAudit() on stored inputs → fresh results
        3. Compare: price moved? plan changed? savings changed?
        4. If changes → send email via Nodemailer/Gmail SMTP
        5. Update pricingSnapshot in Firestore (only after successful send)
          ↓
    Email CTA → /audit/[id]/diff
          ↓
    DiffPage: loads stored results (old) + re-runs generateAudit (new) → side-by-side

`pricingSnapshot` stores `PLAN_PRICES[tool][plan]` — the vendor's canonical price for the user's current plan, not the engine's recommended cost. This is the correct signal for "did the vendor change their price."

The `leadsCapture` form also writes `userEmail` back to the audit document via `updateDoc`, so `detect-changes` knows who to notify.

---

## What I cut

- **Supabase scheduled functions** — Vercel Cron + a POST endpoint is simpler and requires no new service. The brief says scheduled or manual trigger, either is fine.
- **Resend / Postmark for email** — Requires a verified custom domain. Not feasible in the time available. Gmail SMTP via Nodemailer works immediately and is the same transport used in Round 1. Limit is 500 emails/day — acceptable for MVP, documented in ARCHITECTURE.md for when it needs to change.
- **Full accordion collapse on diff rows** — Unchanged tools are muted (opacity: 60) rather than fully collapsible. A full accordion would have taken 30 extra minutes for UI I didn't think reviewers needed to see. The data is correct; the interaction is simplified.
- **Admin dashboard** — Brief listed it as bonus only. Skipped.
- **"What changed in the AI tooling market this week" public page** — Also bonus. Skipped.

---

## How to test it manually

1.  Go to https://overprompt-ai-audit.vercel.app
2.  Submit an audit with any tool (e.g. Cursor Pro, 3 seats, $105/mo) and your real email
3.  Submit the lead capture form with your email — this writes `userEmail` to the audit doc
4.  Trigger detect-changes manually:

        POST /api/detect-changes?secret=<CRON_SECRET>

    Or locally with:

        curl -X POST "http://localhost:3000/api/detect-changes?secret=YOUR_SECRET"

5.  To simulate a pricing change: update `PLAN_PRICES` in `lib/audit-engine.ts` (e.g. change Cursor Pro from 35 to 40), redeploy, then trigger the endpoint again
6.  Check inbox — email should arrive with the changed tool, savings delta, and "See what changed →" link
7.  Click the link — lands on `/audit/[id]/diff` showing old vs new side by side with total delta headline

---

## What's tested

No new automated tests added in this PR — the Round 2 feature is primarily an integration across Firestore, email, and the cron endpoint, which doesn't lend itself to pure unit tests the way the audit engine does.

The audit engine itself (which `detect-changes` relies on via `generateAudit`) is covered by the 6 Vitest tests from Round 1: Cursor downgrade, Claude Team small seats, ChatGPT Business 2-seat, Copilot use-case mismatch, multi-tool totals, Credex upsell threshold. These still pass.

If I had more time, I would test: (1) `getChangedTools` — mock two snapshots with a known diff and assert the correct tools are flagged, (2) `buildEmailHtml` — assert the delta sign and tool rows render correctly, (3) the `updateDoc` path in `LeadCaptureForm` — mock Firestore and assert `userEmail` is written back.

---

## Open questions / risks

- **Anonymous audits** — Users who ran an audit without submitting their email have `userEmail: null` and will never receive re-audit notifications. This is intentional (they didn't opt in), but it means the feature only reaches a subset of users.
- **Gmail SMTP 500/day cap** — Fine for MVP but a real ceiling if this gets traction. Documented in ARCHITECTURE.md for when it needs to change.
- **`userEmail` race window** — Email is written to the audit doc via `updateDoc` in `LeadCaptureForm` after save. If the user closes the tab before submitting the lead form, their email is never stored and they won't receive re-audit notifications. Fix would be making email a required field at audit-save time.
