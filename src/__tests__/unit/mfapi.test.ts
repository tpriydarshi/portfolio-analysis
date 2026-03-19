import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchSchemes, getSchemeNav } from "@/lib/api/mfapi";

describe("mfapi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("searchSchemes", () => {
    it("returns empty array for short queries", async () => {
      const result = await searchSchemes("H");
      expect(result).toEqual([]);
    });

    it("returns empty array for empty query", async () => {
      const result = await searchSchemes("");
      expect(result).toEqual([]);
    });

    it("fetches and maps results from mfapi.in", async () => {
      const mockData = [
        { schemeCode: 119551, schemeName: "HDFC Top 100 Fund - Growth" },
        { schemeCode: 119552, schemeName: "HDFC Top 100 Fund - IDCW" },
      ];

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await searchSchemes("HDFC Top");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        schemeCode: 119551,
        schemeName: "HDFC Top 100 Fund - Growth",
      });
    });

    it("caps results at 50", async () => {
      const mockData = Array.from({ length: 100 }, (_, i) => ({
        schemeCode: i,
        schemeName: `Fund ${i}`,
      }));

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await searchSchemes("Fund");
      expect(result).toHaveLength(50);
    });

    it("throws on non-ok response", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(searchSchemes("HDFC")).rejects.toThrow("mfapi.in search failed: 500");
    });
  });

  describe("getSchemeNav", () => {
    it("fetches NAV data for a scheme code", async () => {
      const mockNav = { meta: { scheme_name: "Test" }, data: [{ nav: "100" }] };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNav),
      } as Response);

      const result = await getSchemeNav(119551);
      expect(result.meta.scheme_name).toBe("Test");
    });

    it("throws on non-ok response", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(getSchemeNav(999999)).rejects.toThrow("mfapi.in NAV fetch failed: 404");
    });
  });
});
