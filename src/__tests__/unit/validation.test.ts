import { describe, it, expect } from "vitest";
import { portfolioSchema, fundEntrySchema } from "@/lib/validation/portfolio";

describe("fundEntrySchema", () => {
  it("accepts valid fund entry", () => {
    const result = fundEntrySchema.safeParse({
      schemeCode: 119551,
      schemeName: "HDFC Top 100 Fund",
      allocationPct: 50,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative scheme code", () => {
    const result = fundEntrySchema.safeParse({
      schemeCode: -1,
      schemeName: "Test",
      allocationPct: 50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero allocation", () => {
    const result = fundEntrySchema.safeParse({
      schemeCode: 100,
      schemeName: "Test",
      allocationPct: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects allocation over 100", () => {
    const result = fundEntrySchema.safeParse({
      schemeCode: 100,
      schemeName: "Test",
      allocationPct: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty scheme name", () => {
    const result = fundEntrySchema.safeParse({
      schemeCode: 100,
      schemeName: "",
      allocationPct: 50,
    });
    expect(result.success).toBe(false);
  });

  it("accepts fractional allocation", () => {
    const result = fundEntrySchema.safeParse({
      schemeCode: 100,
      schemeName: "Test",
      allocationPct: 33.33,
    });
    expect(result.success).toBe(true);
  });
});

describe("portfolioSchema", () => {
  const validFunds = [
    { schemeCode: 100, schemeName: "Fund A", allocationPct: 60 },
    { schemeCode: 200, schemeName: "Fund B", allocationPct: 40 },
  ];

  it("accepts valid portfolio", () => {
    const result = portfolioSchema.safeParse({
      name: "My Portfolio",
      funds: validFunds,
    });
    expect(result.success).toBe(true);
  });

  it("accepts portfolio with total value", () => {
    const result = portfolioSchema.safeParse({
      name: "My Portfolio",
      totalValueInr: 1000000,
      funds: validFunds,
    });
    expect(result.success).toBe(true);
  });

  it("accepts portfolio with null total value", () => {
    const result = portfolioSchema.safeParse({
      name: "My Portfolio",
      totalValueInr: null,
      funds: validFunds,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = portfolioSchema.safeParse({
      name: "",
      funds: validFunds,
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    const result = portfolioSchema.safeParse({
      name: "x".repeat(101),
      funds: validFunds,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative total value", () => {
    const result = portfolioSchema.safeParse({
      name: "Test",
      totalValueInr: -500,
      funds: validFunds,
    });
    expect(result.success).toBe(false);
  });

  it("rejects total value exceeding 1 trillion", () => {
    const result = portfolioSchema.safeParse({
      name: "Test",
      totalValueInr: 1e13,
      funds: validFunds,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty funds array", () => {
    const result = portfolioSchema.safeParse({
      name: "Test",
      funds: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects funds not summing to 100%", () => {
    const result = portfolioSchema.safeParse({
      name: "Test",
      funds: [
        { schemeCode: 100, schemeName: "A", allocationPct: 60 },
        { schemeCode: 200, schemeName: "B", allocationPct: 30 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts funds summing to exactly 100%", () => {
    const result = portfolioSchema.safeParse({
      name: "Test",
      funds: [
        { schemeCode: 100, schemeName: "A", allocationPct: 33.33 },
        { schemeCode: 200, schemeName: "B", allocationPct: 33.34 },
        { schemeCode: 300, schemeName: "C", allocationPct: 33.33 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts single fund at 100%", () => {
    const result = portfolioSchema.safeParse({
      name: "Test",
      funds: [{ schemeCode: 100, schemeName: "A", allocationPct: 100 }],
    });
    expect(result.success).toBe(true);
  });
});
