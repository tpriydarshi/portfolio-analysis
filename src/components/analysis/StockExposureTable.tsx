"use client";

import { useState } from "react";
import type { StockExposure } from "@/lib/aggregation/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ChevronDown, ChevronRight } from "lucide-react";

interface StockExposureTableProps {
  stocks: StockExposure[];
  showAmounts: boolean;
}

type SortKey = "name" | "exposurePct" | "amountInr" | "sector" | "fundCount";

export function StockExposureTable({
  stocks,
  showAmounts,
}: StockExposureTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("exposurePct");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const sorted = [...stocks].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    switch (sortKey) {
      case "name":
        return dir * a.name.localeCompare(b.name);
      case "exposurePct":
        return dir * (a.exposurePct - b.exposurePct);
      case "amountInr":
        return dir * ((a.amountInr || 0) - (b.amountInr || 0));
      case "sector":
        return dir * (a.sector || "").localeCompare(b.sector || "");
      case "fundCount":
        return dir * (a.contributingFunds.length - b.contributingFunds.length);
      default:
        return 0;
    }
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  return (
    <div className="bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-[rgba(255,255,255,0.08)] hover:bg-transparent">
            <TableHead className="text-[#8a8f98] w-8">#</TableHead>
            <TableHead
              className="text-[#8a8f98] cursor-pointer hover:text-[#b4bcd0]"
              onClick={() => toggleSort("name")}
            >
              <span className="flex items-center gap-1">
                Stock <ArrowUpDown className="h-3 w-3" />
              </span>
            </TableHead>
            <TableHead
              className="text-[#8a8f98] cursor-pointer hover:text-[#b4bcd0] text-right"
              onClick={() => toggleSort("exposurePct")}
            >
              <span className="flex items-center gap-1 justify-end">
                Exposure <ArrowUpDown className="h-3 w-3" />
              </span>
            </TableHead>
            {showAmounts && (
              <TableHead
                className="text-[#8a8f98] cursor-pointer hover:text-[#b4bcd0] text-right"
                onClick={() => toggleSort("amountInr")}
              >
                <span className="flex items-center gap-1 justify-end">
                  Amount <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
            )}
            <TableHead
              className="text-[#8a8f98] cursor-pointer hover:text-[#b4bcd0]"
              onClick={() => toggleSort("sector")}
            >
              <span className="flex items-center gap-1">
                Sector <ArrowUpDown className="h-3 w-3" />
              </span>
            </TableHead>
            <TableHead
              className="text-[#8a8f98] cursor-pointer hover:text-[#b4bcd0] text-right"
              onClick={() => toggleSort("fundCount")}
            >
              <span className="flex items-center gap-1 justify-end">
                Funds <ArrowUpDown className="h-3 w-3" />
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((stock, i) => (
            <>
              <TableRow
                key={stock.isin}
                className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] cursor-pointer"
                onClick={() =>
                  setExpandedRow(
                    expandedRow === stock.isin ? null : stock.isin
                  )
                }
              >
                <TableCell className="text-[#8a8f98] text-xs font-mono">
                  {i + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {expandedRow === stock.isin ? (
                      <ChevronDown className="h-3 w-3 text-[#8a8f98] shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-[#8a8f98] shrink-0" />
                    )}
                    <span className="text-sm text-[#f7f8f8]">
                      {stock.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-[#f7f8f8]">
                  {stock.exposurePct.toFixed(2)}%
                </TableCell>
                {showAmounts && (
                  <TableCell className="text-right font-mono text-sm text-[#b4bcd0]">
                    {stock.amountInr
                      ? formatINR(stock.amountInr)
                      : "-"}
                  </TableCell>
                )}
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="bg-[rgba(255,255,255,0.04)] text-[#8a8f98] text-xs font-normal"
                  >
                    {stock.sector || "Other"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="secondary"
                    className={`text-xs font-mono ${
                      stock.contributingFunds.length >= 2
                        ? "bg-[#5e6ad2]/10 text-[#5e6ad2]"
                        : "bg-[rgba(255,255,255,0.04)] text-[#8a8f98]"
                    }`}
                  >
                    {stock.contributingFunds.length}
                  </Badge>
                </TableCell>
              </TableRow>
              {expandedRow === stock.isin && (
                <TableRow
                  key={`${stock.isin}-detail`}
                  className="border-b border-[rgba(255,255,255,0.04)]"
                >
                  <TableCell colSpan={showAmounts ? 6 : 5} className="py-0">
                    <div className="py-3 px-6 space-y-1.5">
                      <p className="text-xs text-[#8a8f98] font-medium mb-2">
                        Contributing Funds:
                      </p>
                      {stock.contributingFunds.map((f) => (
                        <div
                          key={f.schemeCode}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-[#b4bcd0]">
                            {f.schemeName}
                          </span>
                          <span className="font-mono text-[#8a8f98]">
                            {f.fundAllocationPct.toFixed(1)}% alloc x{" "}
                            {f.stockInFundPct.toFixed(2)}% holding ={" "}
                            <span className="text-[#5e6ad2]">
                              {f.weightedContribution.toFixed(2)}%
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
