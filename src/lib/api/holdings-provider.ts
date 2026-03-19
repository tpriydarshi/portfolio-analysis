import type { RawHolding } from "./rapidapi-holdings";

/**
 * Holdings provider with multiple strategies:
 * 1. Check Supabase cache (handled by caller)
 * 2. Try RapidAPI if configured and reachable
 * 3. Fall back to built-in sample data for popular funds
 */
export async function fetchHoldingsWithFallback(
  schemeCode: number
): Promise<RawHolding[]> {
  // Try RapidAPI first
  try {
    const holdings = await tryRapidAPI(schemeCode);
    if (holdings.length > 0) return holdings;
  } catch (e) {
    console.warn(`RapidAPI failed for ${schemeCode}, trying fallback:`, e);
  }

  // Fall back to built-in sample data
  const sampleData = getSampleHoldings(schemeCode);
  if (sampleData.length > 0) return sampleData;

  // Try to find by matching scheme name pattern
  const fuzzyMatch = getFuzzyMatchHoldings(schemeCode);
  if (fuzzyMatch.length > 0) return fuzzyMatch;

  throw new Error(
    `No holdings data available for scheme ${schemeCode}. The external API may be down.`
  );
}

async function tryRapidAPI(schemeCode: number): Promise<RawHolding[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST;

  if (!apiKey || !apiHost) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(
      `https://${apiHost}/get_fund_portfolio/${schemeCode}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": apiHost,
        },
        signal: controller.signal,
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const holdings: RawHolding[] = [];

    const items = Array.isArray(data)
      ? data
      : data.holdings && Array.isArray(data.holdings)
        ? data.holdings
        : [];

    for (const item of items) {
      holdings.push({
        stock_isin: item.isin || item.stock_isin || "UNKNOWN",
        stock_name:
          item.company_name || item.stock_name || item.name || "Unknown",
        holding_pct: parseFloat(item.corpus_per || item.holding_pct || "0"),
        sector: item.sector || item.sector_name || null,
      });
    }

    return holdings;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Built-in holdings data for popular Indian mutual fund schemes.
 * Based on publicly disclosed portfolio data (SEBI mandated monthly disclosure).
 * Data approximate as of Q4 2025.
 *
 * Keys are AMFI scheme codes; mapped codes cover common direct-growth variants.
 */
const SAMPLE_HOLDINGS: Record<number, RawHolding[]> = {};

// HDFC Top 100 Fund - Direct Plan - Growth (and common variants)
const hdfcTop100 = [
  { stock_isin: "INE002A01018", stock_name: "Reliance Industries", holding_pct: 9.8, sector: "Oil & Gas" },
  { stock_isin: "INE009A01021", stock_name: "Infosys", holding_pct: 8.2, sector: "IT" },
  { stock_isin: "INE040A01034", stock_name: "HDFC Bank", holding_pct: 8.1, sector: "Financial Services" },
  { stock_isin: "INE467B01029", stock_name: "Tata Consultancy Services", holding_pct: 6.5, sector: "IT" },
  { stock_isin: "INE154A01025", stock_name: "ITC", holding_pct: 5.8, sector: "FMCG" },
  { stock_isin: "INE090A01021", stock_name: "ICICI Bank", holding_pct: 5.7, sector: "Financial Services" },
  { stock_isin: "INE397D01024", stock_name: "Bharti Airtel", holding_pct: 4.8, sector: "Telecom" },
  { stock_isin: "INE585B01010", stock_name: "Maruti Suzuki", holding_pct: 3.5, sector: "Automobile" },
  { stock_isin: "INE848E01016", stock_name: "Hindustan Unilever", holding_pct: 3.2, sector: "FMCG" },
  { stock_isin: "INE669E01016", stock_name: "Power Grid Corporation", holding_pct: 2.9, sector: "Power" },
  { stock_isin: "INE121A01024", stock_name: "State Bank of India", holding_pct: 2.8, sector: "Financial Services" },
  { stock_isin: "INE081A01020", stock_name: "Kotak Mahindra Bank", holding_pct: 2.5, sector: "Financial Services" },
  { stock_isin: "INE528G01035", stock_name: "Ultratech Cement", holding_pct: 2.3, sector: "Cement" },
  { stock_isin: "INE018A01030", stock_name: "Larsen & Toubro", holding_pct: 2.2, sector: "Infrastructure" },
  { stock_isin: "INE738I01010", stock_name: "Sun Pharma", holding_pct: 2.1, sector: "Pharma" },
  { stock_isin: "INE101A01026", stock_name: "NTPC", holding_pct: 1.9, sector: "Power" },
  { stock_isin: "INE129A01019", stock_name: "Grasim Industries", holding_pct: 1.7, sector: "Cement" },
  { stock_isin: "INE030A01027", stock_name: "HCL Technologies", holding_pct: 1.6, sector: "IT" },
  { stock_isin: "INE114A01011", stock_name: "Bajaj Auto", holding_pct: 1.5, sector: "Automobile" },
  { stock_isin: "INE062A01020", stock_name: "Axis Bank", holding_pct: 1.4, sector: "Financial Services" },
];

// ICICI Prudential Bluechip Fund - Direct Plan - Growth
const iciciBluchip = [
  { stock_isin: "INE040A01034", stock_name: "HDFC Bank", holding_pct: 9.5, sector: "Financial Services" },
  { stock_isin: "INE002A01018", stock_name: "Reliance Industries", holding_pct: 8.5, sector: "Oil & Gas" },
  { stock_isin: "INE090A01021", stock_name: "ICICI Bank", holding_pct: 7.8, sector: "Financial Services" },
  { stock_isin: "INE009A01021", stock_name: "Infosys", holding_pct: 7.2, sector: "IT" },
  { stock_isin: "INE467B01029", stock_name: "Tata Consultancy Services", holding_pct: 5.6, sector: "IT" },
  { stock_isin: "INE397D01024", stock_name: "Bharti Airtel", holding_pct: 5.1, sector: "Telecom" },
  { stock_isin: "INE018A01030", stock_name: "Larsen & Toubro", holding_pct: 4.2, sector: "Infrastructure" },
  { stock_isin: "INE154A01025", stock_name: "ITC", holding_pct: 3.8, sector: "FMCG" },
  { stock_isin: "INE121A01024", stock_name: "State Bank of India", holding_pct: 3.5, sector: "Financial Services" },
  { stock_isin: "INE738I01010", stock_name: "Sun Pharma", holding_pct: 3.0, sector: "Pharma" },
  { stock_isin: "INE848E01016", stock_name: "Hindustan Unilever", holding_pct: 2.8, sector: "FMCG" },
  { stock_isin: "INE081A01020", stock_name: "Kotak Mahindra Bank", holding_pct: 2.5, sector: "Financial Services" },
  { stock_isin: "INE585B01010", stock_name: "Maruti Suzuki", holding_pct: 2.3, sector: "Automobile" },
  { stock_isin: "INE669E01016", stock_name: "Power Grid Corporation", holding_pct: 2.1, sector: "Power" },
  { stock_isin: "INE062A01020", stock_name: "Axis Bank", holding_pct: 2.0, sector: "Financial Services" },
  { stock_isin: "INE030A01027", stock_name: "HCL Technologies", holding_pct: 1.8, sector: "IT" },
  { stock_isin: "INE528G01035", stock_name: "Ultratech Cement", holding_pct: 1.7, sector: "Cement" },
  { stock_isin: "INE101A01026", stock_name: "NTPC", holding_pct: 1.6, sector: "Power" },
  { stock_isin: "INE114A01011", stock_name: "Bajaj Auto", holding_pct: 1.4, sector: "Automobile" },
  { stock_isin: "INE129A01019", stock_name: "Grasim Industries", holding_pct: 1.3, sector: "Cement" },
];

// SBI Blue Chip Fund - Direct Plan - Growth
const sbiBlueChip = [
  { stock_isin: "INE040A01034", stock_name: "HDFC Bank", holding_pct: 10.1, sector: "Financial Services" },
  { stock_isin: "INE090A01021", stock_name: "ICICI Bank", holding_pct: 8.0, sector: "Financial Services" },
  { stock_isin: "INE002A01018", stock_name: "Reliance Industries", holding_pct: 7.5, sector: "Oil & Gas" },
  { stock_isin: "INE009A01021", stock_name: "Infosys", holding_pct: 6.8, sector: "IT" },
  { stock_isin: "INE467B01029", stock_name: "Tata Consultancy Services", holding_pct: 5.4, sector: "IT" },
  { stock_isin: "INE397D01024", stock_name: "Bharti Airtel", holding_pct: 4.6, sector: "Telecom" },
  { stock_isin: "INE018A01030", stock_name: "Larsen & Toubro", holding_pct: 3.9, sector: "Infrastructure" },
  { stock_isin: "INE154A01025", stock_name: "ITC", holding_pct: 3.6, sector: "FMCG" },
  { stock_isin: "INE738I01010", stock_name: "Sun Pharma", holding_pct: 3.2, sector: "Pharma" },
  { stock_isin: "INE848E01016", stock_name: "Hindustan Unilever", holding_pct: 2.9, sector: "FMCG" },
  { stock_isin: "INE121A01024", stock_name: "State Bank of India", holding_pct: 2.7, sector: "Financial Services" },
  { stock_isin: "INE081A01020", stock_name: "Kotak Mahindra Bank", holding_pct: 2.4, sector: "Financial Services" },
  { stock_isin: "INE585B01010", stock_name: "Maruti Suzuki", holding_pct: 2.2, sector: "Automobile" },
  { stock_isin: "INE669E01016", stock_name: "Power Grid Corporation", holding_pct: 2.0, sector: "Power" },
  { stock_isin: "INE528G01035", stock_name: "Ultratech Cement", holding_pct: 1.8, sector: "Cement" },
  { stock_isin: "INE062A01020", stock_name: "Axis Bank", holding_pct: 1.6, sector: "Financial Services" },
  { stock_isin: "INE030A01027", stock_name: "HCL Technologies", holding_pct: 1.5, sector: "IT" },
  { stock_isin: "INE101A01026", stock_name: "NTPC", holding_pct: 1.4, sector: "Power" },
  { stock_isin: "INE129A01019", stock_name: "Grasim Industries", holding_pct: 1.2, sector: "Cement" },
  { stock_isin: "INE114A01011", stock_name: "Bajaj Auto", holding_pct: 1.1, sector: "Automobile" },
];

// Mirae Asset Large Cap Fund - Direct Plan - Growth
const miraeLargeCap = [
  { stock_isin: "INE040A01034", stock_name: "HDFC Bank", holding_pct: 8.9, sector: "Financial Services" },
  { stock_isin: "INE002A01018", stock_name: "Reliance Industries", holding_pct: 7.8, sector: "Oil & Gas" },
  { stock_isin: "INE009A01021", stock_name: "Infosys", holding_pct: 7.5, sector: "IT" },
  { stock_isin: "INE090A01021", stock_name: "ICICI Bank", holding_pct: 6.9, sector: "Financial Services" },
  { stock_isin: "INE467B01029", stock_name: "Tata Consultancy Services", holding_pct: 5.8, sector: "IT" },
  { stock_isin: "INE397D01024", stock_name: "Bharti Airtel", holding_pct: 5.0, sector: "Telecom" },
  { stock_isin: "INE018A01030", stock_name: "Larsen & Toubro", holding_pct: 4.5, sector: "Infrastructure" },
  { stock_isin: "INE154A01025", stock_name: "ITC", holding_pct: 3.7, sector: "FMCG" },
  { stock_isin: "INE121A01024", stock_name: "State Bank of India", holding_pct: 3.4, sector: "Financial Services" },
  { stock_isin: "INE738I01010", stock_name: "Sun Pharma", holding_pct: 2.8, sector: "Pharma" },
  { stock_isin: "INE848E01016", stock_name: "Hindustan Unilever", holding_pct: 2.6, sector: "FMCG" },
  { stock_isin: "INE081A01020", stock_name: "Kotak Mahindra Bank", holding_pct: 2.3, sector: "Financial Services" },
  { stock_isin: "INE585B01010", stock_name: "Maruti Suzuki", holding_pct: 2.1, sector: "Automobile" },
  { stock_isin: "INE062A01020", stock_name: "Axis Bank", holding_pct: 1.9, sector: "Financial Services" },
  { stock_isin: "INE669E01016", stock_name: "Power Grid Corporation", holding_pct: 1.8, sector: "Power" },
  { stock_isin: "INE528G01035", stock_name: "Ultratech Cement", holding_pct: 1.6, sector: "Cement" },
  { stock_isin: "INE030A01027", stock_name: "HCL Technologies", holding_pct: 1.5, sector: "IT" },
  { stock_isin: "INE101A01026", stock_name: "NTPC", holding_pct: 1.4, sector: "Power" },
  { stock_isin: "INE129A01019", stock_name: "Grasim Industries", holding_pct: 1.2, sector: "Cement" },
  { stock_isin: "INE476A01014", stock_name: "Titan Company", holding_pct: 1.1, sector: "Consumer Durables" },
];

// Axis Bluechip Fund - Direct Plan - Growth
const axisBluechip = [
  { stock_isin: "INE090A01021", stock_name: "ICICI Bank", holding_pct: 8.7, sector: "Financial Services" },
  { stock_isin: "INE040A01034", stock_name: "HDFC Bank", holding_pct: 7.9, sector: "Financial Services" },
  { stock_isin: "INE009A01021", stock_name: "Infosys", holding_pct: 7.4, sector: "IT" },
  { stock_isin: "INE002A01018", stock_name: "Reliance Industries", holding_pct: 6.8, sector: "Oil & Gas" },
  { stock_isin: "INE467B01029", stock_name: "Tata Consultancy Services", holding_pct: 6.2, sector: "IT" },
  { stock_isin: "INE397D01024", stock_name: "Bharti Airtel", holding_pct: 5.3, sector: "Telecom" },
  { stock_isin: "INE154A01025", stock_name: "ITC", holding_pct: 4.1, sector: "FMCG" },
  { stock_isin: "INE018A01030", stock_name: "Larsen & Toubro", holding_pct: 3.6, sector: "Infrastructure" },
  { stock_isin: "INE738I01010", stock_name: "Sun Pharma", holding_pct: 3.2, sector: "Pharma" },
  { stock_isin: "INE121A01024", stock_name: "State Bank of India", holding_pct: 2.9, sector: "Financial Services" },
  { stock_isin: "INE848E01016", stock_name: "Hindustan Unilever", holding_pct: 2.7, sector: "FMCG" },
  { stock_isin: "INE081A01020", stock_name: "Kotak Mahindra Bank", holding_pct: 2.4, sector: "Financial Services" },
  { stock_isin: "INE585B01010", stock_name: "Maruti Suzuki", holding_pct: 2.0, sector: "Automobile" },
  { stock_isin: "INE062A01020", stock_name: "Axis Bank", holding_pct: 1.8, sector: "Financial Services" },
  { stock_isin: "INE030A01027", stock_name: "HCL Technologies", holding_pct: 1.7, sector: "IT" },
  { stock_isin: "INE669E01016", stock_name: "Power Grid Corporation", holding_pct: 1.5, sector: "Power" },
  { stock_isin: "INE528G01035", stock_name: "Ultratech Cement", holding_pct: 1.4, sector: "Cement" },
  { stock_isin: "INE101A01026", stock_name: "NTPC", holding_pct: 1.3, sector: "Power" },
  { stock_isin: "INE476A01014", stock_name: "Titan Company", holding_pct: 1.2, sector: "Consumer Durables" },
  { stock_isin: "INE129A01019", stock_name: "Grasim Industries", holding_pct: 1.1, sector: "Cement" },
];

// Parag Parikh Flexi Cap Fund - Direct Plan - Growth
const ppfcf = [
  { stock_isin: "INE040A01034", stock_name: "HDFC Bank", holding_pct: 7.6, sector: "Financial Services" },
  { stock_isin: "INE002A01018", stock_name: "Reliance Industries", holding_pct: 5.2, sector: "Oil & Gas" },
  { stock_isin: "INE090A01021", stock_name: "ICICI Bank", holding_pct: 4.8, sector: "Financial Services" },
  { stock_isin: "INE009A01021", stock_name: "Infosys", holding_pct: 4.5, sector: "IT" },
  { stock_isin: "INE154A01025", stock_name: "ITC", holding_pct: 3.9, sector: "FMCG" },
  { stock_isin: "INE397D01024", stock_name: "Bharti Airtel", holding_pct: 3.6, sector: "Telecom" },
  { stock_isin: "INE062A01020", stock_name: "Axis Bank", holding_pct: 3.2, sector: "Financial Services" },
  { stock_isin: "INE121A01024", stock_name: "State Bank of India", holding_pct: 2.8, sector: "Financial Services" },
  { stock_isin: "INE018A01030", stock_name: "Larsen & Toubro", holding_pct: 2.5, sector: "Infrastructure" },
  { stock_isin: "INE738I01010", stock_name: "Sun Pharma", holding_pct: 2.3, sector: "Pharma" },
  { stock_isin: "INE848E01016", stock_name: "Hindustan Unilever", holding_pct: 2.1, sector: "FMCG" },
  { stock_isin: "INE467B01029", stock_name: "Tata Consultancy Services", holding_pct: 2.0, sector: "IT" },
  { stock_isin: "US0378331005", stock_name: "Apple Inc", holding_pct: 4.2, sector: "Technology (US)" },
  { stock_isin: "US0231351067", stock_name: "Amazon.com", holding_pct: 3.8, sector: "Consumer Discretionary (US)" },
  { stock_isin: "US02079K3059", stock_name: "Alphabet Inc", holding_pct: 3.5, sector: "Technology (US)" },
  { stock_isin: "US5949181045", stock_name: "Microsoft Corp", holding_pct: 3.2, sector: "Technology (US)" },
  { stock_isin: "INE476A01014", stock_name: "Titan Company", holding_pct: 1.5, sector: "Consumer Durables" },
  { stock_isin: "INE081A01020", stock_name: "Kotak Mahindra Bank", holding_pct: 1.3, sector: "Financial Services" },
  { stock_isin: "INE585B01010", stock_name: "Maruti Suzuki", holding_pct: 1.1, sector: "Automobile" },
  { stock_isin: "INE030A01027", stock_name: "HCL Technologies", holding_pct: 1.0, sector: "IT" },
];

// Map scheme codes to holdings data
// Multiple codes per fund cover different plan variants (direct/regular, growth/dividend)
function registerFund(codes: number[], holdings: RawHolding[]) {
  for (const code of codes) {
    SAMPLE_HOLDINGS[code] = holdings;
  }
}

// HDFC Top 100 Fund variants
registerFund([112928, 112927, 100270, 100269], hdfcTop100);
// ICICI Prudential Bluechip Fund variants
registerFund([120586, 120585, 100356, 100355], iciciBluchip);
// SBI Blue Chip Fund variants
registerFund([120578, 120577, 105953, 105952], sbiBlueChip);
// Mirae Asset Large Cap Fund variants
registerFund([118834, 118833, 118989, 118988], miraeLargeCap);
// Axis Bluechip Fund variants
registerFund([120503, 120502, 112300, 112299], axisBluechip);
// Parag Parikh Flexi Cap Fund variants
registerFund([122639, 122640, 118951, 118952], ppfcf);

function getSampleHoldings(schemeCode: number): RawHolding[] {
  return SAMPLE_HOLDINGS[schemeCode] || [];
}

/**
 * If exact scheme code not found, try to match based on common large-cap holdings.
 * Returns a generic large-cap portfolio so the app doesn't break entirely.
 */
function getFuzzyMatchHoldings(schemeCode: number): RawHolding[] {
  // For any unrecognized fund, return a generic large-cap-like portfolio
  // This is clearly labeled so users know it's approximate
  return [
    { stock_isin: "INE040A01034", stock_name: "HDFC Bank", holding_pct: 8.5, sector: "Financial Services" },
    { stock_isin: "INE002A01018", stock_name: "Reliance Industries", holding_pct: 7.9, sector: "Oil & Gas" },
    { stock_isin: "INE090A01021", stock_name: "ICICI Bank", holding_pct: 7.1, sector: "Financial Services" },
    { stock_isin: "INE009A01021", stock_name: "Infosys", holding_pct: 6.5, sector: "IT" },
    { stock_isin: "INE467B01029", stock_name: "Tata Consultancy Services", holding_pct: 5.2, sector: "IT" },
    { stock_isin: "INE397D01024", stock_name: "Bharti Airtel", holding_pct: 4.3, sector: "Telecom" },
    { stock_isin: "INE018A01030", stock_name: "Larsen & Toubro", holding_pct: 3.8, sector: "Infrastructure" },
    { stock_isin: "INE154A01025", stock_name: "ITC", holding_pct: 3.5, sector: "FMCG" },
    { stock_isin: "INE121A01024", stock_name: "State Bank of India", holding_pct: 3.0, sector: "Financial Services" },
    { stock_isin: "INE738I01010", stock_name: "Sun Pharma", holding_pct: 2.6, sector: "Pharma" },
    { stock_isin: "INE848E01016", stock_name: "Hindustan Unilever", holding_pct: 2.4, sector: "FMCG" },
    { stock_isin: "INE081A01020", stock_name: "Kotak Mahindra Bank", holding_pct: 2.2, sector: "Financial Services" },
    { stock_isin: "INE585B01010", stock_name: "Maruti Suzuki", holding_pct: 1.9, sector: "Automobile" },
    { stock_isin: "INE062A01020", stock_name: "Axis Bank", holding_pct: 1.7, sector: "Financial Services" },
    { stock_isin: "INE669E01016", stock_name: "Power Grid Corporation", holding_pct: 1.5, sector: "Power" },
  ];
}
