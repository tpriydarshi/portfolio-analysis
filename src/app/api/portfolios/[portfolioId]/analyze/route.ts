import { computeAggregation } from "@/lib/aggregation/compute";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Load portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select("*")
      .eq("id", portfolioId)
      .eq("user_id", user.id)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Load funds
    const { data: funds, error: fundsError } = await supabase
      .from("portfolio_funds")
      .select("*")
      .eq("portfolio_id", portfolioId);

    if (fundsError || !funds || funds.length === 0) {
      return NextResponse.json(
        { error: "No funds in portfolio" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const CACHE_DAYS = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CACHE_DAYS);

    // Fetch holdings for all funds
    const fundsWithHoldings = await Promise.all(
      funds.map(async (fund) => {
        // Try cache first
        const { data: cached } = await admin
          .from("holdings_cache")
          .select("*")
          .eq("scheme_code", fund.scheme_code)
          .gte("fetched_at", cutoffDate.toISOString());

        if (cached && cached.length > 0) {
          return { fund, holdings: cached };
        }

        // Fetch from AMFI on-demand
        const { fetchHoldingsWithFallback } = await import(
          "@/lib/api/holdings-provider"
        );
        const rawHoldings = await fetchHoldingsWithFallback(fund.scheme_code);

        if (rawHoldings.length > 0) {
          const now = new Date().toISOString();

          // Delete old cache before inserting to prevent duplicates
          await admin
            .from("holdings_cache")
            .delete()
            .eq("scheme_code", fund.scheme_code);

          const rows = rawHoldings.map((h) => ({
            scheme_code: fund.scheme_code,
            stock_isin: h.stock_isin,
            stock_name: h.stock_name,
            holding_pct: h.holding_pct,
            sector: h.sector,
            fetched_at: now,
          }));

          await admin.from("holdings_cache").insert(rows);

          return {
            fund,
            holdings: rows.map((r, i) => ({ id: `temp-${i}`, ...r })),
          };
        }

        return { fund, holdings: [] };
      })
    );

    const result = computeAggregation(
      fundsWithHoldings,
      portfolio.total_value_inr
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
