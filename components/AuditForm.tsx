"use client";

import { useEffect, useState } from "react";
import { pricingData } from "@/data/pricing";
import { generateAudit } from "@/lib/audit-engine";

import AnalyticsCards from "./AnalyticsCards";
import SpendChart from "./SpendChart";
import AuditHistory from "./AuditHistory";

export default function AuditForm() {

  const [tool, setTool] = useState("");
  const [plan, setPlan] = useState("");
  const [monthlySpend, setMonthlySpend] = useState("");
  const [seats, setSeats] = useState("");
  const [useCase, setUseCase] = useState("");

  const [auditResult, setAuditResult] =
    useState<any>(null);

  const [auditHistory, setAuditHistory] =
    useState<any[]>([]);

  const [isLoading, setIsLoading] =
    useState(false);

  // LOAD SAVED DATA

  useEffect(() => {

    const savedData =
      localStorage.getItem("audit-form");

    if (savedData) {

      const parsedData =
        JSON.parse(savedData);

      setTool(parsedData.tool || "");
      setPlan(parsedData.plan || "");
      setMonthlySpend(
        parsedData.monthlySpend || ""
      );
      setSeats(parsedData.seats || "");
      setUseCase(parsedData.useCase || "");
    }

    // LOAD HISTORY

    const savedHistory =
      localStorage.getItem("audit-history");

    if (savedHistory) {
      setAuditHistory(
        JSON.parse(savedHistory)
      );
    }

  }, []);

  // SAVE FORM DATA

  useEffect(() => {

    localStorage.setItem(
      "audit-form",

      JSON.stringify({
        tool,
        plan,
        monthlySpend,
        seats,
        useCase,
      })
    );

  }, [
    tool,
    plan,
    monthlySpend,
    seats,
    useCase,
  ]);

  // SUBMIT

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setIsLoading(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 2000)
    );

    const result = generateAudit({
      tool,
      plan,
      monthlySpend:
        Number(monthlySpend),

      seats:
        Number(seats),

      useCase,
    });

    setAuditResult(result);

    // SAVE HISTORY

    const newAudit = {
      tool,
      plan,

      annualSavings:
        result.annualSavings,

      recommendation:
        result.recommendation,
    };

    const updatedHistory = [
      newAudit,
      ...auditHistory,
    ].slice(0, 5);

    setAuditHistory(updatedHistory);

    localStorage.setItem(
      "audit-history",
      JSON.stringify(updatedHistory)
    );

    setIsLoading(false);
  };

  return (

    <section className="border-t border-white/10 bg-black px-6 py-24 text-white">

      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <div className="mb-12 text-center">

          <h2 className="text-4xl font-bold tracking-tight">
            Run Your AI Spend Audit
          </h2>

          <p className="mt-4 text-lg text-gray-400">
            Enter your AI tooling details and discover where
            your startup can save money.
          </p>

        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
        >

          {/* TOOL */}

          <div>

            <label className="mb-2 block text-sm text-gray-300">
              AI Tool
            </label>

            <select
              value={tool}
              onChange={(e) =>
                setTool(e.target.value)
              }

              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
            >

              <option value="">
                Select Tool
              </option>

              {Object.keys(pricingData).map(
                (toolName) => (

                  <option
                    key={toolName}
                    value={toolName}
                  >
                    {toolName}
                  </option>
                )
              )}

            </select>

          </div>

          {/* PLAN */}

          <div>

            <label className="mb-2 block text-sm text-gray-300">
              Current Plan
            </label>

            <select
              value={plan}
              onChange={(e) =>
                setPlan(e.target.value)
              }

              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
            >

              <option value="">
                Select Plan
              </option>

              {tool &&
                pricingData[
                  tool as keyof typeof pricingData
                ]?.plans.map(
                  (planOption) => (

                    <option
                      key={planOption.name}
                      value={planOption.name}
                    >
                      {planOption.name}
                      {" "}
                      (${planOption.price}/mo)
                    </option>
                  )
                )}

            </select>

          </div>

          {/* INPUTS */}

          <div className="grid gap-6 md:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm text-gray-300">
                Monthly Spend ($)
              </label>

              <input
                type="number"
                placeholder="300"

                value={monthlySpend}

                onChange={(e) =>
                  setMonthlySpend(
                    e.target.value
                  )
                }

                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm text-gray-300">
                Number of Seats
              </label>

              <input
                type="number"
                placeholder="5"

                value={seats}

                onChange={(e) =>
                  setSeats(e.target.value)
                }

                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
              />

            </div>

          </div>

          {/* USE CASE */}

          <div>

            <label className="mb-2 block text-sm text-gray-300">
              Primary Use Case
            </label>

            <select
              value={useCase}

              onChange={(e) =>
                setUseCase(
                  e.target.value
                )
              }

              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
            >

              <option value="">
                Select Use Case
              </option>

              <option>
                Coding
              </option>

              <option>
                Writing
              </option>

              <option>
                Research
              </option>

              <option>
                Data Analysis
              </option>

              <option>
                Mixed
              </option>

            </select>

          </div>

          {/* BUTTON */}

          <button
            type="submit"
            disabled={isLoading}

            className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {isLoading
              ? "Analyzing AI Stack..."
              : "Generate Audit"}

          </button>

        </form>

        {/* RESULTS */}

        {auditResult && (

          <div className="mt-8 rounded-3xl border border-green-500/20 bg-green-500/5 p-8">

            {/* TITLE */}

            <div className="mb-6">

              <h3 className="text-3xl font-bold text-white">
                Potential Savings Found
              </h3>

              <p className="mt-2 text-gray-400">
                Here’s your AI spend optimization summary.
              </p>

            </div>

            {/* SAVINGS */}

            <div className="grid gap-6 md:grid-cols-2">

              <div className="rounded-2xl border border-white/10 bg-black/40 p-6">

                <p className="text-sm text-gray-400">
                  Monthly Savings
                </p>

                <h4 className="mt-2 text-4xl font-bold text-green-400">
                  ${auditResult.monthlySavings}
                </h4>

              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-6">

                <p className="text-sm text-gray-400">
                  Annual Savings
                </p>

                <h4 className="mt-2 text-4xl font-bold text-green-400">
                  ${auditResult.annualSavings}
                </h4>

              </div>

            </div>

            {/* RECOMMENDATION */}

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6">

              <p className="text-sm text-gray-400">
                Recommendation
              </p>

              <h4 className="mt-3 text-2xl font-semibold text-white">
                {auditResult.recommendation}
              </h4>

              <p className="mt-4 leading-7 text-gray-400">
                {auditResult.reason}
              </p>

              {/* INSIGHT CARDS */}

              <div className="mt-8 grid gap-4 md:grid-cols-3">

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">

                  <p className="text-sm text-gray-400">
                    Confidence
                  </p>

                  <h5 className="mt-2 text-2xl font-semibold text-white">
                    {auditResult.confidence}%
                  </h5>

                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">

                  <p className="text-sm text-gray-400">
                    Optimization Category
                  </p>

                  <h5 className="mt-2 text-lg font-semibold text-white">
                    {auditResult.category}
                  </h5>

                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">

                  <p className="text-sm text-gray-400">
                    Estimated Impact
                  </p>

                  <h5 className="mt-2 text-lg font-semibold text-white">
                    {auditResult.impact}
                  </h5>

                </div>

              </div>

            </div>

            {/* ANALYTICS */}

            <AnalyticsCards
              monthlySavings={
                auditResult.monthlySavings
              }

              annualSavings={
                auditResult.annualSavings
              }
            />

            {/* CHART */}

            <SpendChart
              monthlySpend={
                Number(monthlySpend)
              }

              monthlySavings={
                auditResult.monthlySavings
              }
            />

            {/* HISTORY */}

            <AuditHistory
              audits={auditHistory}
            />

          </div>
        )}

      </div>

    </section>
  );
}