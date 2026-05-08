const features = [
  {
    title: "Detect Overspending",
    description:
      "Identify AI subscriptions and plans that cost more than your team actually needs.",
  },
  {
    title: "Smart Recommendations",
    description:
      "Get optimized plan suggestions and alternative AI tools based on your workflow.",
  },
  {
    title: "Annual Savings Insights",
    description:
      "See projected monthly and yearly savings opportunities across your entire AI stack.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="border-t border-white/10 bg-black px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            Built for AI-first teams
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Overprompt helps startups optimize AI tooling costs
            without sacrificing productivity.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
            >
              <h3 className="text-2xl font-semibold">
                {feature.title}
              </h3>

              <p className="mt-4 text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}