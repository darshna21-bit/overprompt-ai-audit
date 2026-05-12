type Props = {
  monthlySpend: number;
  monthlySavings: number;
  annualSavings: number;
};

export default function AnalyticsCards({
  monthlySpend,
  monthlySavings,
  annualSavings,
}: Props) {
  const savingsRate =
    monthlySpend > 0
      ? Math.round((monthlySavings / monthlySpend) * 100)
      : 0;

  const optimizationLevel =
    savingsRate > 25 ? "High" : savingsRate > 10 ? "Medium" : "Low";

  const optimizationColor =
    savingsRate > 25
      ? "text-green-400"
      : savingsRate > 10
      ? "text-yellow-400"
      : "text-gray-400";

  // Payback framing: how many months of savings cover one month's full spend
  // (i.e. how quickly does the optimized cost "pay back" vs staying put)
  const paybackMonths =
    monthlySavings > 0
      ? Math.ceil(monthlySpend / monthlySavings)
      : null;

  return (
    <section className="mt-10 grid gap-4 md:grid-cols-3">

      {/* SAVINGS RATE */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <p className="text-sm text-gray-400">Savings Rate</p>
        <h3 className="mt-3 text-4xl font-bold text-white">
          {savingsRate}%
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          {savingsRate > 0
            ? `${savingsRate}% of your current $${monthlySpend}/mo spend can be eliminated.`
            : "Your current spend is already well-optimized."}
        </p>
      </div>

      {/* OPTIMIZATION LEVEL */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <p className="text-sm text-gray-400">Optimization Potential</p>
        <h3 className={`mt-3 text-4xl font-bold ${optimizationColor}`}>
          {optimizationLevel}
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          {optimizationLevel === "High"
            ? "Significant plan misalignment detected. Action recommended."
            : optimizationLevel === "Medium"
            ? "Moderate savings opportunity. Worth reviewing your plan tier."
            : "Your tooling appears appropriately matched to your usage."}
        </p>
      </div>

      {/* ANNUAL SAVINGS OR PAYBACK */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <p className="text-sm text-gray-400">Annual Savings</p>
        <h3 className="mt-3 text-4xl font-bold text-white">
          ${annualSavings.toLocaleString()}
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          {paybackMonths !== null
            ? `At $${monthlySavings}/mo saved, your annual saving equals ${paybackMonths} month${paybackMonths !== 1 ? "s" : ""} of current spend.`
            : "No immediate savings identified for this tool and plan combination."}
        </p>
      </div>

    </section>
  );
}