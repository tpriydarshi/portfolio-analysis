"use client";

import type { FundOverlap } from "@/lib/aggregation/types";
import { ExternalLink } from "lucide-react";

interface OverlapHighlightProps {
  overlaps: FundOverlap[];
}

export function OverlapHighlight({ overlaps }: OverlapHighlightProps) {
  if (overlaps.length === 0) {
    return (
      <div className="bg-[#131313] rounded-md p-5">
        <h3 className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium mb-4">
          Fund Overlap
        </h3>
        <p className="text-sm text-[#767575]">
          No stocks are shared across multiple funds.
        </p>
      </div>
    );
  }

  const top10 = overlaps.slice(0, 10);

  return (
    <div className="bg-[#131313] rounded-md p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium">
          Fund Overlap
        </h3>
        <span className="text-xs text-[#767575] uppercase tracking-wider">
          Common Holdings Across Schemes
        </span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_auto] gap-4 mb-2 px-1">
        <span className="text-xs text-[#767575] uppercase tracking-wider">
          Scheme Name
        </span>
        <span className="text-xs text-[#767575] uppercase tracking-wider text-right">
          Overlap %
        </span>
        <span className="text-xs text-[#767575] uppercase tracking-wider w-8">

        </span>
      </div>

      <div className="space-y-0">
        {top10.map((overlap) => (
          <div
            key={overlap.isin}
            className="group grid grid-cols-[2fr_1fr_auto] gap-4 px-1 py-3 hover:bg-[#1f2020] rounded-sm transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm text-[#e7e5e5] font-medium truncate">
                {overlap.stockName}
              </p>
              <p className="text-xs text-[#767575] mt-0.5">
                {overlap.fundCount} funds
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm text-[#4ade80] font-medium">
                {overlap.totalExposure.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center">
              <ExternalLink className="h-3.5 w-3.5 text-[#767575] group-hover:text-[#acabaa] transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {overlaps.length > 10 && (
        <p className="text-xs text-[#767575] mt-3 text-center">
          +{overlaps.length - 10} more overlapping stocks
        </p>
      )}
    </div>
  );
}
