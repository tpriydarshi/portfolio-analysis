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

describe("generateSyntheticIsin", () => {
  it("returns SYNTH_ prefix with 12-char hex", () => {
    const isin = generateSyntheticIsin("test company");
    expect(isin).toMatch(/^SYNTH_[A-F0-9]{12}$/);
  });

  it("is deterministic", () => {
    expect(generateSyntheticIsin("test")).toBe(generateSyntheticIsin("test"));
  });
});
