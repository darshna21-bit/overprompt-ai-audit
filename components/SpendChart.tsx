"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";

type Props = {
  monthlySpend: number;
  monthlySavings: number;
};

export default function SpendChart({
  monthlySpend,
  monthlySavings,
}: Props) {

  const data = [
    {
      name: "Current",
      spend: monthlySpend,
    },
    {
      name: "Optimized",
      spend:
        monthlySpend - monthlySavings,
    },
  ];

  return (
    <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">

      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-white">
          Spend Optimization Overview
        </h3>

        <p className="mt-2 text-sm text-gray-400">
          Estimated monthly AI spend before and after optimization.
        </p>
      </div>

      <div className="h-72">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart data={data}>
            <XAxis dataKey="name" />

            <Tooltip />

            <Bar
              dataKey="spend"
              radius={[12, 12, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}