/**
 * Resolves stock names to ISINs using existing holdings_cache data,
 * with a synthetic ISIN fallback for unmatched stocks.
 */

import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Normalize a stock name for lookup matching:
 * lowercase, strip common suffixes, collapse whitespace.
 */
export function normalizeStockName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(ltd|limited|corp|corporation|inc|incorporated|co)\b\.?/g, "")
    .replace(/[.,'()&-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build an ISIN lookup map from existing holdings_cache rows.
 * Keyed by normalized stock name → ISIN.
 */
export async function buildIsinLookup(
  supabase: SupabaseClient
): Promise<Map<string, string>> {
  const lookup = new Map<string, string>();

  // Fetch distinct (stock_name, stock_isin) pairs, excluding synthetic ISINs
  const { data, error } = await supabase
    .from("holdings_cache")
    .select("stock_name, stock_isin")
    .not("stock_isin", "like", "SYNTH_%");

  if (error || !data) return lookup;

  for (const row of data) {
    if (row.stock_isin && row.stock_name) {
      const key = normalizeStockName(row.stock_name);
      // Prefer the first (real) ISIN we encounter for a given normalized name
      if (!lookup.has(key)) {
        lookup.set(key, row.stock_isin);
      }
    }
  }

  return lookup;
}

/**
 * Resolve a stock name to an ISIN.
 * 1. Exact normalized match against the lookup
 * 2. Generate a deterministic synthetic ISIN: SYNTH_<sha256_prefix>
 */
export function resolveIsin(
  stockName: string,
  lookup: Map<string, string>
): string {
  const normalized = normalizeStockName(stockName);

  // Exact match
  const exact = lookup.get(normalized);
  if (exact) return exact;

  // Try matching with common variations
  // e.g., "Infosys" should match "Infosys Ltd"
  for (const [key, isin] of lookup) {
    if (key.startsWith(normalized) || normalized.startsWith(key)) {
      return isin;
    }
  }

  // Generate synthetic ISIN
  return generateSyntheticIsin(normalized);
}

/**
 * Generate a deterministic synthetic ISIN from a normalized stock name.
 * Format: SYNTH_<first 12 chars of SHA-256 hex>
 */
export function generateSyntheticIsin(normalizedName: string): string {
  const hash = createHash("sha256").update(normalizedName).digest("hex");
  return `SYNTH_${hash.substring(0, 12).toUpperCase()}`;
}
