"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[#acabaa] text-sm">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-[#000000] border-none text-[#e7e5e5] placeholder:text-[#767575] focus:ring-1 focus:ring-[#bac3ff]/40"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-[#acabaa] text-sm">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-[#000000] border-none text-[#e7e5e5] placeholder:text-[#767575] focus:ring-1 focus:ring-[#bac3ff]/40"
        />
      </div>
      {error && (
        <p className="text-sm text-[#ec7c8a]">{error}</p>
      )}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#2f3f92] to-[#4555a8] hover:from-[#3a4da0] hover:to-[#5060b5] text-[#c7cdff] font-medium rounded-md"
      >
        {loading ? "Signing in..." : "Sign in"}
      </Button>
      <p className="text-center text-sm text-[#9f9da1]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#bac3ff] hover:text-[#c7cdff]">
          Sign up
        </Link>
      </p>
    </form>
  );
}
