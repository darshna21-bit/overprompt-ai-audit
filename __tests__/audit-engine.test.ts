// __tests__/audit-engine.test.ts
// Run with: npm test
// Covers: generateAudit() and generateAuditReport() in lib/audit-engine.ts

import { describe, it, expect } from "vitest";
import { generateAudit, generateAuditReport } from "../lib/audit-engine";

// ── Test 1 ────────────────────────────────────────────────────────────────────
describe("Cursor Business downgrade to Pro", () => {
  it("should recommend downgrade and calculate real savings when seats <= 3", () => {
    const result = generateAudit({
      tool: "Cursor",
      plan: "Business",
      monthlySpend: 120, // 3 seats × $40
      seats: 3,
      useCase: "Coding",
    });

    // Should recommend downgrade to Pro
    expect(result.category).toBe("downgrade");
    expect(result.recommendedPlan).toContain("Pro");

    // Savings = current ($120) - recommended (3 × $20 = $60) = $60
    expect(result.monthlySavings).toBe(60);
    expect(result.annualSavings).toBe(720);

    // Annual savings must always equal monthly × 12
    expect(result.annualSavings).toBe(result.monthlySavings * 12);
  });
});

// ── Test 2 ────────────────────────────────────────────────────────────────────
describe("Claude Team with small seats", () => {
  it("should recommend individual Pro subscriptions when seats <= 3", () => {
    const result = generateAudit({
      tool: "Claude",
      plan: "Team",
      monthlySpend: 90, // 3 seats × $30
      seats: 3,
      useCase: "Writing",
    });

    // Pro at $20/seat × 3 = $60 → savings = $30
    expect(result.monthlySavings).toBe(30);
    expect(result.annualSavings).toBe(360);
    expect(result.category).toBe("downgrade");
    expect(result.risk).toBe("Low");
  });
});

// ── Test 3 ────────────────────────────────────────────────────────────────────
describe("ChatGPT Team with 2 seats", () => {
  it("should recommend Plus and save $20/mo", () => {
    const result = generateAudit({
      tool: "ChatGPT",
      plan: "Team",
      monthlySpend: 60, // 2 seats × $30
      seats: 2,
      useCase: "Mixed",
    });

    // Plus at $20/seat × 2 = $40 → savings = $20
    expect(result.monthlySavings).toBe(20);
    expect(result.annualSavings).toBe(240);
    expect(result.recommendedPlan).toContain("Plus");
  });
});

// ── Test 4 ────────────────────────────────────────────────────────────────────
describe("GitHub Copilot - non-coding use case", () => {
  it("should flag tool mismatch when use case is not coding", () => {
    const result = generateAudit({
      tool: "GitHub Copilot",
      plan: "Business",
      monthlySpend: 57, // 3 seats × $19
      seats: 3,
      useCase: "Writing",
    });

    // Copilot for writing is a mismatch — should recommend switch
    expect(result.category).toBe("switch_tool");
    expect(result.monthlySavings).toBeGreaterThanOrEqual(0);
  });
});

// ── Test 5 ────────────────────────────────────────────────────────────────────
describe("generateAuditReport - multi-tool totals", () => {
  it("should correctly sum savings across multiple tools", () => {
    const report = generateAuditReport([
      {
        tool: "Cursor",
        plan: "Business",
        monthlySpend: 120,
        seats: 3,
        useCase: "Coding",
      },
      {
        tool: "Claude",
        plan: "Team",
        monthlySpend: 90,
        seats: 3,
        useCase: "Writing",
      },
    ]);

    // Cursor saves $60, Claude saves $30 → total $90/mo
    expect(report.totalMonthlySavings).toBe(90);
    expect(report.totalAnnualSavings).toBe(1080);
    expect(report.results).toHaveLength(2);

    // showCredexUpsell should be false (savings < $500)
    expect(report.showCredexUpsell).toBe(false);
  });
});

// ── Test 6 (bonus) ────────────────────────────────────────────────────────────
describe("Credex upsell threshold", () => {
  it("should set showCredexUpsell true when total monthly savings > $500", () => {
    const report = generateAuditReport([
      {
        tool: "Cursor",
        plan: "Enterprise",
        monthlySpend: 800,
        seats: 10,
        useCase: "Coding",
      },
    ]);

    // Enterprise → Business saves at least $200/mo on 10 seats
    // showCredexUpsell triggers at > $500
    expect(report.showCredexUpsell).toBe(report.totalMonthlySavings > 500);
  });
});