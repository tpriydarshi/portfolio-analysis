"use client";

import Link from "next/link";
import type { Portfolio } from "@/types/database";
import { BarChart3, Plus } from "lucide-react";

export function PortfolioCard({ portfolio }: { portfolio: Portfolio }) {
  return (
    <Link href={`/portfolio/${portfolio.id}`}>
      <div className="px-5 py-4 hover:bg-[#1f2020] transition-colors cursor-pointer md:grid md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-4 md:items-center">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-md bg-[#2f3f92]/20 flex items-center justify-center shrink-0">
            <BarChart3 className="h-4 w-4 text-[#bac3ff]" />
          </div>
          <span className="text-sm text-[#e7e5e5] font-medium truncate">
            {portfolio.name}
          </span>
          <span className="md:hidden inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-[#4ade80]/10 text-[#4ade80] ml-auto shrink-0">
            Active
          </span>
        </div>
        <div className="flex items-center justify-between mt-2 md:mt-0 md:block md:text-right pl-11 md:pl-0">
          <span className="text-sm font-mono text-[#e7e5e5]">
            {portfolio.total_value_inr
              ? formatINR(portfolio.total_value_inr)
              : "—"}
          </span>
          <span className="text-xs text-[#9f9da1] md:hidden">
            {new Date(portfolio.updated_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="hidden md:block text-center">
          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-[#4ade80]/10 text-[#4ade80]">
            Active
          </span>
        </div>
        <div className="hidden md:block text-right">
          <span className="text-xs text-[#9f9da1]">
            {new Date(portfolio.updated_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function NewPortfolioCard() {
  return (
    <Link href="/portfolio/new">
      <div className="group bg-[#131313] rounded-md p-5 hover:bg-[#1f2020] transition-all duration-200 flex items-center gap-3 cursor-pointer">
        <div className="h-9 w-9 rounded-md bg-[#4ade80]/10 flex items-center justify-center group-hover:bg-[#4ade80]/20 transition-colors">
          <Plus className="h-4 w-4 text-[#4ade80]" />
        </div>
        <span className="text-sm text-[#9f9da1] group-hover:text-[#acabaa] transition-colors font-medium">
          New Portfolio
        </span>
      </div>
    </Link>
  );
}

function formatINR(value: number): string {
  if (value >= 1e7) return `\u20B9${(value / 1e7).toFixed(1)} Cr`;
  if (value >= 1e5) return `\u20B9${(value / 1e5).toFixed(1)} L`;
  return `\u20B9${value.toLocaleString("en-IN")}`;
}
