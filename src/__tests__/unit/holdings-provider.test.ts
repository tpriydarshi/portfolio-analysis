import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchHoldingsWithFallback } from "@/lib/api/holdings-provider";

// Mock the groww module so we can control the fallback behavior
vi.mock("@/lib/api/groww", () => ({
  fetchHoldingsFromGroww: vi.fn().mockResolvedValue([]),
}));

import { fetchHoldingsFromGroww } from "@/lib/api/groww";

describe("fetchHoldingsWithFallback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Re-mock after restoreAllMocks
    vi.mocked(fetchHoldingsFromGroww).mockResolvedValue([]);
  });

  it("returns empty array instead of throwing for unknown schemes", async () => {
    // Mock fetch to simulate mfapi.in returning no data
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    // Should NOT throw — should return empty array gracefully
    const result = await fetchHoldingsWithFallback(999999);
    expect(result).toEqual([]);
  });

  it("returns empty array when AMFI fetch fails with network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const result = await fetchHoldingsWithFallback(999999);
    expect(result).toEqual([]);
  });

  it("falls back to Groww when AMFI returns no data", async () => {
    const mockHoldings = [
      { stock_isin: "INE040A01034", stock_name: "HDFC Bank Ltd", holding_pct: 8.5, sector: "Banking" },
      { stock_isin: "INE009A01021", stock_name: "Infosys Ltd", holding_pct: 6.2, sector: "IT" },
    ];

    // First call: mfapi.in returns scheme name
    // Second+ calls: AMFI Excel download fails
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // mfapi.in scheme name lookup (called by both AMFI path and Groww path)
    fetchSpy.mockImplementation(async (url) => {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (urlStr.includes("api.mfapi.in")) {
        return {
          ok: true,
          json: async () => ({
            meta: { scheme_name: "Some Test Fund - Direct Plan - Growth" },
          }),
        } as Response;
      }
      // All other fetches fail (AMFI Excel downloads)
      return { ok: false, status: 404 } as Response;
    });

    // Groww fallback returns holdings
    vi.mocked(fetchHoldingsFromGroww).mockResolvedValueOnce(mockHoldings);

    const result = await fetchHoldingsWithFallback(999999);
    expect(result).toEqual(mockHoldings);
    expect(fetchHoldingsFromGroww).toHaveBeenCalledWith(
      999999,
      "Some Test Fund - Direct Plan - Growth"
    );
  });
});
