import { createClient } from "@/lib/supabase/server";
import {
  PortfolioCard,
  NewPortfolioCard,
} from "@/components/portfolio/PortfolioCard";
import type { Portfolio } from "@/types/database";

export const metadata = {
  title: "Dashboard | Portfolio X-Ray",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let portfolios: Portfolio[] = [];

  if (user) {
    const { data } = await supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    portfolios = (data as Portfolio[]) || [];
  }

  const totalValue = portfolios.reduce(
    (acc, p) => acc + (p.total_value_inr || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-4">
        <div>
          <p className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium mb-2">
            Account Overview
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-semibold text-[#e7e5e5] tracking-tight leading-tight">
            Your Investment
            <br />
            <span className="text-[#4ade80]">Portfolio.</span>
          </h1>
        </div>
        {totalValue > 0 && (
          <div className="text-right">
            <p className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium mb-1">
              Total Value
            </p>
            <p className="font-heading text-3xl md:text-4xl font-semibold text-[#4ade80]">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(totalValue)}
            </p>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="bg-[#131313] rounded-md p-5">
          <p className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium mb-3">
            Portfolio Count
          </p>
          <p className="font-heading text-3xl font-semibold text-[#e7e5e5]">
            {portfolios.length}
          </p>
          <p className="text-xs text-[#767575] mt-1">
            {portfolios.length === 0
              ? "Create your first portfolio to begin"
              : `${portfolios.length} active portfolio${portfolios.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="bg-[#131313] rounded-md p-5">
          <p className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium mb-3">
            Asset Allocation
          </p>
          {portfolios.length > 0 ? (
            <div className="space-y-2">
              {portfolios.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-sm text-[#acabaa] truncate max-w-[60%]">
                    {p.name}
                  </span>
                  <span className="text-xs font-mono text-[#9f9da1]">
                    {totalValue > 0 && p.total_value_inr
                      ? `${((p.total_value_inr / totalValue) * 100).toFixed(0)}%`
                      : "—"}
                  </span>
                </div>
              ))}
              {portfolios.length > 3 && (
                <p className="text-xs text-[#767575]">
                  +{portfolios.length - 3} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#767575]">No portfolios yet</p>
          )}
        </div>
      </div>

      {/* Core Holdings */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold text-[#e7e5e5]">
          Core Holdings
        </h2>
        <span className="text-xs text-[#9f9da1] uppercase tracking-wider">
          View All Positions
        </span>
      </div>

      {/* Portfolio table/list */}
      {portfolios.length > 0 ? (
        <div className="bg-[#131313] rounded-md overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3">
            <span className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium">
              Portfolio
            </span>
            <span className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium text-right">
              Value
            </span>
            <span className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium text-center">
              Status
            </span>
            <span className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium text-right">
              Updated
            </span>
          </div>
          {/* Portfolio rows */}
          {portfolios.map((portfolio) => (
            <PortfolioCard key={portfolio.id} portfolio={portfolio} />
          ))}
        </div>
      ) : (
        <div className="mt-4 text-center py-12">
          <p className="text-[#9f9da1] text-sm mb-4">
            No portfolios yet. Create your first one to get started.
          </p>
        </div>
      )}

      <div className="mt-4">
        <NewPortfolioCard />
      </div>
    </div>
  );
}
