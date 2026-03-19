"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SectorBreakdown } from "@/lib/aggregation/types";

interface SectorBarChartProps {
  sectors: SectorBreakdown[];
}

export function SectorBarChart({ sectors }: SectorBarChartProps) {
  const data = sectors.slice(0, 15).map((s) => ({
    name: s.sector.length > 20 ? s.sector.slice(0, 18) + "..." : s.sector,
    fullName: s.sector,
    exposure: +s.exposurePct.toFixed(2),
    stocks: s.stockCount,
  }));

  return (
    <div className="bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
      <h3 className="text-sm font-medium text-[#b4bcd0] mb-4">
        Sector Allocation
      </h3>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: "#8a8f98", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "#8a8f98", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-[#1a1b1e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 shadow-xl">
                    <p className="text-xs text-[#f7f8f8]">{d.fullName}</p>
                    <p className="text-xs font-mono text-[#5e6ad2]">
                      {d.exposure}% ({d.stocks} stocks)
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="exposure"
              fill="#5e6ad2"
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
