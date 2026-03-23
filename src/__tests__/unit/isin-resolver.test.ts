import { describe, it, expect } from "vitest";
import {
  normalizeStockName,
  resolveIsin,
  generateSyntheticIsin,
} from "@/lib/api/groww/isin-resolver";

describe("normalizeStockName", () => {
  it("strips Ltd and Limited", () => {
    expect(normalizeStockName("HDFC Bank Ltd")).toBe("hdfc bank");
    expect(normalizeStockName("Infosys Limited")).toBe("infosys");
  });

  it("strips Corp, Inc, and Co", () => {
    expect(normalizeStockName("Tata Corp.")).toBe("tata");
    expect(normalizeStockName("Apple Inc")).toBe("apple");
  });

  it("strips punctuation and collapses whitespace", () => {
    expect(normalizeStockName("Dr. Reddy's Laboratories")).toBe(
      "dr reddy s laboratories"
    );
  });

  it("handles already-clean names", () => {
    expect(normalizeStockName("reliance industries")).toBe(
      "reliance industries"
    );
  });
});

describe("resolveIsin", () => {
  const lookup = new Map<string, string>([
    ["hdfc bank", "INE040A01034"],
    ["infosys", "INE009A01021"],
    ["reliance industries", "INE002A01018"],
  ]);

  it("resolves exact normalized match", () => {
    expect(resolveIsin("HDFC Bank Ltd", lookup)).toBe("INE040A01034");
    expect(resolveIsin("Infosys Limited", lookup)).toBe("INE009A01021");
  });

  it("resolves prefix match", () => {
    // "reliance industries" is in lookup; "Reliance Industries Ltd" normalizes
    // to "reliance industries" which is an exact match
    expect(resolveIsin("Reliance Industries Ltd", lookup)).toBe("INE002A01018");
  });

  it("generates synthetic ISIN for unmatched stocks", () => {
    const isin = resolveIsin("Unknown Company XYZ", lookup);
    expect(isin).toMatch(/^SYNTH_[A-F0-9]{12}$/);
  });

  it("generates deterministic synthetic ISINs", () => {
    const isin1 = resolveIsin("Unknown Company XYZ", lookup);
    const isin2 = resolveIsin("Unknown Company XYZ", lookup);
    expect(isin1).toBe(isin2);
  });

  it("generates different ISINs for different names", () => {
    const isin1 = resolveIsin("Company A", lookup);
    const isin2 = resolveIsin("Company B", lookup);
    expect(isin1).not.toBe(isin2);
  });
});

describe("resolveIsin – ambiguous Indian company names (prefix-match bug)", () => {
  /**
   * Helper: build a lookup Map from [stockName, isin] pairs,
   * normalizing keys the same way buildIsinLookup does.
   */
  function makeLookup(entries: [string, string][]): Map<string, string> {
    const m = new Map<string, string>();
    for (const [name, isin] of entries) {
      const key = normalizeStockName(name);
      if (!m.has(key)) m.set(key, isin);
    }
    return m;
  }

  const ambiguousLookup = makeLookup([
    ["HDFC Bank Ltd", "INE040A01034"],
    ["HDFC Life Insurance Co Ltd", "INE795G01014"],
    ["HDFC Asset Management Co Ltd", "INE127D01025"],
    ["Reliance Industries Ltd", "INE002A01018"],
    ["Reliance Power Ltd", "INE614G01033"],
    ["Reliance Infrastructure Ltd", "INE036A01016"],
    ["Tata Motors Ltd", "INE155A01022"],
    ["Tata Steel Ltd", "INE081A01020"],
    ["Tata Power Co Ltd", "INE245A01021"],
    ["Bajaj Finance Ltd", "INE296A01024"],
    ["Bajaj Finserv Ltd", "INE918I01018"],
  ]);

  it("does NOT cross-match HDFC Bank with HDFC Life", () => {
    expect(resolveIsin("HDFC Bank Ltd", ambiguousLookup)).toBe("INE040A01034");
  });

  it("does NOT cross-match Reliance Industries with Reliance Power", () => {
    expect(resolveIsin("Reliance Industries", ambiguousLookup)).toBe(
      "INE002A01018"
    );
  });

  it("does NOT cross-match Tata Motors with Tata Steel", () => {
    expect(resolveIsin("Tata Motors", ambiguousLookup)).toBe("INE155A01022");
  });

  it("returns synthetic ISIN for short ambiguous prefix 'HDFC'", () => {
    // "hdfc" is only 4 chars — too short for fuzzy match, should fall through
    expect(resolveIsin("HDFC", ambiguousLookup)).toMatch(/^SYNTH_/);
  });

  it("returns synthetic ISIN for 'Reliance' alone (ambiguous)", () => {
    expect(resolveIsin("Reliance", ambiguousLookup)).toMatch(/^SYNTH_/);
  });

  it("returns synthetic ISIN for 'Tata' alone (ambiguous)", () => {
    expect(resolveIsin("Tata", ambiguousLookup)).toMatch(/^SYNTH_/);
  });

  it("does NOT cross-match Bajaj Finance with Bajaj Finserv", () => {
    expect(resolveIsin("Bajaj Finance", ambiguousLookup)).toBe("INE296A01024");
  });

  it("still matches close variations when overlap >= 80%", () => {
    // "tata consultancy services" exactly matches after normalization
    const tcsLookup = makeLookup([
      ["Tata Consultancy Services Ltd", "INE467B01029"],
    ]);
    expect(resolveIsin("Tata Consultancy Services", tcsLookup)).toBe(
      "INE467B01029"
    );
  });
});

describe("generateSyntheticIsin", () => {
  it("returns SYNTH_ prefix with 12-char hex", () => {
    const isin = generateSyntheticIsin("test company");
    expect(isin).toMatch(/^SYNTH_[A-F0-9]{12}$/);
  });

  it("is deterministic", () => {
    expect(generateSyntheticIsin("test")).toBe(generateSyntheticIsin("test"));
  });
});
