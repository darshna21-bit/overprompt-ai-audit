type Audit = {
  tool: string;
  plan: string;
  annualSavings: number;
  recommendation: string;
};

type Props = {
  audits: Audit[];
};

export default function AuditHistory({
  audits,
}: Props) {

  if (audits.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">

      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-white">
          Recent Audits
        </h3>

        <p className="mt-2 text-sm text-gray-400">
          Previously generated AI optimization reports.
        </p>
      </div>

      <div className="space-y-4">

        {audits.map((audit, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-black/30 p-5"
          >

            <div className="flex items-center justify-between">

              <div>
                <h4 className="text-lg font-semibold text-white">
                  {audit.tool} — {audit.plan}
                </h4>

                <p className="mt-1 text-sm text-gray-400">
                  {audit.recommendation}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-400">
                  Annual Savings
                </p>

                <h4 className="text-2xl font-bold text-green-400">
                  ${audit.annualSavings}
                </h4>
              </div>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}