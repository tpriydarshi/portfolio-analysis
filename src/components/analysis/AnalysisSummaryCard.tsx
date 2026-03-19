"use client";

import type { AggregatedResult } from "@/lib/aggregation/types";

export function AnalysisSummaryCard({ result }: { result: AggregatedResult }) {
  const stats = [
    {
      label: "Total Stocks",
      value: result.totalStocks.toString(),
    },
    {
      label: "Top Holding",
      value: result.topHolding?.name || "N/A",
      sub: result.topHolding
        ? `${result.topHolding.exposurePct.toFixed(2)}%`
        : undefined,
    },
    {
      label: "Top 10 Concentration",
      value: `${result.top10Concentration.toFixed(1)}%`,
    },
    {
      label: "Portfolio Coverage",
      value: `${result.totalCoverage.toFixed(1)}%`,
    },
    {
      label: "Multi-Fund Stocks",
      value: result.fundOverlaps.length.toString(),
    },
    {
      label: "Sectors",
      value: result.sectors.length.toString(),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl p-4"
        >
          <p className="text-xs text-[#8a8f98] mb-1">{stat.label}</p>
          <p className="text-lg font-semibold text-[#f7f8f8] font-mono truncate">
            {stat.value}
          </p>
          {stat.sub && (
            <p className="text-xs text-[#5e6ad2] font-mono mt-0.5">
              {stat.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
