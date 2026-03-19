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
        <Loader2 className="h-8 w-8 text-[#5e6ad2] animate-spin mx-auto mb-4" />
        <p className="text-[#b4bcd0]">
          Analyzing your portfolio holdings...
        </p>
        <p className="text-xs text-[#8a8f98] mt-1">
          This may take a moment as we fetch fund data
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-[#e5484d] mb-2">Analysis failed</p>
        <p className="text-sm text-[#8a8f98]">{error}</p>
        <Link
          href={`/portfolio/${id}`}
          className="text-sm text-[#5e6ad2] hover:text-[#6e7ae2] mt-4 inline-block"
        >
          Back to portfolio
        </Link>
      </div>
    );
  }

  if (!result) return null;

  const showAmounts = result.stocks.some((s) => s.amountInr !== null);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <Link
          href={`/portfolio/${id}`}
          className="text-sm text-[#8a8f98] hover:text-[#b4bcd0] flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to portfolio
        </Link>
        <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">
          Portfolio Analysis
        </h1>
        <p className="text-sm text-[#8a8f98] mt-1">
          Your true stock exposure across all mutual funds
        </p>
      </div>

      {/* Summary stats */}
      <div className="mb-8">
        <AnalysisSummaryCard result={result} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <ExposurePieChart stocks={result.stocks} />
        <SectorBarChart sectors={result.sectors} />
      </div>

      {/* Overlaps */}
      <div className="mb-8">
        <OverlapHighlight overlaps={result.fundOverlaps} />
      </div>

      {/* Full stock table */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#f7f8f8] mb-4">
          All Stock Exposures
        </h2>
        <StockExposureTable stocks={result.stocks} showAmounts={showAmounts} />
      </div>
    </div>
  );
}
