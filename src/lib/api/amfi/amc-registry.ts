/**
 * Registry of AMCs with their monthly portfolio disclosure Excel download URLs.
 * SEBI mandates all AMCs publish monthly portfolio holdings.
 *
 * URL patterns are derived from actual AMC website structures.
 * These may change — if downloads fail, update the patterns here.
 */

export interface AmcConfig {
  /** Short identifier */
  id: string;
  /** Full AMC name */
  name: string;
  /** Alternative name to search on mfapi.in (if different from AMC name) */
  searchName?: string;
  /**
   * Build download URLs for portfolio Excel files for a given month/year.
   * Some AMCs publish one file per scheme (returns multiple URLs),
   * others bundle all schemes in one file.
   */
  buildUrls: (month: number, year: number) => DownloadTarget[];
  /** Optional: parser hint if the AMC format deviates from standard */
  parserProfile?: "standard" | "merged-header" | "multi-sheet";
}

export interface DownloadTarget {
  /** URL to download */
  url: string;
  /** Human-readable label for logging */
  label: string;
  /** If true, file is .xls (old binary format) instead of .xlsx */
  isXls?: boolean;
}

function monthName(month: number): string {
  return [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][month - 1];
}

function monthNameShort(month: number): string {
  return monthName(month).substring(0, 3).toLowerCase();
}

function lastDayOfMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

/** HDFC uses per-scheme files on files.hdfcfund.com */
function hdfcUrls(month: number, year: number): DownloadTarget[] {
  const monthStr = monthName(month);
  const day = lastDayOfMonth(month, year);
  const dateStr = `${day} ${monthStr} ${year}`;
  // HDFC publishes files in the month AFTER the data month (e.g., Feb data in March folder)
  const publishMonth = month === 12 ? 1 : month + 1;
  const publishYear = month === 12 ? year + 1 : year;
  const yearMonth = `${publishYear}-${String(publishMonth).padStart(2, "0")}`;
  const base = `https://files.hdfcfund.com/s3fs-public/${yearMonth}`;

  const schemes = [
    "HDFC Top 100 Fund",
    "HDFC Flexi Cap Fund",
    "HDFC Mid-Cap Opportunities Fund",
    "HDFC Small Cap Fund",
    "HDFC Large and Mid Cap Fund",
    "HDFC Balanced Advantage Fund",
    "HDFC Index Fund - Nifty 50 Plan",
    "HDFC Nifty 50 Index Fund",
    "HDFC Multi Cap Fund",
    "HDFC Value Fund",
    "HDFC Dividend Yield Fund",
    "HDFC Infrastructure Fund",
    "HDFC Technology Fund",
  ];

  return schemes.map((s) => ({
    url: `${base}/Monthly%20${encodeURIComponent(s)}%20-%20${encodeURIComponent(dateStr)}.xlsx`,
    label: s,
  }));
}

/** PPFAS uses a single file per month */
function ppfasUrls(month: number, year: number): DownloadTarget[] {
  const monthStr = monthName(month);
  const day = lastDayOfMonth(month, year);
  // Recent files are .xls, older ones .xlsx — try .xls first
  return [
    {
      url: `https://amc.ppfas.com/downloads/portfolio-disclosure/${year}/PPFAS_Monthly_Portfolio_Report_${monthStr}_${String(day).padStart(2, "0")}_${year}.xls`,
      label: "PPFAS All Schemes",
      isXls: true,
    },
    {
      url: `https://amc.ppfas.com/downloads/portfolio-disclosure/${year}/PPFAS_Monthly_Portfolio_Report_${monthStr}_${String(day).padStart(2, "0")}_${year}.xlsx`,
      label: "PPFAS All Schemes (xlsx)",
    },
  ];
}

/**
 * All registered AMCs and their Excel download URL patterns.
 *
 * NOTE: AMC website URLs change periodically. If a download fails,
 * update the URL pattern here. The refresh script logs which AMCs fail.
 */
export const AMC_REGISTRY: AmcConfig[] = [
  {
    id: "hdfc",
    name: "HDFC Mutual Fund",
    buildUrls: hdfcUrls,
  },
  {
    id: "ppfas",
    name: "PPFAS Mutual Fund",
    searchName: "Parag Parikh",
    buildUrls: ppfasUrls,
  },
  // Additional AMCs can be added as their URL patterns are confirmed.
  // The architecture supports both per-scheme and bundled files.
  // To add an AMC: find their portfolio disclosure page, identify the
  // Excel download URL pattern, and add a buildUrls function.
];

/** Look up an AMC config by its ID */
export function getAmcById(id: string): AmcConfig | undefined {
  return AMC_REGISTRY.find((a) => a.id === id);
}

/** Get all AMC IDs */
export function getAllAmcIds(): string[] {
  return AMC_REGISTRY.map((a) => a.id);
}
