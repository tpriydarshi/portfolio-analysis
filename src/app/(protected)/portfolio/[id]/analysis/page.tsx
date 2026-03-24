"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { AnalysisSummaryCard } from "@/components/analysis/AnalysisSummaryCard";
import { StockExposureTable } from "@/components/analysis/StockExposureTable";
import { ExposurePieChart } from "@/components/analysis/ExposurePieChart";
import { SectorBarChart } from "@/components/analysis/SectorBarChart";
import { OverlapHighlight } from "@/components/analysis/OverlapHighlight";
import type { AggregatedResult } from "@/lib/aggregation/types";
import { ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { AnalysisSkeleton } from "@/components/analysis/AnalysisSkeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function formatDataAsOf(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<AggregatedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const url = forceRefresh
          ? `/api/portfolios/${id}/analyze?forceRefresh=true`
          : `/api/portfolios/${id}/analyze`;
        const res = await fetch(url);
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
    },
    [id]
  );

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  if (loading) {
    return <AnalysisSkeleton />;
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl font-semibold text-[#e7e5e5] tracking-tight">
              Portfolio Analysis
            </h1>
            <p className="text-sm text-[#acabaa] mt-2 max-w-xl">
              An editorial deep-dive into your asset distribution, fund overlaps,
              and risk concentration. Precision data for the modern archivist.
            </p>
            {result.dataAsOf && (
              <p className="text-xs text-[#767575] mt-1">
                Data as of: {formatDataAsOf(result.dataAsOf)}
              </p>
            )}
          </div>
          <Button
            onClick={() => runAnalysis(true)}
            variant="outline"
            size="sm"
            className="shrink-0 border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] text-[#acabaa] hover:text-[#e7e5e5] bg-transparent"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Re-analyze
          </Button>
        </div>
      </div>

      {/* Warnings banner */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="bg-[#1a1a0e] border border-[rgba(250,204,21,0.2)] rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-[#facc15] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#facc15] mb-1">
                Some funds could not be fully analyzed
              </p>
              <ul className="space-y-0.5">
                {result.warnings.map((warning, i) => (
                  <li key={i} className="text-xs text-[#acabaa]">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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
