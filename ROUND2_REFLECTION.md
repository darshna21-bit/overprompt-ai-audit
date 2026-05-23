# Round 2 Reflection

## 1. What was the most uncomfortable trade-off you made because of the time pressure?

The trade-off was between `pricingSnapshot` correctness and shipping on time.

In `save.audit.ts`, the snapshot was saved as `generateAudit(inp).recommendedMonthlyCost` — the engine's recommended cost. In `detect-changes/route.ts`, the new snapshot is computed as `PLAN_PRICES[inp.tool]?.[inp.plan]` — the canonical vendor price for the user's current plan. These are different numbers. `recommendedMonthlyCost` is what the engine thinks the user should pay after switching plans. `PLAN_PRICES[tool][plan]` is what the vendor actually charges for the plan they're currently on.

The correct signal for "did vendor pricing change" is option 2. I knew this when I wrote `detect-changes` — the comment in the route even says "Stores the current plan's canonical price per seat — NOT the recommended cost." But I didn't go back and fix `save.audit.ts` to match before pushing. The feature would still fire when things changed, but the baseline was inconsistent and could produce false positives on a user's first re-check. Fixing it properly would have taken maybe 20 minutes. I chose to ship and document it instead. That was the uncomfortable call: knowingly leaving a data inconsistency in a live path to hit the deadline.

## 2. If we extended the deadline by another 24 hours right now, what's the single first thing you'd do?

I actually used the time to fix the `pricingSnapshot` bug before submitting.

The fix was in `save.audit.ts` — importing `PLAN_PRICES` from `audit-engine.ts` and replacing the snapshot logic:

    // Before (wrong):
    pricingSnapshot: Object.fromEntries(
      inputs.map((inp) => [inp.tool, generateAudit(inp).recommendedMonthlyCost])
    )

    // After (correct):
    pricingSnapshot: Object.fromEntries(
      inputs.map((inp) => [inp.tool, PLAN_PRICES[inp.tool]?.[inp.plan] ?? 0])
    )

With that fixed, the next thing was closing the GET handler auth gap in `detect-changes/route.ts` — which I also fixed. Both were data correctness and security issues with downstream blast radius. The auth gap less so than the snapshot bug, but both were worth the 10 minutes each took.

With a full extra 24 hours I'd move `userEmail` capture to a required step before saving the audit to Firestore, eliminating the `updateDoc` retrofit in `LeadCaptureForm` and ensuring `detect-changes` never silently skips a user because they closed the tab before submitting their email.

## 3. Looking back at your Round 1 codebase as a now-experienced user of it: what's the one thing your Round 1 self made harder for your Round 2 self?

Not separating `userEmail` from the audit document at save time.

In Round 1, email capture was a separate flow — user runs audit, audit is saved to Firestore with `userEmail: null`, then user optionally submits their email via `LeadCaptureForm`, which writes to a separate `leads` collection. The audit doc never got the email unless I explicitly added a `updateDoc` call back to it.

For Round 2, `detect-changes` needs `userEmail` on the audit doc to know who to email. Because Round 1 didn't put it there, I had to add a `updateDoc` patch in `LeadCaptureForm` as a retrofit:

    await updateDoc(doc(db, "audits", auditId), { userEmail: email });

This works, but it means any user who ran an audit and didn't submit their email has `userEmail: null` permanently — `detect-changes` skips them silently. If I'd designed Round 1 with the assumption that audits would eventually need to notify users, I would have made email a required field upfront (or at least an optional one stored on the audit doc from the start). The separation made sense for Round 1's lead-capture framing, but it created a gap that took time to identify and patch in Round 2.
