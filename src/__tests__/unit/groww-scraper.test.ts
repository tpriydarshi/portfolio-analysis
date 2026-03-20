import { describe, it, expect, vi, beforeEach } from "vitest";
import { findGrowwSlug, fetchGrowwHoldings } from "@/lib/api/groww/scraper";

describe("findGrowwSlug", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns slug when entity search returns matching results", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [
          {
            scheme_code: "122639",
            search_id: "parag-parikh-long-term-value-fund-direct-growth",
            id: "parag-parikh-long-term-value-fund-direct-growth",
            title: "Parag Parikh Flexi Cap Fund",
          },
        ],
      }),
    } as Response);

    const slug = await findGrowwSlug("Parag Parikh Flexi Cap Fund - Direct Plan - Growth", 122639);
    expect(slug).toBe("parag-parikh-long-term-value-fund-direct-growth");
  });

  it("returns slug matched by scheme code", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [
          {
            scheme_code: "999999",
            search_id: "wrong-fund",
            id: "wrong-fund",
            title: "Wrong Fund",
          },
          {
            scheme_code: "120586",
            search_id: "icici-pru-bluechip-direct-growth",
            id: "icici-pru-bluechip-direct-growth",
            title: "ICICI Prudential Bluechip Fund",
          },
        ],
      }),
    } as Response);

    const slug = await findGrowwSlug("ICICI Prudential Bluechip Fund", 120586);
    expect(slug).toBe("icici-pru-bluechip-direct-growth");
  });

  it("matches by name similarity when no scheme code match", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [
          {
            scheme_code: "111111",
            search_id: "totally-unrelated-fund-direct-growth",
            id: "totally-unrelated-fund-direct-growth",
            title: "Totally Unrelated Fund",
          },
          {
            scheme_code: "222222",
            search_id: "kotak-flexicap-direct-growth",
            id: "kotak-flexicap-direct-growth",
            title: "Kotak Flexicap",
          },
        ],
      }),
    } as Response);

    const slug = await findGrowwSlug("Kotak Flexicap Fund - Direct Plan - Growth");
    expect(slug).toBe("kotak-flexicap-direct-growth");
  });

  it("returns null when no results have sufficient name similarity", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [
          {
            scheme_code: "111111",
            search_id: "completely-different-fund",
            id: "completely-different-fund",
            title: "Completely Different Fund",
          },
        ],
      }),
    } as Response);

    const slug = await findGrowwSlug("Navi US Total Stock Market FoF");
    expect(slug).toBeNull();
  });

  it("returns null when search fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const slug = await findGrowwSlug("Some Fund");
    expect(slug).toBeNull();
  });

  it("returns null when search returns empty results", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [] }),
    } as Response);

    const slug = await findGrowwSlug("Nonexistent Fund");
    expect(slug).toBeNull();
  });

  it("returns null on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const slug = await findGrowwSlug("Some Fund");
    expect(slug).toBeNull();
  });
});

describe("fetchGrowwHoldings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed holdings from detail API tuple format", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        scheme_name: "HDFC Flexi Cap Fund Direct Growth",
        scheme_code: "118989",
        holdings: [
          ["118989", "2026-02-28", "HDFC Bank Ltd.", "EQ", "Financial", "Equity", null, "10379.18", "7.73", null, null, "hdfc-bank-ltd"],
          ["118989", "2026-02-28", "ICICI Bank Ltd.", "EQ", "Financial", "Equity", null, "6801.46", "5.07", null, null, "icici-bank-ltd"],
        ],
      }),
    } as Response);

    const holdings = await fetchGrowwHoldings("hdfc-flexi-cap-fund-direct-growth");
    expect(holdings).toHaveLength(2);
    expect(holdings[0]).toEqual({
      company_name: "HDFC Bank Ltd.",
      corpus_per: 7.73,
      sector_name: "Financial",
      stock_search_id: "hdfc-bank-ltd",
    });
    expect(holdings[1]).toEqual({
      company_name: "ICICI Bank Ltd.",
      corpus_per: 5.07,
      sector_name: "Financial",
      stock_search_id: "icici-bank-ltd",
    });
  });

  it("filters out holdings with missing name or zero percentage", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        holdings: [
          ["118989", "2026-02-28", "Valid Stock", "EQ", "Tech", "Equity", null, "100", "5.0", null, null, null],
          ["118989", "2026-02-28", "", "EQ", "Tech", "Equity", null, "100", "3.0", null, null, null],
          ["118989", "2026-02-28", "Zero Pct", "EQ", "Tech", "Equity", null, "0", "0", null, null, null],
        ],
      }),
    } as Response);

    const holdings = await fetchGrowwHoldings("some-slug");
    expect(holdings).toHaveLength(1);
    expect(holdings[0].company_name).toBe("Valid Stock");
  });

  it("returns empty array on API error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const holdings = await fetchGrowwHoldings("nonexistent-slug");
    expect(holdings).toEqual([]);
  });

  it("returns empty array on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const holdings = await fetchGrowwHoldings("some-slug");
    expect(holdings).toEqual([]);
  });
});
