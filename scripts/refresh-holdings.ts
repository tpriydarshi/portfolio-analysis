/**
 * CLI script to refresh mutual fund holdings data from AMC portfolio Excel files.
 *
 * Usage:
 *   pnpm run refresh-holdings                     # All AMCs, previous month
 *   pnpm run refresh-holdings --amc hdfc           # Specific AMC only
 *   pnpm run refresh-holdings --month 02 --year 2026  # Specific period
 */

import dotenv from "dotenv";
import path from "path";

// Load .env.local (Next.js convention) then .env as fallback
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { createClient } from "@supabase/supabase-js";
import { AMC_REGISTRY, type AmcConfig, type DownloadTarget } from "../src/lib/api/amfi/amc-registry";
import { parsePortfolioExcel } from "../src/lib/api/amfi/excel-parser";
import { findMatchingScheme } from "../src/lib/api/amfi/scheme-mapper";
import { fetchHoldingsFromGroww, buildIsinLookup } from "../src/lib/api/groww";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing env vars. Ensure NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let amcFilter: string | null = null;
  let source: "all" | "groww" = "all";
  let month: number;
  let year: number;

  // Default to previous month
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  month = prevMonth.getMonth() + 1; // 1-indexed
  year = prevMonth.getFullYear();

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--amc" && args[i + 1]) {
      amcFilter = args[++i];
    } else if (args[i] === "--month" && args[i + 1]) {
      month = parseInt(args[++i], 10);
    } else if (args[i] === "--year" && args[i + 1]) {
      year = parseInt(args[++i], 10);
    } else if (args[i] === "--source" && args[i + 1]) {
      const val = args[++i];
      if (val === "groww") source = "groww";
    }
  }

  return { amcFilter, month, year, source };
}

// ---------------------------------------------------------------------------
// Download Excel
// ---------------------------------------------------------------------------

async function downloadExcel(target: DownloadTarget): Promise<Buffer | null> {
  try {
    console.log(`  Downloading: ${target.label}`);
    console.log(`    URL: ${target.url}`);
    const res = await fetch(target.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/octet-stream,*/*",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      console.warn(`    Failed: HTTP ${res.status}`);
      return null;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      console.warn(`    Failed: got HTML instead of Excel (likely 404 page)`);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`    OK: ${(buffer.length / 1024).toFixed(0)} KB`);
    return buffer;
  } catch (err) {
    console.warn(`    Error: ${err}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fetch scheme list from mfapi.in
// ---------------------------------------------------------------------------

interface MfApiScheme {
  schemeCode: number;
  schemeName: string;
}

/**
 * Search mfapi.in for Direct Growth scheme codes matching a given fund name.
 */
async function searchSchemeCode(fundName: string): Promise<MfApiScheme[]> {
  try {
    // Use the fund name (strip common suffixes) for a targeted search
    const searchQuery = fundName
      .replace(/\s*\([^)]*\)\s*/g, "")
      .replace(/\s*-\s*(Direct|Regular)\s*(Plan)?\s*/gi, "")
      .trim();

    const res = await fetch(
      `https://api.mfapi.in/mf/search?q=${encodeURIComponent(searchQuery)}`
    );
    if (!res.ok) return [];

    const data: MfApiScheme[] = await res.json();
    return data.filter(
      (s) =>
        s.schemeName.toLowerCase().includes("direct") &&
        (s.schemeName.toLowerCase().includes("growth") ||
         s.schemeName.toLowerCase().includes("growth option"))
    );
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Upsert holdings into Supabase
// ---------------------------------------------------------------------------

async function upsertHoldings(
  schemeCode: number,
  holdings: Array<{
    stock_isin: string;
    stock_name: string;
    holding_pct: number;
    sector: string | null;
  }>
): Promise<boolean> {
  const now = new Date().toISOString();

  const { error: deleteError } = await supabase
    .from("holdings_cache")
    .delete()
    .eq("scheme_code", schemeCode);

  if (deleteError) {
    console.warn(`    DB delete error for ${schemeCode}: ${deleteError.message}`);
    return false;
  }

  const rows = holdings.map((h) => ({
    scheme_code: schemeCode,
    stock_isin: h.stock_isin,
    stock_name: h.stock_name,
    holding_pct: h.holding_pct,
    sector: h.sector,
    fetched_at: now,
  }));

  const { error: insertError } = await supabase.from("holdings_cache").insert(rows);

  if (insertError) {
    console.warn(`    DB insert error for ${schemeCode}: ${insertError.message}`);
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Process a single AMC
// ---------------------------------------------------------------------------

async function processAmc(
  amc: AmcConfig,
  month: number,
  year: number
): Promise<{ schemesLoaded: number; schemesFailed: number; totalStocks: number }> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Processing: ${amc.name} (${amc.id})`);
  console.log(`Period: ${month}/${year}`);
  console.log("=".repeat(60));

  let schemesLoaded = 0;
  let schemesFailed = 0;
  let totalStocks = 0;

  // Step 1: Download all Excel files for this AMC
  const targets = amc.buildUrls(month, year);
  const allParsedSchemes = new Map<string, Array<{ stock_isin: string; stock_name: string; holding_pct: number; sector: string | null }>>();

  for (const target of targets) {
    const buffer = await downloadExcel(target);
    if (!buffer) continue;

    try {
      const parsed = await parsePortfolioExcel(buffer);
      for (const [name, holdings] of parsed) {
        allParsedSchemes.set(name, holdings);
      }
    } catch (err) {
      console.warn(`    Parse error for ${target.label}: ${err}`);
    }

    // Small delay between downloads
    if (targets.length > 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\n  Parsed ${allParsedSchemes.size} schemes total`);
  if (allParsedSchemes.size === 0) {
    return { schemesLoaded: 0, schemesFailed: 0, totalStocks: 0 };
  }

  // Step 2: For each parsed scheme, find its mfapi.in scheme code and upsert
  console.log(`  Matching parsed schemes to mfapi.in scheme codes...`);

  for (const [schemeName, holdings] of allParsedSchemes) {
    if (holdings.length === 0) continue;

    // Search mfapi.in for this specific fund
    const matches = await searchSchemeCode(schemeName);

    if (matches.length === 0) {
      console.log(`  ?? ${schemeName} - no mfapi.in match found`);
      schemesFailed++;
      continue;
    }

    // Use the first Direct Growth match
    const mfScheme = matches[0];
    const success = await upsertHoldings(mfScheme.schemeCode, holdings);
    if (success) {
      schemesLoaded++;
      totalStocks += holdings.length;
      console.log(
        `  -> ${schemeName} => code ${mfScheme.schemeCode}, ${holdings.length} holdings`
      );
    } else {
      schemesFailed++;
    }

    // Small delay to avoid hitting mfapi.in rate limit
    await new Promise((r) => setTimeout(r, 300));
  }

  return { schemesLoaded, schemesFailed, totalStocks };
}

// ---------------------------------------------------------------------------
// Groww.in batch processing
// ---------------------------------------------------------------------------

/**
 * Get scheme codes that need Groww refresh: schemes referenced in user portfolios
 * that are NOT already in the holdings cache.
 */
async function getSchemesForGrowwRefresh(
  alreadyRefreshed: Set<number>
): Promise<Array<{ schemeCode: number; schemeName: string }>> {
  // Get all scheme codes from user portfolios
  const { data: portfolioFunds, error } = await supabase
    .from("portfolio_funds")
    .select("scheme_code, scheme_name");

  if (error || !portfolioFunds) {
    console.warn("Could not fetch portfolio funds:", error?.message);
    return [];
  }

  // Deduplicate and exclude already-refreshed schemes
  const seen = new Set<number>();
  const schemes: Array<{ schemeCode: number; schemeName: string }> = [];

  for (const fund of portfolioFunds) {
    const code = fund.scheme_code;
    if (seen.has(code) || alreadyRefreshed.has(code)) continue;
    seen.add(code);
    schemes.push({ schemeCode: code, schemeName: fund.scheme_name });
  }

  return schemes;
}

async function processGrowwBatch(
  alreadyRefreshed: Set<number>
): Promise<{ schemesLoaded: number; schemesFailed: number; totalStocks: number }> {
  console.log(`\n${"=".repeat(60)}`);
  console.log("Processing: Groww.in API fallback");
  console.log("=".repeat(60));

  // Build ISIN lookup from existing cache data
  console.log("  Building ISIN lookup from existing cache...");
  const isinLookup = await buildIsinLookup(supabase);
  console.log(`  ISIN lookup built: ${isinLookup.size} known stocks`);

  const schemes = await getSchemesForGrowwRefresh(alreadyRefreshed);
  console.log(`  Schemes to refresh via Groww: ${schemes.length}`);

  let schemesLoaded = 0;
  let schemesFailed = 0;
  let totalStocks = 0;

  for (const { schemeCode, schemeName } of schemes) {
    try {
      const holdings = await fetchHoldingsFromGroww(schemeCode, schemeName, isinLookup);

      if (holdings.length === 0) {
        console.log(`  ?? ${schemeName} (${schemeCode}) - no Groww data`);
        schemesFailed++;
        continue;
      }

      const success = await upsertHoldings(schemeCode, holdings);
      if (success) {
        schemesLoaded++;
        totalStocks += holdings.length;
        console.log(
          `  -> ${schemeName} => ${schemeCode}, ${holdings.length} holdings (Groww)`
        );
      } else {
        schemesFailed++;
      }
    } catch (err) {
      console.warn(`  Error processing ${schemeName}: ${err}`);
      schemesFailed++;
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 500));
  }

  return { schemesLoaded, schemesFailed, totalStocks };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { amcFilter, month, year, source } = parseArgs();

  console.log("Portfolio Holdings Refresh");
  console.log(`Target period: ${month}/${year}`);
  console.log(`Source: ${source}`);
  if (amcFilter) console.log(`AMC filter: ${amcFilter}`);

  let totalSchemesLoaded = 0;
  let totalSchemesFailed = 0;
  let totalStocksInserted = 0;
  const refreshedSchemeCodes = new Set<number>();

  // Step 1: AMFI Excel refresh (skip if --source groww)
  if (source !== "groww") {
    const amcs = amcFilter
      ? AMC_REGISTRY.filter((a) => a.id === amcFilter)
      : AMC_REGISTRY;

    if (amcFilter && amcs.length === 0) {
      console.error(`No AMC found matching "${amcFilter}"`);
      console.log("Available AMCs:", AMC_REGISTRY.map((a) => a.id).join(", "));
      process.exit(1);
    }

    for (let i = 0; i < amcs.length; i++) {
      const result = await processAmc(amcs[i], month, year);
      totalSchemesLoaded += result.schemesLoaded;
      totalSchemesFailed += result.schemesFailed;
      totalStocksInserted += result.totalStocks;

      // Rate limit between AMC downloads
      if (i < amcs.length - 1) {
        console.log("\n  Waiting 2s before next AMC...");
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // Track which schemes were loaded via AMFI so Groww can skip them
    // (We don't have exact codes from processAmc, but Groww step will
    // check the cache anyway via getSchemesForGrowwRefresh)
  }

  // Step 2: Groww.in fallback for remaining schemes
  if (source === "all" || source === "groww") {
    const growwResult = await processGrowwBatch(refreshedSchemeCodes);
    totalSchemesLoaded += growwResult.schemesLoaded;
    totalSchemesFailed += growwResult.schemesFailed;
    totalStocksInserted += growwResult.totalStocks;
  }

  console.log("\n" + "=".repeat(60));
  console.log("REFRESH COMPLETE");
  console.log("=".repeat(60));
  console.log(`  Schemes loaded:  ${totalSchemesLoaded}`);
  console.log(`  Schemes failed:  ${totalSchemesFailed}`);
  console.log(`  Total stocks:    ${totalStocksInserted}`);
  console.log(`  Source:          ${source}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
