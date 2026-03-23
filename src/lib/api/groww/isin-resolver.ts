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

  // Fuzzy match: only attempt if the normalized name is long enough to be
  // meaningfully unique (avoids short prefixes like "hdfc" colliding).
  if (normalized.length >= 8) {
    let bestMatch: string | undefined;
    let bestOverlap = 0;

    for (const [key, isin] of lookup) {
      if (key.length < 8) continue;

      // Check if one string is a prefix of the other
      const shorter = normalized.length <= key.length ? normalized : key;
      const longer = normalized.length <= key.length ? key : normalized;

      if (!longer.startsWith(shorter)) continue;

      // Require the overlap (shorter length) to cover at least 80% of the
      // longer string's length. This prevents "hdfc bank" from matching
      // "hdfc life insurance" — the overlap is too small relative to the
      // longer candidate.
      const overlapRatio = shorter.length / longer.length;
      if (overlapRatio < 0.8) continue;

      // Among qualifying matches, prefer the longest overlap (most specific)
      if (shorter.length > bestOverlap) {
        bestOverlap = shorter.length;
        bestMatch = isin;
      }
    }

    if (bestMatch) return bestMatch;
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
