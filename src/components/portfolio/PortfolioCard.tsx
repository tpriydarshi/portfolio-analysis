"use client";

import Link from "next/link";
import type { Portfolio } from "@/types/database";
import { BarChart3, Clock, Plus } from "lucide-react";

export function PortfolioCard({ portfolio }: { portfolio: Portfolio }) {
  return (
    <Link href={`/portfolio/${portfolio.id}`}>
      <div className="group bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 hover:border-[rgba(255,255,255,0.15)] hover:shadow-lg hover:shadow-[#5e6ad2]/5 transition-all duration-200">
        <div className="flex items-start justify-between mb-3">
          <div className="h-9 w-9 rounded-lg bg-[#5e6ad2]/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-[#5e6ad2]" />
          </div>
          {portfolio.total_value_inr && (
            <span className="text-xs font-mono text-[#8a8f98]">
              {formatINR(portfolio.total_value_inr)}
            </span>
          )}
        </div>
        <h3 className="text-[#f7f8f8] font-medium text-sm mb-1 group-hover:text-white transition-colors">
          {portfolio.name}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-[#8a8f98]">
          <Clock className="h-3 w-3" />
          <span>
            Updated {new Date(portfolio.updated_at).toLocaleDateString("en-IN")}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function NewPortfolioCard() {
  return (
    <Link href="/portfolio/new">
      <div className="group border border-dashed border-[rgba(255,255,255,0.08)] rounded-xl p-5 hover:border-[#5e6ad2]/40 transition-all duration-200 flex flex-col items-center justify-center min-h-[140px] gap-2">
        <div className="h-9 w-9 rounded-lg bg-[#5e6ad2]/10 flex items-center justify-center group-hover:bg-[#5e6ad2]/20 transition-colors">
          <Plus className="h-4 w-4 text-[#5e6ad2]" />
        </div>
        <span className="text-sm text-[#8a8f98] group-hover:text-[#b4bcd0] transition-colors">
          New Portfolio
        </span>
      </div>
    </Link>
  );
}

function formatINR(value: number): string {
  if (value >= 1e7) return `${(value / 1e7).toFixed(1)} Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(1)} L`;
  return `${value.toLocaleString("en-IN")}`;
}
