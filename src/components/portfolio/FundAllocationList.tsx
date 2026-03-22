"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { FundEntry } from "@/lib/validation/portfolio";

interface FundAllocationListProps {
  funds: FundEntry[];
  onChange: (funds: FundEntry[]) => void;
}

export function FundAllocationList({
  funds,
  onChange,
}: FundAllocationListProps) {
  const totalPct = funds.reduce((acc, f) => acc + f.allocationPct, 0);
  const isValid = Math.abs(totalPct - 100) < 0.01;

  function updateAllocation(index: number, value: string) {
    const pct = parseFloat(value) || 0;
    const updated = [...funds];
    updated[index] = { ...updated[index], allocationPct: pct };
    onChange(updated);
  }

  function removeFund(index: number) {
    onChange(funds.filter((_, i) => i !== index));
  }

  if (funds.length === 0) {
    return (
      <div className="bg-[#000000] rounded-md p-6 text-center">
        <p className="text-sm text-[#767575]">
          Search and add mutual funds above
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {funds.map((fund, index) => (
        <div
          key={fund.schemeCode}
          className="bg-[#000000] rounded-md p-3 flex items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#e7e5e5] truncate">{fund.schemeName}</p>
            <p className="text-xs text-[#767575]">Code: {fund.schemeCode}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              value={fund.allocationPct || ""}
              onChange={(e) => updateAllocation(index, e.target.value)}
              className="w-20 text-right bg-transparent border-none text-[#e7e5e5] font-mono text-sm focus:ring-1 focus:ring-[#bac3ff]/40"
            />
            <span className="text-xs text-[#767575]">%</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeFund(index)}
              className="h-7 w-7 p-0 text-[#767575] hover:text-[#ec7c8a]"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}

      {/* Total bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#000000] rounded-md">
        <span className="text-sm text-[#acabaa]">Total Allocation</span>
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-sm font-medium ${
              isValid ? "text-[#4ade80]" : "text-[#facc15]"
            }`}
          >
            {totalPct.toFixed(2)}%
          </span>
          {!isValid && (
            <span className="text-xs text-[#facc15]">Must equal 100%</span>
          )}
        </div>
      </div>
    </div>
  );
}
