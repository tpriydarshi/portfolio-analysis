"use client";

import type { FundOverlap } from "@/lib/aggregation/types";
import { Badge } from "@/components/ui/badge";

interface OverlapHighlightProps {
  overlaps: FundOverlap[];
}

export function OverlapHighlight({ overlaps }: OverlapHighlightProps) {
  if (overlaps.length === 0) {
    return (
      <div className="bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
        <h3 className="text-sm font-medium text-[#b4bcd0] mb-4">
          Fund Overlaps
        </h3>
        <p className="text-sm text-[#8a8f98]">
          No stocks are shared across multiple funds.
        </p>
      </div>
    );
  }

  const top10 = overlaps.slice(0, 10);

  return (
    <div className="bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
      <h3 className="text-sm font-medium text-[#b4bcd0] mb-1">
        Fund Overlaps
      </h3>
      <p className="text-xs text-[#8a8f98] mb-4">
        Stocks held by multiple funds in your portfolio
      </p>

      <div className="space-y-3">
        {top10.map((overlap) => (
          <div
            key={overlap.isin}
            className="bg-[#0a0a0b] border border-[rgba(255,255,255,0.06)] rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#f7f8f8] font-medium">
                {overlap.stockName}
              </span>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-[#5e6ad2]/10 text-[#5e6ad2] text-xs font-mono"
                >
                  {overlap.totalExposure.toFixed(2)}%
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-[rgba(255,255,255,0.04)] text-[#8a8f98] text-xs"
                >
                  {overlap.fundCount} funds
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              {overlap.funds.map((fund, idx) => (
                <div
                  key={`${fund.schemeName}-${idx}`}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-[#8a8f98] truncate max-w-[70%]">
                    {fund.schemeName}
                  </span>
                  <span className="font-mono text-[#b4bcd0]">
                    {fund.holdingPct.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {overlaps.length > 10 && (
        <p className="text-xs text-[#8a8f98] mt-3 text-center">
          +{overlaps.length - 10} more overlapping stocks
        </p>
      )}
    </div>
  );
}
