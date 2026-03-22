import { createClient } from "@/lib/supabase/server";
import { PortfolioForm } from "@/components/portfolio/PortfolioForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, Pencil } from "lucide-react";
import { DeletePortfolioButton } from "@/components/portfolio/DeletePortfolioButton";
import type { PortfolioFund } from "@/types/database";

export const metadata = {
  title: "Portfolio | Portfolio X-Ray",
};

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!portfolio) return notFound();

  const { data: funds } = await supabase
    .from("portfolio_funds")
    .select("*")
    .eq("portfolio_id", id)
    .order("allocation_pct", { ascending: false });

  const portfolioFunds = (funds as PortfolioFund[]) || [];
  const totalAllocation = portfolioFunds.reduce(
    (acc, f) => acc + f.allocation_pct,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-[#767575] uppercase tracking-wider">
          <Link href="/dashboard" className="hover:text-[#acabaa] transition-colors">
            Portfolios
          </Link>
          <span>&gt;</span>
          <span className="text-[#acabaa]">{portfolio.name}</span>
        </div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 mb-10">
        <div>
          <h1 className="font-heading text-4xl font-semibold text-[#e7e5e5] tracking-tight mb-2">
            {portfolio.name}
          </h1>
          <p className="text-[#acabaa] text-sm leading-relaxed max-w-xl">
            An overview of your mutual fund allocation curated for long-term
            capital preservation and growth.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {portfolio.total_value_inr && (
            <div className="text-right">
              <p className="text-xs text-[#9f9da1] uppercase tracking-wider mb-1">
                Total Value
              </p>
              <p className="font-heading text-3xl font-semibold text-[#4ade80]">
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(portfolio.total_value_inr)}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Link href={`/portfolio/${id}/analysis`}>
              <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0e0e0e] text-sm gap-1.5 rounded-md font-medium">
                <BarChart3 className="h-4 w-4" />
                Analyze
              </Button>
            </Link>
            <DeletePortfolioButton portfolioId={id} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Left — Current Allocation */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold text-[#e7e5e5]">
              Current Allocation
            </h2>
            <span className="text-xs text-[#767575]">
              Last Rebalanced: {new Date(portfolio.updated_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Fund cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {portfolioFunds.slice(0, 4).map((fund) => (
              <div
                key={fund.id}
                className="bg-[#131313] rounded-md p-5 hover:bg-[#1f2020] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium">
                    {fund.allocation_pct.toFixed(0)}% Weight
                  </span>
                </div>
                <h3 className="font-heading text-lg font-medium text-[#e7e5e5] mb-1 leading-snug">
                  {fund.scheme_name.length > 40
                    ? fund.scheme_name.slice(0, 38) + "..."
                    : fund.scheme_name}
                </h3>
                <p className="text-xs text-[#767575] mb-3">
                  Code: {fund.scheme_code}
                </p>
                <div className="flex items-center justify-between">
                  {portfolio.total_value_inr && (
                    <p className="font-heading text-lg font-semibold text-[#e7e5e5]">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(
                        (portfolio.total_value_inr * fund.allocation_pct) / 100
                      )}
                    </p>
                  )}
                  <span className="text-xs font-mono text-[#bac3ff]">
                    {fund.allocation_pct.toFixed(1)}% allocation
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Remaining funds as compact list */}
          {portfolioFunds.length > 4 && (
            <div className="bg-[#131313] rounded-md overflow-hidden mb-6">
              {portfolioFunds.slice(4).map((fund) => (
                <div
                  key={fund.id}
                  className="px-5 py-3 flex items-center justify-between hover:bg-[#1f2020] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-7 w-7 rounded-md bg-[#2f3f92]/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-mono text-[#bac3ff]">
                        {fund.scheme_name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-[#e7e5e5] truncate">
                        {fund.scheme_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    {portfolio.total_value_inr && (
                      <span className="text-sm font-mono text-[#acabaa]">
                        {new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 0,
                        }).format(
                          (portfolio.total_value_inr * fund.allocation_pct) / 100
                        )}
                      </span>
                    )}
                    <span className="font-mono text-sm text-[#bac3ff] font-medium w-16 text-right">
                      {fund.allocation_pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Allocation validation */}
          <div className="bg-[#131313] rounded-md p-5">
            <p className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium mb-2">
              Allocation Summary
            </p>
            <div className="flex items-center gap-3">
              <span className="font-heading text-2xl font-semibold text-[#e7e5e5]">
                {totalAllocation.toFixed(1)}%
              </span>
              <span className="text-sm text-[#767575]">total allocated</span>
              {Math.abs(totalAllocation - 100) < 0.01 ? (
                <span className="text-xs bg-[#4ade80]/10 text-[#4ade80] px-2 py-0.5 rounded-sm">
                  Balanced
                </span>
              ) : (
                <span className="text-xs bg-[#ec7c8a]/10 text-[#ec7c8a] px-2 py-0.5 rounded-sm">
                  {totalAllocation < 100 ? "Under-allocated" : "Over-allocated"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar — Portfolio Structure */}
        <div>
          <div className="bg-[#131313] rounded-md p-5 sticky top-[88px]">
            <h3 className="font-heading text-lg font-semibold text-[#e7e5e5] mb-4">
              Portfolio Structure
            </h3>
            <p className="text-xs text-[#767575] mb-4">
              Reconfigure the DNA of this portfolio. Adjust weights and
              composition below.
            </p>

            {/* Edit section */}
            <div className="flex items-center gap-2 mb-4">
              <Pencil className="h-3.5 w-3.5 text-[#9f9da1]" />
              <h4 className="text-sm font-medium text-[#acabaa]">
                Edit Portfolio
              </h4>
            </div>
            <PortfolioForm
              portfolioId={id}
              initialName={portfolio.name}
              initialTotalValue={portfolio.total_value_inr}
              initialFunds={portfolioFunds.map((f) => ({
                schemeCode: f.scheme_code,
                schemeName: f.scheme_name,
                allocationPct: f.allocation_pct,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
