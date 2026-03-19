import { createClient } from "@/lib/supabase/server";
import { PortfolioForm } from "@/components/portfolio/PortfolioForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, Pencil, Trash2 } from "lucide-react";
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">
            {portfolio.name}
          </h1>
          {portfolio.total_value_inr && (
            <p className="text-sm text-[#8a8f98] mt-1 font-mono">
              Corpus:{" "}
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(portfolio.total_value_inr)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/portfolio/${id}/analysis`}>
            <Button className="bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white text-sm gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Analyze
            </Button>
          </Link>
          <DeletePortfolioButton portfolioId={id} />
        </div>
      </div>

      {/* Funds list */}
      <div className="bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.08)]">
          <h2 className="text-sm font-medium text-[#b4bcd0]">
            Fund Allocation ({portfolioFunds.length} funds)
          </h2>
        </div>
        <div className="divide-y divide-[rgba(255,255,255,0.04)]">
          {portfolioFunds.map((fund) => (
            <div
              key={fund.id}
              className="px-5 py-3 flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#f7f8f8] truncate">
                  {fund.scheme_name}
                </p>
                <p className="text-xs text-[#8a8f98]">
                  Code: {fund.scheme_code}
                </p>
              </div>
              <div className="shrink-0 ml-4">
                <span className="font-mono text-sm text-[#5e6ad2] font-medium">
                  {fund.allocation_pct.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit section */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Pencil className="h-4 w-4 text-[#8a8f98]" />
          <h2 className="text-lg font-semibold text-[#f7f8f8]">
            Edit Portfolio
          </h2>
        </div>
        <div className="bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl p-6">
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
  );
}
