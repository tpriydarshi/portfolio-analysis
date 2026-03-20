/**
 * Groww.in API client for fetching mutual fund holdings.
 *
 * Uses two endpoints:
 * 1. Entity Search API — find the fund's URL slug given a scheme name
 * 2. Scheme Detail API — fetch portfolio holdings for that fund
 *
 * Holdings are returned as tuples:
 * [scheme_code, date, company_name, type, sector, asset_class, ?, value, pct, ?, ?, stock_slug]
 */

const GROWW_BASE = "https://groww.in/v1/api";
const GROWW_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  Accept: "application/json",
};

export interface GrowwHolding {
  company_name: string;
  corpus_per: number;
  sector_name: string | null;
  stock_search_id: string | null;
}

interface GrowwEntityResult {
  scheme_code: string;
  search_id: string; // URL slug
  title: string;
  id: string;
}

interface GrowwEntityResponse {
  content?: GrowwEntityResult[];
}

/**
 * Holdings from detail API are arrays (tuples), not objects.
 * Index mapping:
 *   [0] scheme_code
 *   [1] date (YYYY-MM-DD)
 *   [2] company_name
 *   [3] instrument_type (EQ, DB, etc.)
 *   [4] sector
 *   [5] asset_class (Equity, Debt, etc.)
 *   [6] unknown (null)
 *   [7] value (corpus in crores)
 *   [8] percentage (string)
 *   [9] unknown (null)
 *   [10] unknown (null)
 *   [11] stock_slug
 */
type GrowwHoldingTuple = [
  string, // scheme_code
  string, // date
  string, // company_name
  string, // instrument_type
  string, // sector
  string, // asset_class
  unknown, // ?
  string, // value
  string, // percentage
  unknown, // ?
  unknown, // ?
  string | null, // stock_slug
];

interface GrowwDetailResponse {
  scheme_name?: string;
  scheme_code?: string;
  holdings?: GrowwHoldingTuple[];
}

/**
 * Search groww.in for a fund slug given an mfapi.in scheme name.
 * Validates results by scheme_code or name similarity to avoid mismatches.
 */
export async function findGrowwSlug(
  schemeName: string,
  schemeCode?: number
): Promise<string | null> {
  // Strip "Direct Plan" / "Growth" etc. for a cleaner search
  const searchQuery = schemeName
    .replace(/\s*-\s*(Direct|Regular)\s*(Plan)?\s*/gi, "")
    .replace(/\s*-?\s*(Growth|Dividend|IDCW)\s*(Option)?\s*/gi, "")
    .replace(/\s*\([^)]*\)\s*/g, "")
    .trim();

  const url = `${GROWW_BASE}/search/v1/entity?entity_type=scheme&q=${encodeURIComponent(searchQuery)}&size=10`;

  try {
    const res = await fetch(url, { headers: GROWW_HEADERS });
    if (!res.ok) return null;

    const data: GrowwEntityResponse = await res.json();
    const results = data.content ?? [];
    if (results.length === 0) return null;

    // Strategy 1: Exact match by scheme_code (most reliable)
    if (schemeCode) {
      const codeMatch = results.find(
        (r) => r.scheme_code === String(schemeCode)
      );
      if (codeMatch) return codeMatch.search_id;
    }

    // Strategy 2: Name similarity match — only accept if title is reasonably similar
    // to the query to avoid returning a completely unrelated fund
    const queryWords = normalizeForMatch(searchQuery);
    for (const r of results) {
      const titleWords = normalizeForMatch(r.title ?? "");
      if (wordOverlapScore(queryWords, titleWords) >= 0.5) {
        return r.search_id ?? r.id;
      }
    }

    // No confident match found
    return null;
  } catch {
    return null;
  }
}

/** Normalize text into a set of meaningful words for comparison */
function normalizeForMatch(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[-–—]/g, " ")
      .replace(
        /\b(direct|regular|plan|growth|option|dividend|idcw|fund|scheme)\b/g,
        ""
      )
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

/** Word overlap score between two word sets (0-1) */
function wordOverlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  for (const word of a) {
    if (b.has(word)) overlap++;
  }
  return overlap / Math.max(a.size, b.size);
}

/**
 * Fetch holdings for a fund from groww.in detail API.
 */
export async function fetchGrowwHoldings(
  slug: string
): Promise<GrowwHolding[]> {
  const url = `${GROWW_BASE}/data/mf/web/v1/scheme/search/${encodeURIComponent(slug)}`;

  try {
    const res = await fetch(url, { headers: GROWW_HEADERS });
    if (!res.ok) return [];

    const data: GrowwDetailResponse = await res.json();
    const raw = data.holdings ?? [];

    const valid = raw
      .filter(
        (h) =>
          Array.isArray(h) &&
          h.length >= 9 &&
          typeof h[2] === "string" &&
          h[2].length > 0 &&
          (parseFloat(String(h[8])) || 0) > 0
      );

    // Consolidate by company name — Groww lists the same company multiple times
    // for different instrument types (equity, CDs, debt, futures, etc.)
    const consolidated = new Map<
      string,
      { corpus_per: number; sector_name: string | null; stock_search_id: string | null }
    >();

    for (const h of valid) {
      const name = h[2];
      const pct = parseFloat(String(h[8])) || 0;
      const existing = consolidated.get(name);
      if (existing) {
        existing.corpus_per += pct;
      } else {
        consolidated.set(name, {
          corpus_per: pct,
          sector_name: h[4] || null,
          stock_search_id: h[11] ?? null,
        });
      }
    }

    return Array.from(consolidated.entries()).map(([name, data]) => ({
      company_name: name,
      corpus_per: Math.round(data.corpus_per * 100) / 100,
      sector_name: data.sector_name,
      stock_search_id: data.stock_search_id,
    }));
  } catch {
    return [];
  }
}
