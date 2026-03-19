import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchHoldings } from "@/lib/api/rapidapi-holdings";

describe("fetchHoldings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("RAPIDAPI_KEY", "test-key");
    vi.stubEnv("RAPIDAPI_HOST", "test-host.rapidapi.com");
  });

  it("throws when API credentials are missing", async () => {
    vi.stubEnv("RAPIDAPI_KEY", "");
    vi.stubEnv("RAPIDAPI_HOST", "");

    await expect(fetchHoldings(119551)).rejects.toThrow(
      "RapidAPI credentials not configured"
    );
  });

  it("parses array response format", async () => {
    const mockData = [
      {
        isin: "INE001A01036",
        company_name: "HDFC Bank",
        corpus_per: "9.5",
        sector: "Financial Services",
      },
      {
        isin: "INE002A01018",
        company_name: "Reliance",
        corpus_per: "7.2",
        sector: "Oil & Gas",
      },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const result = await fetchHoldings(119551);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      stock_isin: "INE001A01036",
      stock_name: "HDFC Bank",
      holding_pct: 9.5,
      sector: "Financial Services",
    });
  });

  it("parses nested holdings response format", async () => {
    const mockData = {
      holdings: [
        {
          isin: "INE001A01036",
          company_name: "HDFC Bank",
          corpus_per: "9.5",
          sector: "Financial Services",
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const result = await fetchHoldings(119551);
    expect(result).toHaveLength(1);
    expect(result[0].stock_isin).toBe("INE001A01036");
  });

  it("throws on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response);

    await expect(fetchHoldings(119551)).rejects.toThrow(
      "RapidAPI holdings fetch failed: 429"
    );
  });

  it("sends correct headers", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    await fetchHoldings(119551);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://test-host.rapidapi.com/v1/scheme/119551/portfolio",
      {
        headers: {
          "x-rapidapi-key": "test-key",
          "x-rapidapi-host": "test-host.rapidapi.com",
        },
      }
    );
  });

  it("handles empty array response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    const result = await fetchHoldings(119551);
    expect(result).toHaveLength(0);
  });
});
