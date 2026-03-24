"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Divide } from "lucide-react";
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
  const remaining = 100 - totalPct;
  const isValid = Math.abs(remaining) < 0.01;
  const isOver = remaining < -0.01;

  function updateAllocation(index: number, value: string) {
    const pct = parseFloat(value) || 0;
    const updated = [...funds];
    updated[index] = { ...updated[index], allocationPct: pct };
    onChange(updated);
  }

  function removeFund(index: number) {
    onChange(funds.filter((_, i) => i !== index));
  }

  function equalSplit() {
    if (funds.length === 0) return;
    const base = Math.floor((10000 / funds.length)) / 100; // 2 decimal places
    const total = parseFloat((base * funds.length).toFixed(2));
    const diff = parseFloat((100 - total).toFixed(2));
    const updated = funds.map((f, i) => ({
      ...f,
      allocationPct: i === 0 ? parseFloat((base + diff).toFixed(2)) : base,
    }));
    onChange(updated);
  }

  // Progress bar color logic
  const progressPct = Math.min(totalPct, 100);
  const barColor = isValid
    ? "#4ade80"
    : isOver
      ? "#ec7c8a"
      : "#facc15";

  // Remaining text color
  const remainingColor = isValid
    ? "#facc15"
    : isOver
      ? "#ec7c8a"
      : "#4ade80";

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
      {/* Header row: remaining helper + equal split button */}
      <div className="flex items-center justify-between px-1">
        <span
          className="text-xs font-mono font-medium"
          style={{ color: remainingColor }}
        >
          {isValid
            ? "Fully allocated"
            : isOver
              ? `${Math.abs(remaining).toFixed(2)}% over-allocated`
              : `${remaining.toFixed(2)}% remaining`}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={equalSplit}
          className="h-7 px-2.5 text-xs text-[#bac3ff] hover:text-[#e7e5e5] hover:bg-[#bac3ff]/10 gap-1.5"
        >
          <Divide className="h-3 w-3" />
          Equal Split
        </Button>
      </div>

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

      {/* Progress bar + total */}
      <div className="bg-[#000000] rounded-md px-3 py-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#9f9da1]">Total Allocation</span>
          <span
            className="font-mono text-sm font-medium"
            style={{ color: barColor }}
          >
            {totalPct.toFixed(2)}%
          </span>
        </div>
        {/* Visual progress bar */}
        <div className="relative h-1.5 w-full rounded-full bg-[#131313] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${Math.min(progressPct, 100)}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
        {!isValid && (
          <p className="text-xs" style={{ color: barColor }}>
            {isOver ? "Over-allocated — reduce some funds" : "Must equal 100%"}
          </p>
        )}
      </div>
    </div>
  );
}
