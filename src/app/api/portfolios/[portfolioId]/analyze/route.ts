import { computeAggregation } from "@/lib/aggregation/compute";
import { upsertHoldingsCache } from "@/lib/api/holdings-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Compute a simple deterministic hash from a string.
 * Uses djb2 algorithm — fast and sufficient for cache invalidation.
 */
function computeHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function buildHoldingsHash(
  funds: { scheme_code: number; allocation_pct: number }[],
  updatedAt: string
): string {
  const sorted = [...funds].sort((a, b) => a.scheme_code - b.scheme_code);
  const key = sorted
    .map((f) => `${f.scheme_code}:${f.allocation_pct}`)
    .join("|");
  return computeHash(`${key}|${updatedAt}`);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  const forceRefresh =
    request.nextUrl.searchParams.get("forceRefresh") === "true";

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
    const holdingsHash = buildHoldingsHash(funds, portfolio.updated_at);

    // Check analysis cache (unless force refresh)
    if (!forceRefresh) {
      const { data: cached } = await admin
        .from("analysis_cache")
        .select("result, holdings_hash")
        .eq("portfolio_id", portfolioId)
        .single();

      if (cached && cached.holdings_hash === holdingsHash) {
        return NextResponse.json(cached.result);
      }
    }

    const CACHE_DAYS = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CACHE_DAYS);

    // Fetch holdings for all funds using allSettled for resilience
    const settled = await Promise.allSettled(
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

        // Fetch from AMFI on-demand (deduplicated across concurrent calls)
        const { fetchHoldingsDeduped } = await import(
          "@/lib/api/holdings-provider"
        );
        const rawHoldings = await fetchHoldingsDeduped(
          fund.scheme_code,
          fund.scheme_name
        );

        if (rawHoldings.length > 0) {
          await upsertHoldingsCache(admin, fund.scheme_code, rawHoldings);

          const now = new Date().toISOString();
          const rows = rawHoldings.map((h, i) => ({
            id: `temp-${i}`,
            scheme_code: fund.scheme_code,
            stock_isin: h.stock_isin,
            stock_name: h.stock_name,
            holding_pct: h.holding_pct,
            sector: h.sector,
            fetched_at: now,
          }));

          return { fund, holdings: rows };
        }

        return { fund, holdings: [] };
      })
    );

    // Separate fulfilled from rejected, collect warnings
    const warnings: string[] = [];
    const fundsWithHoldings: {
      fund: (typeof funds)[0];
      holdings: {
        id: string;
        scheme_code: number;
        stock_isin: string;
        stock_name: string;
        holding_pct: number;
        sector: string | null;
        fetched_at: string;
      }[];
    }[] = [];

    for (let i = 0; i < settled.length; i++) {
      const result = settled[i];
      if (result.status === "fulfilled") {
        if (result.value.holdings.length === 0) {
          warnings.push(
            `No holdings data available for ${funds[i].scheme_name} (${funds[i].scheme_code})`
          );
        }
        fundsWithHoldings.push(result.value);
      } else {
        warnings.push(
          `Failed to fetch holdings for ${funds[i].scheme_name} (${funds[i].scheme_code}): ${result.reason?.message || "Unknown error"}`
        );
        // Include fund with empty holdings so aggregation still works
        fundsWithHoldings.push({ fund: funds[i], holdings: [] });
      }
    }

    // Compute oldest fetched_at across all holdings used
    let oldestFetchedAt: string | null = null;
    for (const fwh of fundsWithHoldings) {
      for (const h of fwh.holdings) {
        if (!oldestFetchedAt || h.fetched_at < oldestFetchedAt) {
          oldestFetchedAt = h.fetched_at;
        }
      }
    }

    const aggregation = computeAggregation(
      fundsWithHoldings,
      portfolio.total_value_inr
    );

    const responsePayload = {
      ...aggregation,
      warnings: warnings.length > 0 ? warnings : undefined,
      dataAsOf: oldestFetchedAt || undefined,
    };

    // Upsert into analysis_cache
    await admin.from("analysis_cache").upsert(
      {
        portfolio_id: portfolioId,
        result: responsePayload,
        holdings_hash: holdingsHash,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "portfolio_id" }
    );

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
