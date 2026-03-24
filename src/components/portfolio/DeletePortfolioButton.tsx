"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DeletePortfolioButton({
  portfolioId,
}: {
  portfolioId: string;
}) {
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();

    try {
      await supabase
        .from("portfolio_funds")
        .delete()
        .eq("portfolio_id", portfolioId);

      await supabase.from("portfolios").delete().eq("id", portfolioId);

      toast.success("Portfolio deleted");
      setOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Failed to delete portfolio");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete portfolio"
            className="text-[#9f9da1] hover:text-[#ec7c8a] hover:bg-[#ec7c8a]/10"
          />
        }
      >
        <Trash2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="bg-[#191a1a] border border-[rgba(255,255,255,0.08)] text-[#e7e5e5] sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-[#e7e5e5]">
            Delete Portfolio
          </DialogTitle>
          <DialogDescription className="text-[#9f9da1]">
            This action cannot be undone. All funds and analysis data will be
            permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-transparent border-t-0 mt-2 sm:flex-row sm:justify-end gap-2">
          <DialogClose
            render={
              <Button
                variant="ghost"
                className="text-[#9f9da1] hover:text-[#e7e5e5] hover:bg-[rgba(255,255,255,0.06)]"
              />
            }
          >
            Cancel
          </DialogClose>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-[#ec7c8a] hover:bg-[#e5484d] text-white font-medium"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
