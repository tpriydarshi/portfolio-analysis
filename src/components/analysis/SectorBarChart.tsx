"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SectorBreakdown } from "@/lib/aggregation/types";

interface SectorBarChartProps {
  sectors: SectorBreakdown[];
}

export function SectorBarChart({ sectors }: SectorBarChartProps) {
  const data = sectors.slice(0, 15).map((s) => ({
    name: s.sector.length > 15 ? s.sector.slice(0, 13) + "..." : s.sector,
    fullName: s.sector,
    exposure: +s.exposurePct.toFixed(2),
    stocks: s.stockCount,
  }));

  return (
    <div className="bg-[#131313] rounded-md p-5">
      <h3 className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium mb-4">
        Sector Allocation
      </h3>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 60 }}>
            <XAxis
              type="number"
              tick={{ fill: "#767575", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "#9f9da1", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-[#252626] rounded-md px-3 py-2 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                    <p className="text-xs text-[#e7e5e5]">{d.fullName}</p>
                    <p className="text-xs font-mono text-[#4ade80]">
                      {d.exposure}% ({d.stocks} stocks)
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="exposure"
              fill="#4ade80"
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
