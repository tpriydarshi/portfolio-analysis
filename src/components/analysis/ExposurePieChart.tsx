"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { StockExposure } from "@/lib/aggregation/types";

const COLORS = [
  "#4ade80",
  "#facc15",
  "#bac3ff",
  "#ec7c8a",
  "#a8b4ff",
  "#22d3ee",
  "#f59e0b",
  "#10b981",
  "#e4ebff",
  "#9f9da1",
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#a855f7",
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
    <div className="bg-[#131313] rounded-md p-5">
      <h3 className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium mb-4">
        Sectors
      </h3>
      <div className="flex items-center gap-6">
        <div className="h-[240px] w-[240px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={100}
                paddingAngle={2}
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
                    <div className="bg-[#252626] rounded-md px-3 py-2 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                      <p className="text-xs text-[#e7e5e5]">{d.name}</p>
                      <p className="text-xs font-mono text-[#4ade80]">
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
        <div className="space-y-2 flex-1">
          {data.slice(0, 8).map((d, i) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-[#acabaa] truncate">
                  {d.name}
                </span>
              </div>
              <span className="text-xs font-mono text-[#9f9da1] ml-2 shrink-0">
                {d.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
