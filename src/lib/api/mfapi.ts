export interface MFScheme {
  schemeCode: number;
  schemeName: string;
}

export async function searchSchemes(query: string): Promise<MFScheme[]> {
  if (!query || query.length < 2) return [];

  const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error(`mfapi.in search failed: ${res.status}`);
  }

  const data: Array<{ schemeCode: number; schemeName: string }> = await res.json();
  return data.slice(0, 50).map((d) => ({
    schemeCode: d.schemeCode,
    schemeName: d.schemeName,
  }));
}

export async function getSchemeNav(schemeCode: number) {
  const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
  if (!res.ok) {
    throw new Error(`mfapi.in NAV fetch failed: ${res.status}`);
  }
  return res.json();
}
