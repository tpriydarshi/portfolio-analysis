import type { RawHolding } from "@/types/holdings";
import { AMC_REGISTRY, parsePortfolioExcel, findMatchingScheme, getAmcIdForScheme } from "./amfi";
import { fetchHoldingsFromGroww } from "./groww";

/**
 * Holdings provider with fallback chain:
 * 1. Check Supabase cache (handled by caller in API route)
 * 2. On-demand AMFI fetch: download + parse AMC Excel for the specific scheme
 * 3. Groww.in API fallback: search + fetch holdings for any scheme
 *
 * If all sources fail, returns empty array so the caller can handle gracefully.
 */
export async function fetchHoldingsWithFallback(
  schemeCode: number
): Promise<RawHolding[]> {
  // Step 1: Try AMFI Excel
  try {
    const holdings = await fetchFromAmfi(schemeCode);
    if (holdings.length > 0) return holdings;
  } catch (e) {
    console.warn(`AMFI fetch failed for ${schemeCode}:`, e);
  }

  // Step 2: Try Groww.in
  try {
    const schemeName = await getSchemeNameFromMfApi(schemeCode);
    if (schemeName) {
      const holdings = await fetchHoldingsFromGroww(schemeCode, schemeName);
      if (holdings.length > 0) return holdings;
    }
  } catch (e) {
    console.warn(`Groww fetch failed for ${schemeCode}:`, e);
  }

  // Step 3: Return empty array — caller should handle gracefully
  console.warn(
    `No holdings data available for scheme ${schemeCode}. ` +
    `Run "pnpm run refresh-holdings" to populate data, or this AMC may not be supported yet.`
  );
  return [];
}

async function fetchFromAmfi(schemeCode: number): Promise<RawHolding[]> {
  const amcId = getAmcIdForScheme(schemeCode);
  const schemeName = await getSchemeNameFromMfApi(schemeCode);

  // Find the AMC either by curated mapping or by matching scheme name
  let amc = amcId ? AMC_REGISTRY.find((a) => a.id === amcId) : undefined;

  if (!amc && schemeName) {
    const normalizedName = schemeName.toLowerCase();
    amc = AMC_REGISTRY.find((a) => {
      const amcKeywords = a.name.toLowerCase().split(" ").slice(0, 2);
      return amcKeywords.every((kw) => normalizedName.includes(kw));
    });
  }

  if (!amc) return [];

  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = prevMonth.getMonth() + 1;
  const year = prevMonth.getFullYear();

  // Download and parse all Excel files for this AMC
  const targets = amc.buildUrls(month, year);
  const allParsedSchemes = new Map<string, RawHolding[]>();

  for (const target of targets) {
    const buffer = await downloadExcel(target.url);
    if (!buffer) continue;

    try {
      const parsed = await parsePortfolioExcel(buffer);
      for (const [name, holdings] of parsed) {
        allParsedSchemes.set(name, holdings);
      }
    } catch {
      // continue trying other targets
    }
  }

  const matchedName = findMatchingScheme(schemeCode, allParsedSchemes, schemeName ?? undefined);
  if (!matchedName) return [];

  return allParsedSchemes.get(matchedName) ?? [];
}

async function getSchemeNameFromMfApi(schemeCode: number): Promise<string | null> {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.meta?.scheme_name ?? null;
  } catch {
    return null;
  }
}

async function downloadExcel(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/octet-stream,*/*",
      },
      redirect: "follow",
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) return null;

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}
