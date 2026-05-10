"use client";

import { useEffect, useState } from "react";
import AuditHistory from "@/components/AuditHistory";

export default function AuditHistoryPage() {

  const [audits, setAudits] =
    useState<any[]>([]);

  useEffect(() => {

    const savedAudits =
      localStorage.getItem("audit-history");

    if (savedAudits) {
      setAudits(
        JSON.parse(savedAudits)
      );
    }

  }, []);

  return (

    <main className="min-h-screen bg-black px-6 py-24 text-white">

      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="mb-12 text-center">

          <h1 className="text-5xl font-bold tracking-tight">
            Audit History
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Review previously generated AI spend
            optimization reports and recommendations.
          </p>

        </div>

        {/* EMPTY STATE */}

        {audits.length === 0 ? (

          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-12 text-center">

            <h3 className="text-2xl font-semibold text-white">
              No Audit History Yet
            </h3>

            <p className="mt-4 text-gray-400">
              Generate your first AI audit to start
              tracking optimization insights.
            </p>

            <a
              href="/#audit-dashboard"
              className="mt-8 inline-block rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:opacity-90"
            >
              Run First Audit
            </a>

          </div>

        ) : (

          <AuditHistory audits={audits} />

        )}

      </div>

    </main>
  );
}