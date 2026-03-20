import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parsePortfolioExcel } from "@/lib/api/amfi/excel-parser";

/** Helper: create an in-memory Excel buffer with the given rows */
function createTestExcel(
  rows: (string | number | null)[][],
  sheetName = "Sheet1"
): Buffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buf);
}

describe("parsePortfolioExcel", () => {
  it("parses a simple single-scheme workbook", async () => {
    const buffer = createTestExcel([
      ["HDFC Top 100 Fund - Direct Plan - Growth"],
      ["ISIN", "Name of the Instrument", "Industry", "% to NAV"],
      ["INE002A01018", "Reliance Industries", "Oil & Gas", 9.8],
      ["INE009A01021", "Infosys", "IT", 8.2],
      ["INE040A01034", "HDFC Bank", "Financial Services", 7.5],
    ]);

    const result = await parsePortfolioExcel(buffer);

    expect(result.size).toBe(1);
    const holdings = result.get("HDFC Top 100 Fund - Direct Plan - Growth");
    expect(holdings).toBeDefined();
    expect(holdings).toHaveLength(3);
    expect(holdings![0]).toEqual({
      stock_isin: "INE002A01018",
      stock_name: "Reliance Industries",
      holding_pct: 9.8,
      sector: "Oil & Gas",
    });
  });

  it("parses multiple schemes in one workbook", async () => {
    const buffer = createTestExcel([
      ["HDFC Top 100 Fund - Direct Plan - Growth"],
      ["ISIN", "Name of the Instrument", "Industry", "% to NAV"],
      ["INE002A01018", "Reliance Industries", "Oil & Gas", 9.8],
      [],
      ["HDFC Mid-Cap Opportunities Fund - Direct Plan - Growth"],
      ["ISIN", "Name of the Instrument", "Industry", "% to NAV"],
      ["INE009A01021", "Infosys", "IT", 5.5],
    ]);

    const result = await parsePortfolioExcel(buffer);
    expect(result.size).toBe(2);
    expect(result.has("HDFC Top 100 Fund - Direct Plan - Growth")).toBe(true);
    expect(result.has("HDFC Mid-Cap Opportunities Fund - Direct Plan - Growth")).toBe(true);
  });

  it("skips non-equity rows (no valid ISIN)", async () => {
    const buffer = createTestExcel([
      ["SBI Blue Chip Fund - Direct Plan - Growth"],
      ["ISIN", "Name of the Instrument", "Industry", "% to NAV"],
      ["INE002A01018", "Reliance Industries", "Oil & Gas", 9.8],
      ["TRBI12345678", "Treasury Bill", "Government", 3.5],
      ["", "Cash & Cash Equivalents", "", 2.1],
    ]);

    const result = await parsePortfolioExcel(buffer);
    const holdings = result.get("SBI Blue Chip Fund - Direct Plan - Growth");
    expect(holdings).toHaveLength(1);
    expect(holdings![0].stock_isin).toBe("INE002A01018");
  });

  it("handles ISIN Code header variation", async () => {
    const buffer = createTestExcel([
      ["Axis Bluechip Fund - Direct Plan - Growth Option"],
      ["ISIN Code", "Security Name", "Sector", "% to Net Assets"],
      ["INE040A01034", "HDFC Bank", "Financial Services", 8.1],
    ]);

    const result = await parsePortfolioExcel(buffer);
    expect(result.size).toBe(1);
    const holdings = result.get("Axis Bluechip Fund - Direct Plan - Growth Option");
    expect(holdings).toHaveLength(1);
  });

  it("detects ISIN header and % to Net Assets", async () => {
    const buffer = createTestExcel([
      ["Axis Bluechip Fund - Direct Plan - Growth Option"],
      ["ISIN", "Security Name", "Sector", "% to Net Assets"],
      ["INE040A01034", "HDFC Bank", "Financial Services", 8.1],
    ]);

    const result = await parsePortfolioExcel(buffer);
    const holdings = result.get("Axis Bluechip Fund - Direct Plan - Growth Option");
    expect(holdings).toHaveLength(1);
    expect(holdings![0].stock_name).toBe("HDFC Bank");
  });

  it("handles US stock ISINs (Parag Parikh style)", async () => {
    const buffer = createTestExcel([
      ["Parag Parikh Flexi Cap Fund - Direct Plan - Growth"],
      ["ISIN", "Name of the Instrument", "Industry", "% to NAV"],
      ["INE040A01034", "HDFC Bank", "Financial Services", 7.6],
      ["US0378331005", "Apple Inc", "Technology", 4.2],
    ]);

    const result = await parsePortfolioExcel(buffer);
    const holdings = result.get("Parag Parikh Flexi Cap Fund - Direct Plan - Growth");
    expect(holdings).toHaveLength(2);
    expect(holdings![1].stock_isin).toBe("US0378331005");
  });

  it("handles decimal percentages (0.0773 = 7.73%)", async () => {
    const buffer = createTestExcel([
      ["Test Fund - Direct Plan - Growth"],
      ["ISIN", "Name of the Instrument", "Industry", "% to Net Assets"],
      ["INE040A01034", "HDFC Bank", "Banks", 0.0773],
    ]);

    const result = await parsePortfolioExcel(buffer);
    const holdings = result.get("Test Fund - Direct Plan - Growth");
    expect(holdings).toHaveLength(1);
    expect(holdings![0].holding_pct).toBe(7.73);
  });

  it("returns empty map for empty workbook", async () => {
    const buffer = createTestExcel([]);
    const result = await parsePortfolioExcel(buffer);
    expect(result.size).toBe(0);
  });

  it("ignores section headers like EQUITY & EQUITY RELATED", async () => {
    const buffer = createTestExcel([
      ["HDFC Flexi Cap Fund - Direct Plan"],
      [null, "ISIN", "Coupon", "Name Of the Instrument", "Industry", "Quantity", "Value", "% to NAV"],
      [null, "EQUITY & EQUITY RELATED"],
      [null, "Listed"],
      [null, "INE090A01021", null, "ICICI Bank", "Banks", 100, 500, 8.78],
    ]);

    const result = await parsePortfolioExcel(buffer);
    expect(result.size).toBe(1);
    const holdings = result.get("HDFC Flexi Cap Fund - Direct Plan");
    expect(holdings).toHaveLength(1);
    expect(holdings![0].stock_isin).toBe("INE090A01021");
  });
});
