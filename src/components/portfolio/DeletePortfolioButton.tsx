"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DeletePortfolioButton({
  portfolioId,
}: {
  portfolioId: string;
}) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this portfolio?")) return;

    setDeleting(true);
    const supabase = createClient();

    try {
      await supabase
        .from("portfolio_funds")
        .delete()
        .eq("portfolio_id", portfolioId);

      await supabase.from("portfolios").delete().eq("id", portfolioId);

      toast.success("Portfolio deleted");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Failed to delete portfolio");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={deleting}
      className="text-[#8a8f98] hover:text-[#e5484d] hover:bg-[#e5484d]/10"
    >
      {deleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
