"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FundSearchCombobox } from "./FundSearchCombobox";
import { FundAllocationList } from "./FundAllocationList";
import type { FundEntry } from "@/lib/validation/portfolio";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PortfolioFormProps {
  portfolioId?: string;
  initialName?: string;
  initialTotalValue?: number | null;
  initialFunds?: FundEntry[];
}

export function PortfolioForm({
  portfolioId,
  initialName = "",
  initialTotalValue = null,
  initialFunds = [],
}: PortfolioFormProps) {
  const [name, setName] = useState(initialName);
  const [totalValue, setTotalValue] = useState<string>(
    initialTotalValue ? String(initialTotalValue) : ""
  );
  const [funds, setFunds] = useState<FundEntry[]>(initialFunds);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function handleAddFund(scheme: { schemeCode: number; schemeName: string }) {
    if (funds.some((f) => f.schemeCode === scheme.schemeCode)) {
      toast.error("This fund is already added");
      return;
    }
    setFunds([...funds, { ...scheme, allocationPct: 0 }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const totalPct = funds.reduce((acc, f) => acc + f.allocationPct, 0);
    if (funds.length === 0) {
      toast.error("Add at least one fund");
      return;
    }
    if (Math.abs(totalPct - 100) >= 0.01) {
      toast.error("Fund allocations must sum to 100%");
      return;
    }
    if (!name.trim()) {
      toast.error("Portfolio name is required");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const totalValueInr = totalValue ? parseFloat(totalValue) : null;

      if (portfolioId) {
        // Update existing
        await supabase
          .from("portfolios")
          .update({
            name: name.trim(),
            total_value_inr: totalValueInr,
            updated_at: new Date().toISOString(),
          })
          .eq("id", portfolioId);

        // Delete old funds and re-insert
        await supabase
          .from("portfolio_funds")
          .delete()
          .eq("portfolio_id", portfolioId);

        await supabase.from("portfolio_funds").insert(
          funds.map((f) => ({
            portfolio_id: portfolioId,
            scheme_code: f.schemeCode,
            scheme_name: f.schemeName,
            allocation_pct: f.allocationPct,
          }))
        );

        toast.success("Portfolio updated");
        router.push(`/portfolio/${portfolioId}`);
      } else {
        // Create new
        const { data: portfolio, error } = await supabase
          .from("portfolios")
          .insert({
            user_id: user.id,
            name: name.trim(),
            total_value_inr: totalValueInr,
          })
          .select()
          .single();

        if (error || !portfolio) {
          throw new Error(error?.message || "Failed to create portfolio");
        }

        await supabase.from("portfolio_funds").insert(
          funds.map((f) => ({
            portfolio_id: portfolio.id,
            scheme_code: f.schemeCode,
            scheme_name: f.schemeName,
            allocation_pct: f.allocationPct,
          }))
        );

        toast.success("Portfolio created");
        router.push(`/portfolio/${portfolio.id}`);
      }

      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-[#b4bcd0] text-sm">
          Portfolio Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Investment Portfolio"
          required
          maxLength={100}
          className="bg-[#0a0a0b] border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder:text-[#8a8f98] focus:border-[#5e6ad2]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalValue" className="text-[#b4bcd0] text-sm">
          Total Portfolio Value (INR){" "}
          <span className="text-[#8a8f98]">- optional</span>
        </Label>
        <Input
          id="totalValue"
          type="number"
          value={totalValue}
          onChange={(e) => setTotalValue(e.target.value)}
          placeholder="e.g. 1000000"
          min={0}
          className="bg-[#0a0a0b] border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder:text-[#8a8f98] focus:border-[#5e6ad2] font-mono"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-[#b4bcd0] text-sm">Mutual Funds</Label>
        <FundSearchCombobox onSelect={handleAddFund} />
        <FundAllocationList funds={funds} onChange={setFunds} />
      </div>

      <Button
        type="submit"
        disabled={saving}
        className="w-full bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white font-medium"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : portfolioId ? (
          "Update Portfolio"
        ) : (
          "Create Portfolio"
        )}
      </Button>
    </form>
  );
}
