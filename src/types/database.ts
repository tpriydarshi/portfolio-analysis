export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  total_value_inr: number | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioFund {
  id: string;
  portfolio_id: string;
  scheme_code: number;
  scheme_name: string;
  allocation_pct: number;
  created_at: string;
  updated_at: string;
}

export interface HoldingsCache {
  id: string;
  scheme_code: number;
  stock_isin: string;
  stock_name: string;
  holding_pct: number;
  sector: string | null;
  fetched_at: string;
}

export interface SchemeSearchCache {
  scheme_code: number;
  scheme_name: string;
  fund_house: string | null;
  cached_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      portfolios: {
        Row: Portfolio;
        Insert: Omit<Portfolio, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Portfolio, "id" | "user_id" | "created_at">>;
      };
      portfolio_funds: {
        Row: PortfolioFund;
        Insert: Omit<PortfolioFund, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PortfolioFund, "id" | "created_at">>;
      };
      holdings_cache: {
        Row: HoldingsCache;
        Insert: Omit<HoldingsCache, "id">;
        Update: Partial<Omit<HoldingsCache, "id">>;
      };
      scheme_search_cache: {
        Row: SchemeSearchCache;
        Insert: SchemeSearchCache;
        Update: Partial<SchemeSearchCache>;
      };
    };
  };
}
