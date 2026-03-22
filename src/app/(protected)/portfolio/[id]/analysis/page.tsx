"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AnalysisSummaryCard } from "@/components/analysis/AnalysisSummaryCard";
import { StockExposureTable } from "@/components/analysis/StockExposureTable";
import { ExposurePieChart } from "@/components/analysis/ExposurePieChart";
import { SectorBarChart } from "@/components/analysis/SectorBarChart";
import { OverlapHighlight } from "@/components/analysis/OverlapHighlight";
import type { AggregatedResult } from "@/lib/aggregation/types";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<AggregatedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function analyze() {
      try {
        const res = await fetch(`/api/portfolios/${id}/analyze`, {
          method: "POST",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Analysis failed");
        }
        const data = await res.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    analyze();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <Loader2 className="h-8 w-8 text-[#bac3ff] animate-spin mx-auto mb-4" />
        <p className="text-[#acabaa]">
          Analyzing your portfolio holdings...
        </p>
        <p className="text-xs text-[#767575] mt-1">
          This may take a moment as we fetch fund data
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-[#ec7c8a] mb-2">Analysis failed</p>
        <p className="text-sm text-[#9f9da1]">{error}</p>
        <Link
          href={`/portfolio/${id}`}
          className="text-sm text-[#bac3ff] hover:text-[#c7cdff] mt-4 inline-block"
        >
          Back to portfolio
        </Link>
      </div>
    );
  }

  if (!result) return null;

  const showAmounts = result.stocks.some((s) => s.amountInr !== null);

  // Find top sector for concentration alert
  const topSector = result.sectors[0];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/portfolio/${id}`}
          className="text-xs text-[#767575] hover:text-[#acabaa] flex items-center gap-1 mb-3 uppercase tracking-wider"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to portfolio
        </Link>
        <h1 className="font-heading text-4xl font-semibold text-[#e7e5e5] tracking-tight">
          Portfolio Analysis
        </h1>
        <p className="text-sm text-[#acabaa] mt-2 max-w-xl">
          An editorial deep-dive into your asset distribution, fund overlaps,
          and risk concentration. Precision data for the modern archivist.
        </p>
      </div>

      {/* Summary stats */}
      <div className="mb-8">
        <AnalysisSummaryCard result={result} />
      </div>

      {/* Charts + Overlap grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Fund Overlaps */}
        <OverlapHighlight overlaps={result.fundOverlaps} />
        {/* Sectors */}
        <ExposurePieChart stocks={result.stocks} />
      </div>

      {/* Sector bar chart */}
      <div className="mb-8">
        <SectorBarChart sectors={result.sectors} />
      </div>

      {/* Concentration Alert */}
      {topSector && topSector.exposurePct > 25 && (
        <div className="bg-[#131313] rounded-md p-6 mb-8">
          <h3 className="font-heading text-xl font-semibold text-[#e7e5e5] mb-3">
            Concentration Alert
          </h3>
          <p className="text-sm text-[#acabaa] leading-relaxed mb-4">
            Your exposure to the{" "}
            <span className="text-[#facc15] font-medium">
              {topSector.sector}
            </span>{" "}
            sector is {topSector.exposurePct.toFixed(1)}%. While historically
            profitable, consider diversifying into defensive consumer staples to
            mitigate sectoral volatility.
          </p>
          <Link href={`/portfolio/${id}`}>
            <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0e0e0e] text-sm font-medium rounded-md">
              Rebalance Strategy
            </Button>
          </Link>
        </div>
      )}

      {/* Full stock table */}
      <div className="mb-8">
        <h2 className="font-heading text-xl font-semibold text-[#e7e5e5] mb-4">
          All Stock Exposures
        </h2>
        <StockExposureTable stocks={result.stocks} showAmounts={showAmounts} />
      </div>
    </div>
  );
}
