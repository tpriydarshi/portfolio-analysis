"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

interface SchemeResult {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
}

interface FundSearchComboboxProps {
  onSelect: (scheme: { schemeCode: number; schemeName: string }) => void;
}

export function FundSearchCombobox({ onSelect }: FundSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SchemeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(value: string) {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/schemes/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setResults(data);
          setOpen(true);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(scheme: SchemeResult) {
    onSelect({
      schemeCode: scheme.schemeCode,
      schemeName: scheme.schemeName,
    });
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8f98]" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search mutual funds..."
          className="pl-9 bg-[#0a0a0b] border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder:text-[#8a8f98] focus:border-[#5e6ad2]"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8f98] animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-lg shadow-xl">
          {results.map((scheme) => (
            <button
              key={scheme.schemeCode}
              onClick={() => handleSelect(scheme)}
              className="w-full text-left px-3 py-2.5 hover:bg-[rgba(255,255,255,0.04)] transition-colors border-b border-[rgba(255,255,255,0.04)] last:border-b-0"
            >
              <p className="text-sm text-[#f7f8f8] leading-snug">
                {scheme.schemeName}
              </p>
              <p className="text-xs text-[#8a8f98] mt-0.5">
                Code: {scheme.schemeCode}
              </p>
            </button>
          ))}
        </div>
      )}

      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-lg p-4 text-center">
          <p className="text-sm text-[#8a8f98]">No schemes found</p>
        </div>
      )}
    </div>
  );
}
