type AuditHistoryItem = {
  rows: unknown[];
  totalMonthlySavings: number;
  date: string;
};

type Props = {
  audits: AuditHistoryItem[];
};

export default function AuditHistory({
  audits,
}: Props) {

  if (audits.length === 0) {
    return null;
  }

  return (
    <section
      id="audit-history"
      className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
    >

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
                  Audit #{index + 1}
                </h4>

                <p className="mt-1 text-sm text-gray-400">
                  {audit.rows.length} tool(s) analyzed
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  {audit.date}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-400">
                  Monthly Savings
                </p>

                <h4 className="text-2xl font-bold text-green-400">
                  ${audit.totalMonthlySavings}
                </h4>
              </div>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}