type Props = {
  monthlySavings: number;
  annualSavings: number;
};

export default function AnalyticsCards({
  monthlySavings,
  annualSavings,
}: Props) {

  const efficiencyScore =
    Math.max(
      100 - monthlySavings / 5,
      65
    );

  const optimizationLevel =
    monthlySavings > 100
      ? "High"
      : monthlySavings > 30
      ? "Medium"
      : "Low";

  const roi =
    annualSavings * 3;

  return (
    <section className="mt-10 grid gap-4 md:grid-cols-3">

      {/* SCORE */}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <p className="text-sm text-gray-400">
          AI Efficiency Score
        </p>

        <h3 className="mt-3 text-4xl font-bold text-white">
          {Math.round(efficiencyScore)}/100
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Estimated operational efficiency based on current AI tooling configuration.
        </p>
      </div>

      {/* OPTIMIZATION */}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <p className="text-sm text-gray-400">
          Optimization Potential
        </p>

        <h3 className="mt-3 text-4xl font-bold text-white">
          {optimizationLevel}
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Estimated opportunity for AI spend and workflow optimization.
        </p>
      </div>

      {/* ROI */}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <p className="text-sm text-gray-400">
          Estimated ROI Impact
        </p>

        <h3 className="mt-3 text-4xl font-bold text-white">
          ${roi}
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Estimated annual business efficiency impact from AI tooling improvements.
        </p>
      </div>

    </section>
  );
}