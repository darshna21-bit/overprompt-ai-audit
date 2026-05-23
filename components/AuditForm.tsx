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
  // ── Fixed: initialize from localStorage directly — avoids setState-in-effect lint error
  const [rows, setRows] = useState<AuditInput[]>([EMPTY_ROW()]);

  const [report, setReport]       = useState<AuditReport | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [auditId, setAuditId]     = useState("");
  const [copied, setCopied]       = useState(false);
  const [mounted, setMounted] = useState(false);

  // Save rows to localStorage on every change
    useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem("audit-rows");

        if (saved) {
          setRows(JSON.parse(saved));
        }

        setMounted(true);
      } catch {
        console.error("Failed to load saved audit rows");
        setMounted(true);
      }
    });
}, []);

  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem("audit-rows", JSON.stringify(rows));
  }, [rows, mounted]);

  if (!mounted) return null;

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

    // WITH THIS:
    try {
      const id = await saveAuditToFirestore(rows, result, undefined); // email added later by LeadCaptureForm
      setAuditId(id);
    } catch (err) {
      console.error("[AuditForm] Failed to save audit:", err);
    }

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
    <section id="audit-dashboard" className="border-t border-white/10 bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-14 text-center">
          <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-gray-400 mb-4">
            Free — no account required
          </span>
          <h2 className="text-5xl font-bold tracking-tight">Run Your AI Spend Audit</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
            Add every AI tool your team pays for. Get an instant breakdown of
            where you&apos;re overspending and exactly what to do about it.
          </p>
        </div>

        <div className="grid gap-10 items-start lg:grid-cols-[420px_minmax(0,1fr)]">

          {/* LEFT — Form */}
          <div className="lg:sticky lg:top-8">
            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Your AI Stack</h3>
                <span className="text-xs text-gray-500">{rows.length} tool{rows.length !== 1 ? "s" : ""}</span>
              </div>

              {rows.map((row, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4">

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tool {i + 1}
                    </span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="text-xs text-gray-600 hover:text-red-400 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <select
                    value={row.tool}
                    onChange={(e) => updateRow(i, "tool", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white outline-none focus:border-white/30 transition"
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
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white outline-none focus:border-white/30 transition disabled:opacity-30"
                  >
                    <option value="">Select Plan</option>
                    {row.tool &&
                      pricingData[row.tool]?.plans.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}{p.price > 0 ? ` — $${p.price}/seat/mo` : " — usage-based"}
                        </option>
                      ))}
                  </select>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs text-gray-500">Spend/mo ($)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="200"
                        value={row.monthlySpend || ""}
                        onChange={(e) => updateRow(i, "monthlySpend", Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30 transition"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-gray-500">Seats</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="5"
                        value={row.seats || ""}
                        onChange={(e) => updateRow(i, "seats", Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30 transition"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-gray-500">Use case</label>
                      <select
                        value={row.useCase}
                        onChange={(e) => updateRow(i, "useCase", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30 transition"
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
                className="w-full rounded-2xl border border-dashed border-white/15 px-6 py-3 text-sm text-gray-500 hover:border-white/30 hover:text-gray-300 transition"
              >
                + Add another tool
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading
                  ? "Analyzing your AI stack..."
                  : `Audit ${rows.length} tool${rows.length !== 1 ? "s" : ""} →`}
              </button>

              <p className="text-center text-xs text-gray-600">
                Free forever · No account needed · Results in seconds
              </p>
            </form>
          </div>

          {/* RIGHT — Results */}
          <div className="min-w-0">
            {report ? (
              <div className="space-y-6">

                {/* Hero savings card */}
                <div className="rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-green-400 font-medium mb-1">Audit Complete</p>
                      <h3 className="text-3xl font-bold text-white">
                        {rows.length} tool{rows.length !== 1 ? "s" : ""} analyzed
                      </h3>
                    </div>
                    <span className="rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs text-green-400">
                      Live results
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/50 p-6">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Monthly savings</p>
                      <h4 className="text-5xl font-bold text-green-400">
                        ${report.totalMonthlySavings.toLocaleString()}
                      </h4>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/50 p-6">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Annual savings</p>
                      <h4 className="text-5xl font-bold text-green-400">
                        ${report.totalAnnualSavings.toLocaleString()}
                      </h4>
                    </div>
                  </div>

                  {/* Credex upsell */}
                  {report.showCredexUpsell && (
                    <div className="mt-5 rounded-2xl border border-green-400/20 bg-green-400/5 p-5">
                      <p className="font-semibold text-green-300">
                        💡 You&apos;re leaving ${report.totalMonthlySavings.toLocaleString()}/mo on the table
                      </p>
                      <p className="mt-1.5 text-sm text-gray-400">
                        Credex sources discounted AI credits from companies that overforecast usage — up to 60% off retail. Your stack qualifies.
                      </p>
                      <a
                        href="https://credex.rocks"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-green-400 transition"
                      >
                        Book a free Credex consultation →
                      </a>
                    </div>
                  )}

                  {/* Share URL */}
                  {auditId && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs text-gray-500 mb-2">Share this audit</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 truncate rounded-lg bg-black/60 px-3 py-2 text-xs text-green-400">
                          {`${window.location.origin}/audit/${auditId}`}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(`${window.location.origin}/audit/${auditId}`)}
                          className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black hover:opacity-90 transition"
                        >
                          {copied ? "Copied ✓" : "Copy"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI summary */}
                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                      AI-generated summary
                    </p>
                    <p className="text-sm leading-7 text-gray-300">
                      {aiSummary
                        ? aiSummary.replace(/\*\*/g, "")
                        : "Generating personalized insights..."}
                    </p>
                  </div>
                </div>

                {/* Per-tool breakdown */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
                  <h3 className="mb-5 text-lg font-semibold text-white">Per-tool breakdown</h3>
                  <div className="space-y-3">
                    {report.results.map((r, i) => (
                      <div key={i} className="rounded-2xl border border-white/10 bg-black/40 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-sm">{r.tool} — {r.currentPlan}</p>
                            <p className="mt-1 text-sm text-gray-400">{r.recommendation}</p>
                            <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">{r.reason}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {r.monthlySavings > 0 ? (
                              <>
                                <p className="text-green-400 font-bold text-lg">${r.monthlySavings}/mo</p>
                                <p className="text-xs text-gray-600">${r.annualSavings}/yr</p>
                              </>
                            ) : (
                              <p className="text-gray-600 text-sm">Optimal ✓</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            r.risk === "Low"    ? "bg-green-500/10 text-green-400"   :
                            r.risk === "Medium" ? "bg-yellow-500/10 text-yellow-400" :
                                                  "bg-red-500/10 text-red-400"
                          }`}>
                            {r.risk} risk
                          </span>
                          <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-gray-500">
                            {r.confidence}% confidence
                          </span>
                          <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-gray-500">
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

                {/* Lead capture */}
                <LeadCaptureForm
                  tool={rows.map((r) => r.tool).join(", ")}
                  plan={rows.map((r) => r.plan).join(", ")}
                  monthlySavings={report.totalMonthlySavings}
                  annualSavings={report.totalAnnualSavings}
                  auditId={auditId}
                />

              </div>
            ) : (
              <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12">
                <div className="text-center max-w-sm">
                  <div className="mb-4 text-4xl">📊</div>
                  <h3 className="text-xl font-semibold text-white">Your audit appears here</h3>
                  <p className="mt-3 text-sm text-gray-500">
                    Add your AI tools on the left, fill in your spend and seats,
                    then hit Audit to see your full savings breakdown.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-gray-600">
                    <span className="rounded-full border border-white/10 px-3 py-1">Per-tool breakdown</span>
                    <span className="rounded-full border border-white/10 px-3 py-1">Savings chart</span>
                    <span className="rounded-full border border-white/10 px-3 py-1">AI summary</span>
                    <span className="rounded-full border border-white/10 px-3 py-1">Shareable URL</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}