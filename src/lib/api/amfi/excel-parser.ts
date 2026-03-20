/**
 * Parse AMC portfolio disclosure Excel files into structured holdings data.
 *
 * AMC Excel files vary in format but generally contain:
 * - Scheme name as a section header row
 * - A header row with columns like: ISIN, Name of Instrument, % to NAV, etc.
 * - Data rows for each holding
 *
 * This parser uses adaptive header detection to handle format variations.
 * Supports both .xlsx (OOXML) and .xls (binary) formats via the xlsx package.
 */

import * as XLSX from "xlsx";
import type { RawHolding } from "@/types/holdings";

/**
 * Parse a portfolio Excel file buffer into a map of scheme name → holdings.
 * Supports both .xlsx (OOXML) and .xls (BIFF) formats.
 */
export async function parsePortfolioExcel(
  buffer: Buffer | ArrayBuffer
): Promise<Map<string, RawHolding[]>> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const results = new Map<string, RawHolding[]>();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    });

    const sheetResults = parseRows(rows);
    for (const [schemeName, holdings] of sheetResults) {
      const existing = results.get(schemeName);
      if (existing) {
        existing.push(...holdings);
      } else {
        results.set(schemeName, holdings);
      }
    }
  }

  return results;
}

function parseRows(
  rows: (string | number | null)[][]
): Map<string, RawHolding[]> {
  const results = new Map<string, RawHolding[]>();
  let currentScheme: string | null = null;
  let isinCol = -1;
  let nameCol = -1;
  let pctCol = -1;
  let sectorCol = -1;
  let holdingsForScheme: RawHolding[] = [];

  for (const row of rows) {
    if (!row) continue;
    const cells = row.map((c) => (c == null ? "" : String(c)));

    // Try to detect header row
    const header = detectHeaderRow(cells);
    if (header) {
      if (currentScheme && holdingsForScheme.length > 0) {
        results.set(currentScheme, holdingsForScheme);
      }
      isinCol = header.isin;
      nameCol = header.name;
      pctCol = header.pct;
      sectorCol = header.sector;
      holdingsForScheme = [];
      continue;
    }

    // Try to detect scheme name row
    const schemeName = detectSchemeName(cells);
    if (schemeName) {
      if (currentScheme && holdingsForScheme.length > 0) {
        results.set(currentScheme, holdingsForScheme);
        holdingsForScheme = [];
      }
      currentScheme = schemeName;
      isinCol = -1;
      continue;
    }

    // Parse data row
    if (isinCol >= 0 && pctCol >= 0 && currentScheme) {
      const holding = parseDataRow(row, isinCol, nameCol, pctCol, sectorCol);
      if (holding) {
        holdingsForScheme.push(holding);
      }
    }
  }

  // Save last scheme
  if (currentScheme && holdingsForScheme.length > 0) {
    results.set(currentScheme, holdingsForScheme);
  }

  return results;
}

interface HeaderResult {
  isin: number;
  name: number;
  pct: number;
  sector: number;
}

/** Detect if this row is a header row containing column labels */
function detectHeaderRow(cells: string[]): HeaderResult | null {
  let isinCol = -1;
  let nameCol = -1;
  let pctCol = -1;
  let sectorCol = -1;

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i].toUpperCase().replace(/\n/g, " ").trim();

    if (
      cell === "ISIN" ||
      cell === "ISIN CODE" ||
      cell === "ISIN NO" ||
      cell === "ISIN NUMBER"
    ) {
      isinCol = i;
    }

    // Prefer exact "% TO NAV" or "% TO NET ASSETS" match first
    if (
      pctCol < 0 &&
      (cell === "% TO NAV" ||
        cell === "% TO NET ASSETS" ||
        cell === "% OF NAV" ||
        cell === "% OF NET ASSETS" ||
        cell === "%TO NAV" ||
        cell === "PERCENTAGE TO NAV" ||
        cell === "% NAV")
    ) {
      pctCol = i;
    }
    // Fallback: substring match (but not if already found, to avoid
    // matching "Derivative % to NAV" over the real column)
    if (pctCol < 0 && (cell.includes("% TO NAV") || cell.includes("% TO NET"))) {
      pctCol = i;
    }

    if (
      cell === "NAME OF THE INSTRUMENT" ||
      cell === "NAME OF INSTRUMENT" ||
      cell.startsWith("NAME OF THE INSTRUMENT") ||
      cell.startsWith("NAME OF INSTRUMENT") ||
      cell.startsWith("NAME OF THE") ||
      cell === "INSTRUMENT NAME" ||
      cell === "SECURITY NAME" ||
      cell === "SCRIP NAME" ||
      cell === "NAME OF THE SECURITY" ||
      cell === "NAME" ||
      cell === "COMPANY NAME" ||
      cell === "COMPANY / ISSUER"
    ) {
      nameCol = i;
    }

    if (
      cell === "INDUSTRY" ||
      cell === "SECTOR" ||
      cell === "INDUSTRY/RATING" ||
      cell === "INDUSTRY / RATING" ||
      cell === "INDUSTRY CLASSIFICATION" ||
      cell.startsWith("INDUSTRY")
    ) {
      sectorCol = i;
    }
  }

  if (isinCol >= 0 && pctCol >= 0) {
    return { isin: isinCol, name: nameCol, pct: pctCol, sector: sectorCol };
  }

  return null;
}

/** Detect if this row contains a scheme name */
function detectSchemeName(cells: string[]): string | null {
  const uniqueNonEmpty = [
    ...new Set(cells.map((c) => c.trim()).filter((c) => c.length > 0)),
  ];

  if (uniqueNonEmpty.length === 0) return null;

  // Allow up to 4 unique values (merged cells may have stray values in extra columns)
  if (uniqueNonEmpty.length <= 4) {
    const text = uniqueNonEmpty[0];

    // Must contain "Fund" or "Scheme" to distinguish from section headers
    // like "EQUITY & EQUITY RELATED" or "MONEY MARKET INSTRUMENTS"
    if (!/\b(fund|scheme)\b/i.test(text)) return null;

    if (text.length > 10 && text.length < 300) {
      // Strip parenthetical descriptions like "(An open ended equity scheme...)"
      const clean = text.replace(/\s*\([^)]*\)\s*/g, "").trim();
      return clean || text;
    }
  }

  return null;
}

/** Parse a data row using the detected column positions */
function parseDataRow(
  rawCells: (string | number | null)[],
  isinCol: number,
  nameCol: number,
  pctCol: number,
  sectorCol: number
): RawHolding | null {
  if (isinCol >= rawCells.length || pctCol >= rawCells.length) return null;

  const isin = String(rawCells[isinCol] ?? "").trim();

  // ISIN must be valid: INE... for Indian stocks, US... for US stocks
  if (!/^(INE|US)[A-Z0-9]+$/.test(isin)) return null;

  // Handle percentage: may be a number (0.0773 = 7.73%) or a string ("7.73")
  const pctRaw = rawCells[pctCol];
  let pct: number;
  if (typeof pctRaw === "number") {
    // If value is < 1, it's likely a decimal ratio (e.g., 0.0773 = 7.73%)
    pct = pctRaw < 1 ? pctRaw * 100 : pctRaw;
  } else {
    pct = parseFloat(String(pctRaw ?? ""));
  }

  if (isNaN(pct) || pct <= 0 || pct > 100) return null;
  pct = Math.round(pct * 100) / 100;

  const name =
    nameCol >= 0 && nameCol < rawCells.length
      ? String(rawCells[nameCol] ?? "Unknown").trim() || "Unknown"
      : "Unknown";

  const sector =
    sectorCol >= 0 && sectorCol < rawCells.length
      ? String(rawCells[sectorCol] ?? "").trim() || null
      : null;

  return {
    stock_isin: isin,
    stock_name: name,
    holding_pct: pct,
    sector,
  };
}
