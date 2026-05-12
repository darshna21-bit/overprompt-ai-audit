"use client";

import { useEffect, useState } from "react";
import { pricingData } from "@/data/pricing";
import { generateAuditReport, type AuditInput, type AuditReport } from "@/lib/audit-engine";
import AnalyticsCards from "./AnalyticsCards";
import SpendChart from "./SpendChart";
import LeadCaptureForm from "./LeadCaptureForm";
import { saveAuditToFirestore } from "@/lib/save.audit";

const TOOLS = Object.keys(pricingData);
const USE_CASES = ["Coding", "Writing", "Research", "Data Analysis", "Mixed"];
const EMPTY_ROW = (): AuditInput => ({
  tool: "",
  plan: "",
  monthlySpend: 0,
  seats: 1,
  useCase: "",
});

export default function AuditForm() {
  const [rows, setRows] = useState<AuditInput[]>([EMPTY_ROW()]);
  const [report, setReport]       = useState<AuditReport | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [auditId, setAuditId]     = useState("");
  const [copied, setCopied]       = useState(false);

  // Persist form state across reloads
  useEffect(() => {

    const loadRows = async () => {

      const saved =
        localStorage.getItem("audit-rows");

      if (saved) {

        try {

          setTimeout(() => {

            setRows(JSON.parse(saved));

          }, 0);

        } catch {}

      }

    };

    loadRows();

  }, []);

  useEffect(() => {
    localStorage.setItem("audit-rows", JSON.stringify(rows));
  }, [rows]);

  const updateRow = (index: number, field: keyof AuditInput, value: string | number) => {
    setRows((prev) => {
      const next = [...prev];
      if (field === "tool") {
        next[index] = { ...next[index], tool: String(value), plan: "" };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const addRow    = () => setRows((prev) => [...prev, EMPTY_ROW()]);
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const invalid = rows.some((r) => !r.tool || !r.plan || !r.useCase || r.monthlySpend <= 0);
    if (invalid) {
      alert("Please fill in all fields for each tool.");
      return;
    }

    setIsLoading(true);
    setAiSummary("");
    setAuditId("");

    await new Promise((r) => setTimeout(r, 1200));

    const result = generateAuditReport(rows);
    setReport(result);

    // Save to Firestore → get shareable ID
    try {
      const id = await saveAuditToFirestore(rows, result);
      setAuditId(id);
    } catch (err) {
      console.error("[AuditForm] Failed to save audit:", err);
    }

    // AI summary
    const primaryRow    = [...rows].sort((a, b) => b.monthlySpend - a.monthlySpend)[0];
    const primaryResult = result.results[0];

    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool:           primaryRow.tool,
          plan:           primaryRow.plan,
          monthlySpend:   primaryRow.monthlySpend,
          seats:          primaryRow.seats,
          useCase:        primaryRow.useCase,
          recommendation: primaryResult?.recommendation,
          monthlySavings: result.totalMonthlySavings,
          annualSavings:  result.totalAnnualSavings,
        }),
      });
      const data = await res.json();
      setAiSummary(data.summary ?? "");
    } catch {
      setAiSummary("");
    }

    // Local audit history
    const history = JSON.parse(localStorage.getItem("audit-history") || "[]");
    localStorage.setItem(
      "audit-history",
      JSON.stringify(
        [{ rows, totalMonthlySavings: result.totalMonthlySavings, date: new Date().toISOString() }, ...history].slice(0, 10)
      )
    );

    setIsLoading(false);
  };

  const totalSpend = rows.reduce((sum, r) => sum + (Number(r.monthlySpend) || 0), 0);

  return (
    <section id="audit-dashboard" className="border-t border-white/10 bg-black px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="mb-14 text-center">
          <h2 className="text-5xl font-bold tracking-tight">Run Your AI Spend Audit</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Add every AI tool your team pays for. Get an instant breakdown of where
            you&apos;re overspending and exactly what to do about it.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] items-start">

          {/* LEFT — Form */}
          <div className="lg:sticky lg:top-24">
            <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">

              <h3 className="text-lg font-semibold text-white">Your AI Stack</h3>

              {rows.map((row, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 font-medium">Tool {i + 1}</span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="text-xs text-gray-500 hover:text-red-400 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <select
                    value={row.tool}
                    onChange={(e) => updateRow(i, "tool", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
                  >
                    <option value="">Select AI Tool</option>
                    {TOOLS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  <select
                    value={row.plan}
                    onChange={(e) => updateRow(i, "plan", e.target.value)}
                    disabled={!row.tool}
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none disabled:opacity-40"
                  >
                    <option value="">Select Plan</option>
                    {row.tool &&
                      pricingData[row.tool]?.plans.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}{p.price > 0 ? ` ($${p.price}/seat/mo)` : " (usage-based)"}
                        </option>
                      ))}
                  </select>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Monthly spend ($)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="200"
                        value={row.monthlySpend || ""}
                        onChange={(e) => updateRow(i, "monthlySpend", Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Seats</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="5"
                        value={row.seats || ""}
                        onChange={(e) => updateRow(i, "seats", Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Use case</label>
                      <select
                        value={row.useCase}
                        onChange={(e) => updateRow(i, "useCase", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-white outline-none"
                      >
                        <option value="">Select</option>
                        {USE_CASES.map((uc) => (
                          <option key={uc} value={uc}>{uc}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addRow}
                className="w-full rounded-2xl border border-dashed border-white/20 px-6 py-3 text-sm text-gray-400 hover:border-white/40 hover:text-white transition"
              >
                + Add another tool
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Analyzing your AI stack..." : `Audit ${rows.length} tool${rows.length !== 1 ? "s" : ""} →`}
              </button>
            </form>
          </div>

          {/* RIGHT — Results */}
          <div>
            {report ? (
              <div className="space-y-8">

                {/* Hero savings */}
                <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-8">
                  <h3 className="text-3xl font-bold text-white">Audit Complete</h3>
                  <p className="mt-2 text-gray-400">
                    {rows.length} tool{rows.length !== 1 ? "s" : ""} analyzed.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
                      <p className="text-sm text-gray-400">Total monthly savings</p>
                      <h4 className="mt-2 text-5xl font-bold text-green-400">
                        ${report.totalMonthlySavings.toLocaleString()}
                      </h4>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
                      <p className="text-sm text-gray-400">Total annual savings</p>
                      <h4 className="mt-2 text-5xl font-bold text-green-400">
                        ${report.totalAnnualSavings.toLocaleString()}
                      </h4>
                    </div>
                  </div>

                  {/* Credex upsell */}
                  {report.showCredexUpsell && (
                    <div className="mt-6 rounded-2xl border border-green-400/30 bg-green-400/10 p-5">
                      <p className="font-semibold text-green-300 text-lg">
                        💡 you&apos;re leaving ${report.totalMonthlySavings.toLocaleString()}/mo on the table
                      </p>
                      <p className="mt-2 text-sm text-gray-300">
                        Credex sources discounted AI infrastructure credits from companies that overforecast usage.
                        Your savings opportunity qualifies for a free consultation.
                      </p>
                      <a
                        href="https://credex.rocks"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-green-400 transition"
                      >
                        Book a Credex consultation →
                      </a>
                    </div>
                  )}

                  {/* ── Share URL block ── appears after Firestore save completes */}
                  {auditId && (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-gray-400 mb-3">Share this audit</p>
                      <div className="flex items-center gap-3">
                        <code className="flex-1 truncate rounded-xl bg-black px-4 py-2.5 text-sm text-green-400">
                          {`${window.location.origin}/audit/${auditId}`}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(`${window.location.origin}/audit/${auditId}`)}
                          className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black hover:opacity-90 transition"
                        >
                          {copied ? "Copied ✓" : "Copy"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI summary */}
                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                      AI-generated summary
                    </p>
                    <p className="leading-7 text-gray-300">
                      {aiSummary
                        ? aiSummary.replace(/\*\*/g, "")
                        : "Generating personalized insights..."}
                    </p>
                  </div>
                </div>

                {/* Per-tool breakdown */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
                  <h3 className="mb-6 text-xl font-semibold text-white">Per-tool breakdown</h3>
                  <div className="space-y-4">
                    {report.results.map((r, i) => (
                      <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-white">{r.tool} — {r.currentPlan}</p>
                            <p className="mt-1 text-sm text-gray-400">{r.recommendation}</p>
                            <p className="mt-2 text-xs text-gray-500 leading-relaxed">{r.reason}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {r.monthlySavings > 0 ? (
                              <>
                                <p className="text-green-400 font-bold text-xl">${r.monthlySavings}/mo</p>
                                <p className="text-xs text-gray-500">${r.annualSavings}/yr</p>
                              </>
                            ) : (
                              <p className="text-gray-500 text-sm">Optimal ✓</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            r.risk === "Low"    ? "bg-green-500/10 text-green-400"   :
                            r.risk === "Medium" ? "bg-yellow-500/10 text-yellow-400" :
                                                  "bg-red-500/10 text-red-400"
                          }`}>
                            {r.risk} risk
                          </span>
                          <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-gray-400">
                            {r.confidence}% confidence
                          </span>
                          <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-gray-400">
                            {r.impact} impact
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analytics */}
                <AnalyticsCards
                  monthlySpend={totalSpend}
                  monthlySavings={report.totalMonthlySavings}
                  annualSavings={report.totalAnnualSavings}
                />

                {/* Chart */}
                <SpendChart
                  monthlySpend={totalSpend}
                  monthlySavings={report.totalMonthlySavings}
                />

                {/* Lead capture — auditId passed so email link works */}
                <LeadCaptureForm
                  tool={rows.map((r) => r.tool).join(", ")}
                  plan={rows.map((r) => r.plan).join(", ")}
                  monthlySavings={report.totalMonthlySavings}
                  annualSavings={report.totalAnnualSavings}
                />

              </div>
            ) : (
              <div className="flex min-h-[600px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-12">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-white">AI Spend Dashboard</h3>
                  <p className="mt-4 max-w-md text-gray-400">
                    Add your AI tools on the left and run the audit to see a full
                    breakdown of savings opportunities across your entire stack.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}