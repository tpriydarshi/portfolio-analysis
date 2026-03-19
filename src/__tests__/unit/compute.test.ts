import { describe, it, expect } from "vitest";
import { computeAggregation } from "@/lib/aggregation/compute";
import type { HoldingsCache, PortfolioFund } from "@/types/database";

function makeFund(overrides: Partial<PortfolioFund> = {}): PortfolioFund {
  return {
    id: "fund-1",
    portfolio_id: "portfolio-1",
    scheme_code: 100,
    scheme_name: "Test Fund",
    allocation_pct: 50,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeHolding(overrides: Partial<HoldingsCache> = {}): HoldingsCache {
  return {
    id: "h-1",
    scheme_code: 100,
    stock_isin: "INE001A01036",
    stock_name: "HDFC Bank",
    holding_pct: 10,
    sector: "Financial Services",
    fetched_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeAggregation", () => {
  it("computes weighted exposure for a single fund with a single stock", () => {
    const result = computeAggregation(
      [
        {
          fund: makeFund({ allocation_pct: 100 }),
          holdings: [makeHolding({ holding_pct: 10 })],
        },
      ],
      null
    );

    expect(result.totalStocks).toBe(1);
    expect(result.stocks[0].exposurePct).toBeCloseTo(10, 2);
    expect(result.stocks[0].amountInr).toBeNull();
  });

  it("computes weighted exposure for a single fund at 50% allocation", () => {
    const result = computeAggregation(
      [
        {
          fund: makeFund({ allocation_pct: 50 }),
          holdings: [makeHolding({ holding_pct: 10 })],
        },
      ],
      null
    );

    // 50% allocation * 10% holding = 5% exposure
    expect(result.stocks[0].exposurePct).toBeCloseTo(5, 2);
  });

  it("aggregates the same stock across two funds", () => {
    const result = computeAggregation(
      [
        {
          fund: makeFund({ id: "f1", scheme_code: 100, scheme_name: "Fund A", allocation_pct: 60 }),
          holdings: [makeHolding({ scheme_code: 100, holding_pct: 8 })],
        },
        {
          fund: makeFund({ id: "f2", scheme_code: 200, scheme_name: "Fund B", allocation_pct: 40 }),
          holdings: [makeHolding({ scheme_code: 200, holding_pct: 12 })],
        },
      ],
      null
    );

    // (60% * 8%) + (40% * 12%) = 4.8% + 4.8% = 9.6%
    expect(result.totalStocks).toBe(1);
    expect(result.stocks[0].exposurePct).toBeCloseTo(9.6, 2);
    expect(result.stocks[0].contributingFunds).toHaveLength(2);
  });

  it("calculates INR amounts when total value is provided", () => {
    const result = computeAggregation(
      [
        {
          fund: makeFund({ allocation_pct: 100 }),
          holdings: [makeHolding({ holding_pct: 10 })],
        },
      ],
      1000000 // 10 lakh
    );

    // 10% of 10 lakh = 1 lakh
    expect(result.stocks[0].amountInr).toBeCloseTo(100000, 0);
  });

  it("returns null amountInr when no total value", () => {
    const result = computeAggregation(
      [
        {
          fund: makeFund({ allocation_pct: 100 }),
          holdings: [makeHolding({ holding_pct: 10 })],
        },
      ],
      null
    );

    expect(result.stocks[0].amountInr).toBeNull();
  });

  it("correctly groups sectors", () => {
    const result = computeAggregation(
      [
        {
          fund: makeFund({ allocation_pct: 100 }),
          holdings: [
            makeHolding({ stock_isin: "INE001", stock_name: "A", holding_pct: 10, sector: "IT" }),
            makeHolding({ stock_isin: "INE002", stock_name: "B", holding_pct: 5, sector: "IT" }),
            makeHolding({ stock_isin: "INE003", stock_name: "C", holding_pct: 8, sector: "Banking" }),
          ],
        },
      ],
      null
    );

    expect(result.sectors).toHaveLength(2);
    const itSector = result.sectors.find((s) => s.sector === "IT");
    expect(itSector?.exposurePct).toBeCloseTo(15, 2);
    expect(itSector?.stockCount).toBe(2);
  });

  it("identifies fund overlaps", () => {
    const sharedStock = makeHolding({ stock_isin: "SHARED001", stock_name: "Shared Corp" });
    const uniqueStock = makeHolding({ stock_isin: "UNIQUE001", stock_name: "Unique Corp" });

    const result = computeAggregation(
      [
        {
          fund: makeFund({ id: "f1", scheme_code: 100, scheme_name: "Fund A", allocation_pct: 50 }),
          holdings: [
            { ...sharedStock, scheme_code: 100, holding_pct: 10 },
            { ...uniqueStock, scheme_code: 100, holding_pct: 5 },
          ],
        },
        {
          fund: makeFund({ id: "f2", scheme_code: 200, scheme_name: "Fund B", allocation_pct: 50 }),
          holdings: [{ ...sharedStock, scheme_code: 200, holding_pct: 8 }],
        },
      ],
      null
    );

    expect(result.fundOverlaps).toHaveLength(1);
    expect(result.fundOverlaps[0].stockName).toBe("Shared Corp");
    expect(result.fundOverlaps[0].fundCount).toBe(2);
  });

  it("sorts stocks by exposure descending", () => {
    const result = computeAggregation(
      [
        {
          fund: makeFund({ allocation_pct: 100 }),
          holdings: [
            makeHolding({ stock_isin: "A", stock_name: "Small", holding_pct: 2 }),
            makeHolding({ stock_isin: "B", stock_name: "Big", holding_pct: 15 }),
            makeHolding({ stock_isin: "C", stock_name: "Medium", holding_pct: 7 }),
          ],
        },
      ],
      null
    );

    expect(result.stocks[0].name).toBe("Big");
    expect(result.stocks[1].name).toBe("Medium");
    expect(result.stocks[2].name).toBe("Small");
  });

  it("computes top 10 concentration", () => {
    const holdings = Array.from({ length: 15 }, (_, i) =>
      makeHolding({
        stock_isin: `ISN${i}`,
        stock_name: `Stock ${i}`,
        holding_pct: 5,
      })
    );

    const result = computeAggregation(
      [{ fund: makeFund({ allocation_pct: 100 }), holdings }],
      null
    );

    // Each stock = 5%, top 10 = 50%
    expect(result.top10Concentration).toBeCloseTo(50, 1);
    expect(result.totalCoverage).toBeCloseTo(75, 1);
  });

  it("handles empty holdings gracefully", () => {
    const result = computeAggregation(
      [{ fund: makeFund({ allocation_pct: 100 }), holdings: [] }],
      null
    );

    expect(result.totalStocks).toBe(0);
    expect(result.stocks).toHaveLength(0);
    expect(result.topHolding).toBeNull();
    expect(result.top10Concentration).toBe(0);
  });

  it("handles multiple funds with no overlap", () => {
    const result = computeAggregation(
      [
        {
          fund: makeFund({ id: "f1", scheme_code: 100, scheme_name: "Fund A", allocation_pct: 50 }),
          holdings: [
            makeHolding({ scheme_code: 100, stock_isin: "A1", stock_name: "Alpha", holding_pct: 20 }),
          ],
        },
        {
          fund: makeFund({ id: "f2", scheme_code: 200, scheme_name: "Fund B", allocation_pct: 50 }),
          holdings: [
            makeHolding({ scheme_code: 200, stock_isin: "B1", stock_name: "Beta", holding_pct: 20 }),
          ],
        },
      ],
      null
    );

    expect(result.totalStocks).toBe(2);
    expect(result.fundOverlaps).toHaveLength(0);
    // Each: 50% * 20% = 10%
    expect(result.stocks[0].exposurePct).toBeCloseTo(10, 2);
    expect(result.stocks[1].exposurePct).toBeCloseTo(10, 2);
  });

  it("assigns stocks without sector to 'Others'", () => {
    const result = computeAggregation(
      [
        {
          fund: makeFund({ allocation_pct: 100 }),
          holdings: [
            makeHolding({ stock_isin: "X1", stock_name: "NoSector", holding_pct: 5, sector: null }),
          ],
        },
      ],
      null
    );

    expect(result.sectors).toHaveLength(1);
    expect(result.sectors[0].sector).toBe("Others");
  });

  it("computes sector INR amounts when total value provided", () => {
    const result = computeAggregation(
      [
        {
          fund: makeFund({ allocation_pct: 100 }),
          holdings: [
            makeHolding({ stock_isin: "A", stock_name: "A", holding_pct: 10, sector: "IT" }),
            makeHolding({ stock_isin: "B", stock_name: "B", holding_pct: 5, sector: "IT" }),
          ],
        },
      ],
      2000000
    );

    const itSector = result.sectors.find((s) => s.sector === "IT");
    // 15% of 20 lakh = 3 lakh
    expect(itSector?.amountInr).toBeCloseTo(300000, 0);
  });
});
