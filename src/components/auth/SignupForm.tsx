"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
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
        <Label htmlFor="displayName" className="text-[#b4bcd0] text-sm">
          Display Name
        </Label>
        <Input
          id="displayName"
          type="text"
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="bg-[#0a0a0b] border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder:text-[#8a8f98] focus:border-[#5e6ad2] focus:ring-[#5e6ad2]/20"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[#b4bcd0] text-sm">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-[#0a0a0b] border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder:text-[#8a8f98] focus:border-[#5e6ad2] focus:ring-[#5e6ad2]/20"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-[#b4bcd0] text-sm">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Min 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="bg-[#0a0a0b] border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder:text-[#8a8f98] focus:border-[#5e6ad2] focus:ring-[#5e6ad2]/20"
        />
      </div>
      {error && (
        <p className="text-sm text-[#e5484d]">{error}</p>
      )}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white font-medium"
      >
        {loading ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-center text-sm text-[#8a8f98]">
        Already have an account?{" "}
        <Link href="/login" className="text-[#5e6ad2] hover:text-[#6e7ae2]">
          Sign in
        </Link>
      </p>
    </form>
  );
}
