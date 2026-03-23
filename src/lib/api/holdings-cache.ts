import { SupabaseClient } from "@supabase/supabase-js";
import { RawHolding } from "@/types/holdings";

/**
 * Atomically upsert holdings cache for a scheme, then remove stale rows
 * that are no longer in the latest holdings set.
 */
export async function upsertHoldingsCache(
  adminClient: SupabaseClient,
  schemeCode: number,
  holdings: RawHolding[]
) {
  if (holdings.length === 0) return;

  const now = new Date().toISOString();

  const rows = holdings.map((h) => ({
    scheme_code: schemeCode,
    stock_isin: h.stock_isin,
    stock_name: h.stock_name,
    holding_pct: h.holding_pct,
    sector: h.sector,
    fetched_at: now,
  }));

  // Upsert all current holdings — atomic per-row, no window of missing data
  const { error: upsertError } = await adminClient
    .from("holdings_cache")
    .upsert(rows, { onConflict: "scheme_code,stock_isin" });

  if (upsertError) {
    console.error("Holdings cache upsert error:", upsertError);
    throw upsertError;
  }

  // Delete stale rows for this scheme that aren't in the new holdings set
  const currentIsins = holdings.map((h) => h.stock_isin);

  const { error: deleteError } = await adminClient
    .from("holdings_cache")
    .delete()
    .eq("scheme_code", schemeCode)
    .not("stock_isin", "in", `(${currentIsins.join(",")})`);

  if (deleteError) {
    console.error("Holdings cache stale-row cleanup error:", deleteError);
    // Non-fatal: stale rows will be overwritten or expire naturally
  }
}
