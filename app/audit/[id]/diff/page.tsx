// app/audit/[id]/diff/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateAudit, AuditResult, AuditInput } from "@/lib/audit-engine";

export default function DiffPage() {
  const { id } = useParams<{ id: string }>();
  const [oldResults, setOldResults] = useState<AuditResult[]>([]);
  const [newResults, setNewResults] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const ref = doc(db, "audits", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) { setError("Audit not found."); return; }

        const data = snap.data();
        const inputs: AuditInput[] = data.inputs ?? [];
        const old: AuditResult[] = data.results ?? [];
        const fresh = inputs.map(generateAudit);

        setOldResults(old);
        setNewResults(fresh);
      } catch (e) {
        setError("Failed to load audit.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-white">Loading diff...</div>;
  if (error)   return <div className="p-8 text-center text-red-400">{error}</div>;

  const oldTotal = oldResults.reduce((s, r) => s + r.monthlySavings, 0);
  const newTotal = newResults.reduce((s, r) => s + r.monthlySavings, 0);
  const delta = newTotal - oldTotal;

  return (
    <main className="min-h-screen bg-black text-white px-6 py-20">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold mb-2">Audit Diff</h1>
        <p className="text-gray-400 mb-8">
          What changed since your last audit.
        </p>

        {/* Headline delta */}
        <div className={`rounded-xl p-4 mb-8 text-center text-lg font-semibold ${
          delta > 0 ? "bg-green-500/10 text-green-400 border border-green-500/20" :
          delta < 0 ? "bg-red-500/10 text-red-400 border border-red-500/20" :
          "bg-white/5 text-gray-400 border border-white/10"
        }`}>
          {delta === 0
            ? "No change in total savings"
            : `Total savings ${delta > 0 ? "increased" : "decreased"} by $${Math.abs(delta)}/mo`}
        </div>

        {/* Per-tool rows */}
        <div className="space-y-4">
          {newResults.map((nr) => {
            const or = oldResults.find((r) => r.tool === nr.tool);

            // Check all three dimensions — plan, cost, savings
            const changed = or && (
              or.recommendedMonthlyCost !== nr.recommendedMonthlyCost ||
              or.recommendedPlan !== nr.recommendedPlan ||
              or.monthlySavings !== nr.monthlySavings
            );

            return (
              <div
                key={nr.tool}
                className={`border rounded-xl p-5 ${
                  changed
                    ? "border-orange-500/30 bg-orange-500/5"
                    : "border-white/10 bg-white/[0.02] opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-white">{nr.tool}</span>
                  {changed
                    ? <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">Changed</span>
                    : <span className="text-xs bg-white/10 text-gray-500 px-2 py-0.5 rounded-full">Same</span>
                  }
                </div>

                {changed && or ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {/* Previous */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <div className="text-gray-500 text-xs mb-1">Previous</div>
                      <div className="font-medium text-white">{or.recommendedPlan}</div>
                      <div className="text-gray-400">${or.recommendedMonthlyCost}/mo</div>
                      <div className="text-green-400 mt-1">Saved ${or.monthlySavings}/mo</div>
                    </div>
                    {/* Now */}
                    <div className="bg-white/5 border border-orange-500/20 rounded-lg p-3">
                      <div className="text-orange-400 text-xs mb-1">Now</div>
                      <div className="font-medium text-white">{nr.recommendedPlan}</div>
                      <div className="text-gray-400">${nr.recommendedMonthlyCost}/mo</div>
                      <div className={`mt-1 ${nr.monthlySavings >= or.monthlySavings ? "text-green-400" : "text-red-400"}`}>
                        Saves ${nr.monthlySavings}/mo
                        {nr.monthlySavings !== or.monthlySavings && (
                          <span className="ml-1 text-xs">
                            ({nr.monthlySavings > or.monthlySavings ? "+" : ""}
                            {nr.monthlySavings - or.monthlySavings}/mo)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{nr.recommendation}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Link to full updated audit */}
        <div className="mt-8 text-center">
          <a
            href={`/audit/${id}`}
            className="inline-block bg-white text-black px-6 py-3 rounded-xl font-medium hover:opacity-90 transition"
          >
            View full updated audit →
          </a>
        </div>

      </div>
    </main>
  );
}