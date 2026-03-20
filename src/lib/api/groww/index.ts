/**
 * Groww.in holdings data source.
 *
 * Orchestrates: search → fetch holdings → resolve ISINs → return RawHolding[]
 */

export { findGrowwSlug, fetchGrowwHoldings } from "./scraper";
export type { GrowwHolding } from "./scraper";
export { buildIsinLookup, resolveIsin, normalizeStockName, generateSyntheticIsin } from "./isin-resolver";

import type { RawHolding } from "@/types/holdings";
import { findGrowwSlug, fetchGrowwHoldings } from "./scraper";
import { resolveIsin } from "./isin-resolver";

/**
 * Fetch holdings for a mutual fund scheme from Groww.in.
 *
 * @param schemeCode - mfapi.in scheme code (used to match in Groww search)
 * @param schemeName - scheme name from mfapi.in (used for search query)
 * @param isinLookup - optional pre-built ISIN lookup map (pass to avoid DB calls)
 */
export async function fetchHoldingsFromGroww(
  schemeCode: number,
  schemeName: string,
  isinLookup?: Map<string, string>
): Promise<RawHolding[]> {
  const lookup = isinLookup ?? new Map<string, string>();

  // Step 1: Find the Groww slug for this fund
  const slug = await findGrowwSlug(schemeName, schemeCode);
  if (!slug) {
    console.warn(`Groww: no slug found for "${schemeName}" (${schemeCode})`);
    return [];
  }

  // Step 2: Fetch holdings from Groww
  const holdings = await fetchGrowwHoldings(slug);
  if (holdings.length === 0) {
    console.warn(`Groww: no holdings returned for slug "${slug}"`);
    return [];
  }

  // Step 3: Map to RawHolding[] with ISIN resolution
  return holdings.map((h) => ({
    stock_isin: resolveIsin(h.company_name, lookup),
    stock_name: h.company_name,
    holding_pct: h.corpus_per,
    sector: h.sector_name,
  }));
}
