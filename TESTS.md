# TESTS.md

## How to run

```bash
npm test
```

All tests use [Vitest](https://vitest.dev/) and run against the audit engine directly — no browser, no mocking required.

---

## Test file

**Filename:** `__tests__/audit-engine.test.ts`

---

## Test coverage

### Test 1 — Cursor Business downgrade to Pro

**Covers:** When a team has ≤3 seats on Cursor Business ($40/seat), the engine should recommend downgrading to Pro ($20/seat) and calculate real savings as `currentSpend - (20 × seats)`.

**Asserts:**

- `category === "downgrade"`
- `recommendedPlan` contains "Pro"
- `monthlySavings === 60` (120 - 60)
- `annualSavings === monthlySavings × 12`

---

### Test 2 — Claude Team with small seats

**Covers:** Claude Team ($25/seat) with ≤3 seats should recommend individual Pro subscriptions ($20/seat) as the cheaper option.

**Asserts:**

- `monthlySavings === 15`
- `annualSavings === 180`
- `category === "downgrade"`
- `risk === "Low"`

---

### Test 3 — ChatGPT Team with 2 seats

**Covers:** ChatGPT Team ($30/seat) with 2 seats should recommend Plus ($20/seat) and save $20/mo.

**Asserts:**

- `monthlySavings === 20`
- `annualSavings === 240`
- `recommendedPlan` contains "Plus"

---

### Test 4 — GitHub Copilot non-coding use case

**Covers:** GitHub Copilot is an IDE-native tool. When use case is "Writing", the engine should flag a tool mismatch and recommend switching.

**Asserts:**

- `category === "switch_tool"`
- `monthlySavings >= 0`

---

### Test 5 — Multi-tool report total savings

**Covers:** `generateAuditReport()` correctly sums savings across multiple tools and returns accurate totals.

**Asserts:**

- `totalMonthlySavings === 75` (Cursor $60 + Claude $15)
- `totalAnnualSavings === 900`
- `results.length === 2`
- `showCredexUpsell === false` (savings < $500)

---

### Test 6 — Credex upsell threshold

**Covers:** `showCredexUpsell` is set to `true` only when total monthly savings exceed $500.

**Asserts:**

- `showCredexUpsell === (totalMonthlySavings > 500)`
