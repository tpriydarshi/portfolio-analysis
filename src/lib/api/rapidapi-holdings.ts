export interface RawHolding {
  stock_isin: string;
  stock_name: string;
  holding_pct: number;
  sector: string | null;
}

export async function fetchHoldings(schemeCode: number): Promise<RawHolding[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST;

  if (!apiKey || !apiHost) {
    throw new Error("RapidAPI credentials not configured");
  }

  const res = await fetch(
    `https://${apiHost}/v1/scheme/${schemeCode}/portfolio`,
    {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`RapidAPI holdings fetch failed: ${res.status}`);
  }

  const data = await res.json();

  // The API may return holdings in different formats; normalize
  const holdings: RawHolding[] = [];

  if (Array.isArray(data)) {
    for (const item of data) {
      holdings.push({
        stock_isin: item.isin || item.stock_isin || "UNKNOWN",
        stock_name: item.company_name || item.stock_name || item.name || "Unknown",
        holding_pct: parseFloat(item.corpus_per || item.holding_pct || "0"),
        sector: item.sector || item.sector_name || null,
      });
    }
  } else if (data.holdings && Array.isArray(data.holdings)) {
    for (const item of data.holdings) {
      holdings.push({
        stock_isin: item.isin || item.stock_isin || "UNKNOWN",
        stock_name: item.company_name || item.stock_name || item.name || "Unknown",
        holding_pct: parseFloat(item.corpus_per || item.holding_pct || "0"),
        sector: item.sector || item.sector_name || null,
      });
    }
  }

  return holdings;
}
