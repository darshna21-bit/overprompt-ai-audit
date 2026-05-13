# METRICS.md

---

## North Star Metric

**Qualified lead capture rate** — defined as: (email captures from audits showing >$100/mo savings) ÷ (total audits completed).

**Why:** Overprompt is a lead-generation tool for Credex. Raw audit count is vanity — someone who completes an audit showing $0 savings and bounces is worth nothing to the business. A qualified lead is someone with real savings potential who trusts Overprompt enough to give their email. This metric captures both top-of-funnel quality (are we attracting the right users?) and product value (is the audit compelling enough to earn a lead?). Target: 15–25%.

---

## 3 Input Metrics That Drive the North Star

1. **Audit completion rate** (users who hit Submit ÷ users who started the form). If this drops below 40%, the form is too long or confusing. Target: ≥50%. This feeds the denominator of the North Star.

2. **Average savings shown per audit** (mean monthly savings across all completed audits). If this is too low, we're not attracting high-spend users — or the audit engine is too conservative. Target: ≥$150/mo average. This affects the numerator.

3. **Share URL click-through rate** (clicks on shared audit URLs ÷ share URLs generated). If audits are being shared and driving new traffic, it means the results page is shareable enough to function as a viral loop. Target: ≥3 clicks per share URL.

---

## What to Instrument First

1. **Audit form started** — `analytics.track("audit_form_started")` on first field interaction. Gives us the denominator for completion rate.

2. **Audit submitted** — `analytics.track("audit_submitted", { tool_count, total_spend, total_savings })`. Core funnel step.

3. **Email captured** — `analytics.track("lead_captured", { monthly_savings, show_credex_upsell })`. The money event.

4. **Credex CTA clicked** — `analytics.track("credex_cta_clicked")`. Direct business signal.

5. **Share URL generated / clicked** — track both generation and inbound traffic from share URLs to measure the viral loop.

PostHog or Plausible work well here — both have a generous free tier for an early-stage product.

---

## What Number Triggers a Pivot Decision

If the **qualified lead capture rate stays below 5%** for two consecutive weeks after the product is live and driving >500 audits/week, that's a pivot signal. It means either:

(a) The audit is showing too many "you're spending well" results — suggesting the target user isn't actually overspending (the premise is wrong), or

(b) The value proposition isn't landing — the savings numbers don't feel credible or actionable enough to earn an email.

In scenario (a), pivot the distribution to target higher-spend users (enterprise, Series A+).
In scenario (b), redesign the results page — possibly add a testimonial from a Credex customer showing real savings, or add the PDF export to increase perceived value before the email gate.
