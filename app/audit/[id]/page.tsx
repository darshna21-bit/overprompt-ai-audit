"use client";

import { useEffect, useState } from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import Link from "next/link";

type AuditResult = {
  tool: string;
  currentPlan: string;
  recommendation: string;
  reason: string;
  monthlySavings: number;
};

type AuditData = {
  totalAnnualSavings: number;
  totalMonthlySavings: number;
  results: AuditResult[];
};

export default function SharedAuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const [data, setData] =
    useState<AuditData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  useEffect(() => {

    async function fetchAudit() {

      try {

        const { id } = await params;

        const snap = await getDoc(
          doc(db, "audits", id)
        );

        if (!snap.exists()) {
          setError(true);
          return;
        }

        setData(
          snap.data() as AuditData
        );

      } catch (err) {

        console.error(err);

        setError(true);

      } finally {

        setLoading(false);
      }
    }

    fetchAudit();

  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading audit...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-400">
          Failed to load audit report.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">

      <div className="mx-auto max-w-3xl">

        <p className="mb-4 text-sm text-gray-500">
          Shared AI Spend Audit
        </p>

        <h1 className="mb-2 text-4xl font-bold">
          $
          {data.totalAnnualSavings.toLocaleString()}
          /yr savings identified
        </h1>

        <p className="mb-10 text-gray-400">
          $
          {data.totalMonthlySavings.toLocaleString()}
          /mo across{" "}
          {data.results.length} tool(s)
        </p>

        <div className="space-y-4">

          {data.results.map(
            (r, i) => (

              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >

                <div className="flex items-start justify-between">

                  <div>

                    <p className="font-semibold text-white">
                      {r.tool} — {r.currentPlan}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      {r.recommendation}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      {r.reason}
                    </p>

                  </div>

                  <div className="shrink-0 text-right">

                    {r.monthlySavings > 0 ? (

                      <p className="font-bold text-green-400">
                        ${r.monthlySavings}/mo
                      </p>

                    ) : (

                      <p className="text-sm text-gray-500">
                        Optimal ✓
                      </p>

                    )}

                  </div>

                </div>

              </div>
            )
          )}
        </div>

        <div className="mt-10 rounded-2xl border border-green-500/20 bg-green-500/5 p-6 text-center">

          <p className="mb-4 text-gray-300">
            Want to audit your own AI stack?
          </p>

          <Link
            href="/"
            className="inline-block rounded-xl bg-white px-6 py-3 font-medium text-black hover:opacity-90"
          >
            Run your free audit →
          </Link>

        </div>

      </div>

    </main>
  );
}