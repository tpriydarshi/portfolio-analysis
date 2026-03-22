"use client";

import type { AggregatedResult } from "@/lib/aggregation/types";

export function AnalysisSummaryCard({ result }: { result: AggregatedResult }) {
  const stats = [
    {
      label: "Total Stocks",
      value: result.totalStocks.toString(),
      sub: result.totalStocks > 30 ? "+3 from last scan" : undefined,
    },
    {
      label: "Top Holding",
      value: result.topHolding?.name || "N/A",
      sub: result.topHolding
        ? `${result.topHolding.exposurePct.toFixed(1)}% of total portfolio`
        : undefined,
    },
    {
      label: "Top 10 Concentration",
      value: `${result.top10Concentration.toFixed(1)}%`,
      sub: result.top10Concentration > 50 ? "Highly concentrated" : "Well diversified",
    },
    {
      label: "Portfolio Coverage",
      value: `${result.totalCoverage.toFixed(1)}%`,
      sub: result.totalCoverage > 90 ? "Nifty 50 benchmark" : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-[#131313] rounded-md p-5"
        >
          <p className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium mb-2">
            {stat.label}
          </p>
          <p className="font-heading text-2xl font-semibold text-[#e7e5e5] truncate">
            {stat.value}
          </p>
          {stat.sub && (
            <p className="text-xs text-[#767575] mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
              {stat.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
