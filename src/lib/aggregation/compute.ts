import type { HoldingsCache, PortfolioFund } from "@/types/database";
import type {
  AggregatedResult,
  FundOverlap,
  SectorBreakdown,
  StockExposure,
} from "./types";

interface FundWithHoldings {
  fund: PortfolioFund;
  holdings: HoldingsCache[];
}

export function computeAggregation(
  fundsWithHoldings: FundWithHoldings[],
  totalValueInr: number | null
): AggregatedResult {
  const stockMap = new Map<string, StockExposure>();

  for (const { fund, holdings } of fundsWithHoldings) {
    for (const holding of holdings) {
      const isin = holding.stock_isin;
      const weightedContribution =
        (fund.allocation_pct / 100) * (holding.holding_pct / 100);

      if (!stockMap.has(isin)) {
        stockMap.set(isin, {
          isin,
          name: holding.stock_name,
          sector: holding.sector,
          exposurePct: 0,
          amountInr: null,
          contributingFunds: [],
        });
      }

      const stock = stockMap.get(isin)!;
      stock.exposurePct += weightedContribution * 100;
      stock.contributingFunds.push({
        schemeName: fund.scheme_name,
        schemeCode: fund.scheme_code,
        fundAllocationPct: fund.allocation_pct,
        stockInFundPct: holding.holding_pct,
        weightedContribution: weightedContribution * 100,
      });
    }
  }

  // Calculate INR amounts if total value is provided
  if (totalValueInr) {
    for (const stock of stockMap.values()) {
      stock.amountInr = (stock.exposurePct / 100) * totalValueInr;
    }
  }

  // Sort by exposure descending
  const stocks = Array.from(stockMap.values()).sort(
    (a, b) => b.exposurePct - a.exposurePct
  );

  // Sector breakdown
  const sectorMap = new Map<string, SectorBreakdown>();
  for (const stock of stocks) {
    const sector = stock.sector || "Others";
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, {
        sector,
        exposurePct: 0,
        amountInr: null,
        stockCount: 0,
      });
    }
    const s = sectorMap.get(sector)!;
    s.exposurePct += stock.exposurePct;
    s.stockCount += 1;
    if (totalValueInr) {
      s.amountInr = (s.amountInr || 0) + (stock.amountInr || 0);
    }
  }
  const sectors = Array.from(sectorMap.values()).sort(
    (a, b) => b.exposurePct - a.exposurePct
  );

  // Fund overlaps (stocks in 2+ funds)
  const fundOverlaps: FundOverlap[] = stocks
    .filter((s) => s.contributingFunds.length >= 2)
    .map((s) => ({
      isin: s.isin,
      stockName: s.name,
      fundCount: s.contributingFunds.length,
      funds: s.contributingFunds.map((f) => ({
        schemeName: f.schemeName,
        holdingPct: f.stockInFundPct,
      })),
      totalExposure: s.exposurePct,
    }))
    .sort((a, b) => b.totalExposure - a.totalExposure);

  const totalCoverage = stocks.reduce((acc, s) => acc + s.exposurePct, 0);
  const top10Concentration = stocks
    .slice(0, 10)
    .reduce((acc, s) => acc + s.exposurePct, 0);

  return {
    stocks,
    sectors,
    totalStocks: stocks.length,
    totalCoverage,
    topHolding: stocks[0] || null,
    top10Concentration,
    fundOverlaps,
  };
}
