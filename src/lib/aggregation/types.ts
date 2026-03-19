export interface StockExposure {
  isin: string;
  name: string;
  sector: string | null;
  exposurePct: number;
  amountInr: number | null;
  contributingFunds: {
    schemeName: string;
    schemeCode: number;
    fundAllocationPct: number;
    stockInFundPct: number;
    weightedContribution: number;
  }[];
}

export interface SectorBreakdown {
  sector: string;
  exposurePct: number;
  amountInr: number | null;
  stockCount: number;
}

export interface AggregatedResult {
  stocks: StockExposure[];
  sectors: SectorBreakdown[];
  totalStocks: number;
  totalCoverage: number;
  topHolding: StockExposure | null;
  top10Concentration: number;
  fundOverlaps: FundOverlap[];
}

export interface FundOverlap {
  isin: string;
  stockName: string;
  fundCount: number;
  funds: {
    schemeName: string;
    holdingPct: number;
  }[];
  totalExposure: number;
}
