import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // Check cache first
    const admin = createAdminClient();
    const { data: cached } = await admin
      .from("scheme_search_cache")
      .select("*")
      .ilike("scheme_name", `%${query}%`)
      .limit(30);

    if (cached && cached.length > 0) {
      return NextResponse.json(
        cached.map((s) => ({
          schemeCode: s.scheme_code,
          schemeName: s.scheme_name,
          fundHouse: s.fund_house,
        }))
      );
    }

    // Fetch from mfapi.in
    const res = await fetch(
      `https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`
    );

    if (!res.ok) {
      throw new Error(`mfapi.in returned ${res.status}`);
    }

    const data: Array<{ schemeCode: number; schemeName: string }> =
      await res.json();
    const results = data.slice(0, 50);

    // Cache results (fire and forget)
    if (results.length > 0) {
      const rows = results.map((r) => ({
        scheme_code: r.schemeCode,
        scheme_name: r.schemeName,
        fund_house: extractFundHouse(r.schemeName),
        cached_at: new Date().toISOString(),
      }));

      admin
        .from("scheme_search_cache")
        .upsert(rows, { onConflict: "scheme_code" })
        .then(() => {});
    }

    return NextResponse.json(
      results.map((r) => ({
        schemeCode: r.schemeCode,
        schemeName: r.schemeName,
        fundHouse: extractFundHouse(r.schemeName),
      }))
    );
  } catch (error) {
    console.error("Scheme search error:", error);
    return NextResponse.json(
      { error: "Failed to search schemes" },
      { status: 500 }
    );
  }
}

function extractFundHouse(schemeName: string): string {
  const parts = schemeName.split(" ");
  // Most scheme names start with the fund house name
  return parts.slice(0, 2).join(" ");
}
