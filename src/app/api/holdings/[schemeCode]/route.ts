import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchHoldingsDeduped } from "@/lib/api/holdings-provider";
import { upsertHoldingsCache } from "@/lib/api/holdings-cache";
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
    const holdings = await fetchHoldingsDeduped(schemeCode);

    if (holdings.length > 0) {
      await upsertHoldingsCache(admin, schemeCode, holdings);
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
