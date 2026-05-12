"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";

type Props = {
  monthlySpend: number;
  monthlySavings: number;
};

const currencyFormatter = (value: number) =>
  `$${value.toLocaleString()}`;

export default function SpendChart({ monthlySpend, monthlySavings }: Props) {
  const optimizedSpend = Math.max(0, monthlySpend - monthlySavings);
  const noSavings = monthlySavings === 0;

  const data = [
    { name: "Current",   spend: monthlySpend,   label: `$${monthlySpend.toLocaleString()}` },
    { name: "Optimized", spend: optimizedSpend, label: `$${optimizedSpend.toLocaleString()}` },
  ];

  return (
    <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-white">
          Spend Optimization Overview
        </h3>
        <p className="mt-2 text-sm text-gray-400">
          {noSavings
            ? "Your current spend is already optimized for this tool and plan."
            : `Estimated monthly AI spend before and after optimization — $${monthlySavings.toLocaleString()}/mo saving.`}
        </p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 24, right: 16, left: 8, bottom: 0 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fill: "#9ca3af", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={currencyFormatter}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip
              formatter={(value) => [
                currencyFormatter(Number(value)),
                "Monthly spend",
              ]}
              contentStyle={{
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#fff",
              }}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="spend" radius={[12, 12, 0, 0]} maxBarSize={80}>
       
            <Cell fill="#ef4444" />  {/* Current always red */}
             <Cell fill={noSavings ? "#6b7280" : "#22c55e"} />  {/* Optimized gray if no savings */}
              <LabelList
                dataKey="label"
                position="top"
                style={{ fill: "white", fontSize: 13, fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {!noSavings && (
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-400">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-red-500" /> Current spend
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-green-500" /> After optimization
          </span>
        </div>
      )}
    </div>
  );
}