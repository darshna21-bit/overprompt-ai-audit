"use client";

import { useState } from "react";
import { pricingData } from "@/data/pricing";

export default function AuditForm() {
  const [tool, setTool] = useState("");
  const [plan, setPlan] = useState("");
  const [monthlySpend, setMonthlySpend] = useState("");
  const [seats, setSeats] = useState("");
  const [useCase, setUseCase] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log({
      tool,
      plan,
      monthlySpend,
      seats,
      useCase,
    });
  };

  return (
    <section className="border-t border-white/10 bg-black px-6 py-24 text-white">
      <div className="mx-auto max-w-3xl">

        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            Run Your AI Spend Audit
          </h2>

          <p className="mt-4 text-lg text-gray-400">
            Enter your AI tooling details and discover where
            your startup can save money.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
        >

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              AI Tool
            </label>

            <select
              value={tool}
              onChange={(e) => setTool(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
            >
                {Object.keys(pricingData).map((toolName) => (
                <option key={toolName} value={toolName}>
                    {toolName}
                </option>
                ))}
              
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-300">
                Current Plan
            </label>

            <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
            >
                <option value="">Select Plan</option>

                {tool &&
                pricingData[tool as keyof typeof pricingData]?.plans.map(
                    (planOption) => (
                    <option
                        key={planOption.name}
                        value={planOption.name}
                    >
                        {planOption.name} (${planOption.price}/mo)
                    </option>
                    )
                )}
            </select>
            </div>

          <div className="grid gap-6 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Monthly Spend ($)
              </label>

              <input
                type="number"
                placeholder="300"
                value={monthlySpend}
                onChange={(e) => setMonthlySpend(e.target.value)}
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
                onChange={(e) => setSeats(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
              />
            </div>

          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Primary Use Case
            </label>

            <select
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
            >
              <option value="">Select Use Case</option>
              <option>Coding</option>
              <option>Writing</option>
              <option>Research</option>
              <option>Data Analysis</option>
              <option>Mixed</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-black transition hover:opacity-90"
          >
            Generate Audit
          </button>

        </form>
      </div>
    </section>
  );
}