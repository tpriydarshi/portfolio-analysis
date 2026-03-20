/**
 * Maps between mfapi.in scheme codes and scheme names found in AMC Excel files.
 *
 * Uses a combination of:
 * 1. Hand-curated mappings for popular schemes (most reliable)
 * 2. Fuzzy string matching as a fallback
 */

/**
 * Hand-curated mapping: mfapi.in scheme code → expected scheme name substring in Excel.
 * The value should be distinctive enough to uniquely match within the AMC's file.
 */
const SCHEME_CODE_TO_EXCEL_NAME: Record<number, { amcId: string; pattern: string }> = {
  // HDFC
  112928: { amcId: "hdfc", pattern: "HDFC Top 100 Fund - Direct Plan" },
  112927: { amcId: "hdfc", pattern: "HDFC Top 100 Fund" },
  119062: { amcId: "hdfc", pattern: "HDFC Mid-Cap Opportunities Fund - Direct Plan" },
  118989: { amcId: "hdfc", pattern: "HDFC Flexi Cap Fund - Direct Plan" },
  112929: { amcId: "hdfc", pattern: "HDFC Large and Mid Cap Fund - Direct Plan" },
  112926: { amcId: "hdfc", pattern: "HDFC Small Cap Fund - Direct Plan" },

  // ICICI Prudential
  120586: { amcId: "icici", pattern: "ICICI Prudential Bluechip Fund - Direct Plan" },
  120585: { amcId: "icici", pattern: "ICICI Prudential Bluechip Fund" },
  120594: { amcId: "icici", pattern: "ICICI Prudential Value Discovery Fund - Direct Plan" },
  120553: { amcId: "icici", pattern: "ICICI Prudential Flexicap Fund - Direct Plan" },

  // SBI
  120578: { amcId: "sbi", pattern: "SBI Blue Chip Fund - Direct Plan" },
  120577: { amcId: "sbi", pattern: "SBI Blue Chip Fund" },
  119766: { amcId: "sbi", pattern: "SBI Small Cap Fund - Direct Plan" },
  120505: { amcId: "sbi", pattern: "SBI Focused Equity Fund - Direct Plan" },

  // Mirae Asset
  118834: { amcId: "mirae", pattern: "Mirae Asset Large Cap Fund - Direct Plan" },
  118833: { amcId: "mirae", pattern: "Mirae Asset Large Cap Fund" },
  118836: { amcId: "mirae", pattern: "Mirae Asset Flexi Cap Fund - Direct Plan" },

  // Axis
  120503: { amcId: "axis", pattern: "Axis Bluechip Fund - Direct Plan" },
  120502: { amcId: "axis", pattern: "Axis Bluechip Fund" },
  120468: { amcId: "axis", pattern: "Axis Midcap Fund - Direct Plan" },
  120507: { amcId: "axis", pattern: "Axis Small Cap Fund - Direct Plan" },
  120465: { amcId: "axis", pattern: "Axis Flexi Cap Fund - Direct Plan" },

  // PPFAS
  122639: { amcId: "ppfas", pattern: "Parag Parikh Flexi Cap Fund - Direct Plan" },
  122640: { amcId: "ppfas", pattern: "Parag Parikh Flexi Cap Fund" },

  // UTI
  120552: { amcId: "uti", pattern: "UTI Flexi Cap Fund - Direct Plan" },
  119717: { amcId: "uti", pattern: "UTI Nifty 50 Index Fund - Direct Plan" },

  // Kotak
  120200: { amcId: "kotak", pattern: "Kotak Flexicap Fund - Direct Plan" },
  120166: { amcId: "kotak", pattern: "Kotak Bluechip Fund - Direct Plan" },
  120175: { amcId: "kotak", pattern: "Kotak Emerging Equity Fund - Direct Plan" },
  120182: { amcId: "kotak", pattern: "Kotak Small Cap Fund - Direct Plan" },

  // Motilal Oswal
  118760: { amcId: "motilal", pattern: "Motilal Oswal Flexi Cap Fund - Direct Plan" },
  119770: { amcId: "motilal", pattern: "Motilal Oswal Midcap Fund - Direct Plan" },
};

/**
 * Look up the AMC ID for a given scheme code from the curated mapping.
 */
export function getAmcIdForScheme(schemeCode: number): string | undefined {
  return SCHEME_CODE_TO_EXCEL_NAME[schemeCode]?.amcId;
}

/**
 * Find the best matching scheme name in parsed Excel data for a given scheme code.
 *
 * @param schemeCode - mfapi.in scheme code
 * @param parsedSchemes - Map of scheme names from parsed Excel
 * @param schemeName - Optional scheme name from mfapi.in for fuzzy matching
 * @returns The matching scheme name key from parsedSchemes, or null
 */
export function findMatchingScheme(
  schemeCode: number,
  parsedSchemes: Map<string, unknown>,
  schemeName?: string
): string | null {
  const schemeNames = Array.from(parsedSchemes.keys());
  if (schemeNames.length === 0) return null;

  // Strategy 1: Use curated mapping
  const curated = SCHEME_CODE_TO_EXCEL_NAME[schemeCode];
  if (curated) {
    const match = schemeNames.find((name) =>
      normalize(name).includes(normalize(curated.pattern))
    );
    if (match) return match;
  }

  // Strategy 2: Fuzzy match using scheme name from mfapi.in
  if (schemeName) {
    const normalizedTarget = normalize(schemeName);
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const excelName of schemeNames) {
      const score = similarityScore(normalizedTarget, normalize(excelName));
      if (score > bestScore && score > 0.5) {
        bestScore = score;
        bestMatch = excelName;
      }
    }

    if (bestMatch) return bestMatch;
  }

  return null;
}

/**
 * Normalize a scheme name for comparison:
 * strip common suffixes, lowercase, collapse whitespace
 */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-–—]/g, " ")
    .replace(
      /\b(direct|regular|plan|growth|option|dividend|idcw|payout|reinvestment)\b/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Simple word-overlap similarity score between two normalized strings.
 * Returns a value between 0 and 1.
 */
function similarityScore(a: string, b: string): number {
  const wordsA = new Set(a.split(" ").filter((w) => w.length > 2));
  const wordsB = new Set(b.split(" ").filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }

  return overlap / Math.max(wordsA.size, wordsB.size);
}
