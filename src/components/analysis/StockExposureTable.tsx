"use client";

import { Fragment, useState } from "react";
import type { StockExposure } from "@/lib/aggregation/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="bg-[#131313] rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8">#</TableHead>
            <TableHead
              className="cursor-pointer hover:text-[#acabaa]"
              onClick={() => toggleSort("name")}
            >
              <span className="flex items-center gap-1">
                Stock <ArrowUpDown className="h-3 w-3" />
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-[#acabaa] text-right"
              onClick={() => toggleSort("exposurePct")}
            >
              <span className="flex items-center gap-1 justify-end">
                Exposure <ArrowUpDown className="h-3 w-3" />
              </span>
            </TableHead>
            {showAmounts && (
              <TableHead
                className="cursor-pointer hover:text-[#acabaa] text-right"
                onClick={() => toggleSort("amountInr")}
              >
                <span className="flex items-center gap-1 justify-end">
                  Amount <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
            )}
            <TableHead
              className="cursor-pointer hover:text-[#acabaa]"
              onClick={() => toggleSort("sector")}
            >
              <span className="flex items-center gap-1">
                Sector <ArrowUpDown className="h-3 w-3" />
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-[#acabaa] text-right"
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
            <Fragment key={stock.isin}>
              <TableRow
                className="cursor-pointer"
                onClick={() =>
                  setExpandedRow(
                    expandedRow === stock.isin ? null : stock.isin
                  )
                }
              >
                <TableCell className="text-[#767575] text-xs font-mono">
                  {i + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {expandedRow === stock.isin ? (
                      <ChevronDown className="h-3 w-3 text-[#767575] shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-[#767575] shrink-0" />
                    )}
                    <span className="text-sm text-[#e7e5e5]">
                      {stock.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-[#e7e5e5]">
                  {stock.exposurePct.toFixed(2)}%
                </TableCell>
                {showAmounts && (
                  <TableCell className="text-right font-mono text-sm text-[#acabaa]">
                    {stock.amountInr
                      ? formatINR(stock.amountInr)
                      : "-"}
                  </TableCell>
                )}
                <TableCell>
                  <span className="text-xs text-[#9f9da1]">
                    {stock.sector || "Other"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-sm ${
                      stock.contributingFunds.length >= 2
                        ? "bg-[#2f3f92]/20 text-[#bac3ff]"
                        : "text-[#767575]"
                    }`}
                  >
                    {stock.contributingFunds.length}
                  </span>
                </TableCell>
              </TableRow>
              {expandedRow === stock.isin && (
                <TableRow
                  key={`${stock.isin}-detail`}
                  className="hover:bg-transparent"
                >
                  <TableCell colSpan={showAmounts ? 6 : 5} className="py-0">
                    <div className="py-3 px-6 space-y-1.5 bg-[#0e0e0e] rounded-sm mx-2 mb-2">
                      <p className="text-xs text-[#9f9da1] font-medium uppercase tracking-wider mb-2">
                        Contributing Funds:
                      </p>
                      {stock.contributingFunds.map((f) => (
                        <div
                          key={f.schemeCode}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-[#acabaa]">
                            {f.schemeName}
                          </span>
                          <span className="font-mono text-[#767575]">
                            {f.fundAllocationPct.toFixed(1)}% alloc x{" "}
                            {f.stockInFundPct.toFixed(2)}% holding ={" "}
                            <span className="text-[#4ade80]">
                              {f.weightedContribution.toFixed(2)}%
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
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
