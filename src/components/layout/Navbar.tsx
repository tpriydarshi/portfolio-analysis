"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

export function Navbar() {
  const [user, setUser] = useState<{ email?: string; display_name?: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();
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

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="h-[72px] bg-[#191a1a]/80 backdrop-blur-[16px] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-heading italic text-[#e7e5e5] font-semibold text-lg tracking-tight">
              Portfolio X-Ray
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "text-[#e7e5e5] font-medium"
                      : "text-[#9f9da1] hover:text-[#acabaa]"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#4ade80] rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="User menu"
                className="h-8 w-8 rounded-md bg-[#2f3f92]/30 text-[#bac3ff] hover:bg-[#2f3f92]/50 flex items-center justify-center cursor-pointer transition-colors"
              >
                <User className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#191a1a] border-none shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
              >
                <div className="px-2 py-1.5">
                  <p className="text-xs text-[#9f9da1]">
                    {user.display_name || user.email}
                  </p>
                </div>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-[#acabaa] hover:text-[#e7e5e5] cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <span className="text-sm text-[#9f9da1] hover:text-[#e7e5e5] transition-colors">
                  Sign In
                </span>
              </Link>
              <Link href="/signup">
                <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0e0e0e] text-sm h-8 px-4 font-medium rounded-md">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
