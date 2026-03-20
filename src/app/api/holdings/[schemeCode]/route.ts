import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchHoldingsWithFallback } from "@/lib/api/holdings-provider";
import { NextRequest, NextResponse } from "next/server";

const CACHE_DAYS = 30;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ schemeCode: string }> }
) {
  const { schemeCode: schemeCodeStr } = await params;
  const schemeCode = parseInt(schemeCodeStr, 10);

  if (isNaN(schemeCode) || schemeCode <= 0) {
    return NextResponse.json(
      { error: "Invalid scheme code" },
      { status: 400 }
    );
  }

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    // Check cache
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CACHE_DAYS);

    const { data: cached } = await admin
      .from("holdings_cache")
      .select("*")
      .eq("scheme_code", schemeCode)
      .gte("fetched_at", cutoffDate.toISOString())
      .order("holding_pct", { ascending: false });

    if (cached && cached.length > 0) {
      return NextResponse.json({ holdings: cached, source: "cache" });
    }

    // Fetch from API with fallback to sample data
    const holdings = await fetchHoldingsWithFallback(schemeCode);

    if (holdings.length > 0) {
      const now = new Date().toISOString();

      // Delete old cache before inserting to prevent duplicates
      await admin
        .from("holdings_cache")
        .delete()
        .eq("scheme_code", schemeCode);

      const rows = holdings.map((h) => ({
        scheme_code: schemeCode,
        stock_isin: h.stock_isin,
        stock_name: h.stock_name,
        holding_pct: h.holding_pct,
        sector: h.sector,
        fetched_at: now,
      }));

      await admin.from("holdings_cache").insert(rows);
    }

    return NextResponse.json({ holdings, source: "api" });
  } catch (error) {
    console.error(`Holdings fetch error for ${schemeCode}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch holdings" },
      { status: 500 }
    );
  }
}
