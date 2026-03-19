"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, BarChart3 } from "lucide-react";

export function Navbar() {
  const [user, setUser] = useState<{ email?: string; display_name?: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          email: user.email,
          display_name: user.user_metadata?.display_name,
        });
      }
    });
  }, [supabase.auth]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="h-[72px] border-b border-[rgba(255,255,255,0.08)] bg-[#000212]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#5e6ad2]" />
          <span className="text-[#f7f8f8] font-semibold text-base tracking-tight">
            Portfolio X-Ray
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-[#b4bcd0] hover:text-[#f7f8f8] transition-colors"
          >
            Dashboard
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="h-8 w-8 rounded-full bg-[#5e6ad2]/20 text-[#5e6ad2] hover:bg-[#5e6ad2]/30 flex items-center justify-center cursor-pointer"
              >
                <User className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#0f1011] border-[rgba(255,255,255,0.08)]"
              >
                <div className="px-2 py-1.5">
                  <p className="text-xs text-[#8a8f98]">
                    {user.display_name || user.email}
                  </p>
                </div>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-[#b4bcd0] hover:text-[#f7f8f8] cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button className="bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white text-sm h-8 px-3">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
