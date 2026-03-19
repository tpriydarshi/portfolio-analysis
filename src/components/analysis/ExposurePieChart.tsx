"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { StockExposure } from "@/lib/aggregation/types";

const COLORS = [
  "#5e6ad2",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#a855f7",
  "#3b82f6",
  "#22d3ee",
  "#facc15",
  "#78716c",
];

interface ExposurePieChartProps {
  stocks: StockExposure[];
}

export function ExposurePieChart({ stocks }: ExposurePieChartProps) {
  const top15 = stocks.slice(0, 15);
  const othersTotal = stocks
    .slice(15)
    .reduce((acc, s) => acc + s.exposurePct, 0);

  const data = [
    ...top15.map((s) => ({ name: s.name, value: +s.exposurePct.toFixed(2) })),
    ...(othersTotal > 0
      ? [{ name: "Others", value: +othersTotal.toFixed(2) }]
      : []),
  ];

  return (
    <div className="bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
      <h3 className="text-sm font-medium text-[#b4bcd0] mb-4">
        Stock Exposure Distribution
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={1}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0];
                return (
                  <div className="bg-[#1a1b1e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 shadow-xl">
                    <p className="text-xs text-[#f7f8f8]">{d.name}</p>
                    <p className="text-xs font-mono text-[#5e6ad2]">
                      {d.value}%
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
        {data.slice(0, 10).map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-xs text-[#8a8f98] truncate max-w-[120px]">
              {d.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
