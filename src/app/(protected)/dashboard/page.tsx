import { createClient } from "@/lib/supabase/server";
import {
  PortfolioCard,
  NewPortfolioCard,
} from "@/components/portfolio/PortfolioCard";
import type { Portfolio } from "@/types/database";

export const metadata = {
  title: "Dashboard | Portfolio X-Ray",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let portfolios: Portfolio[] = [];

  if (user) {
    const { data } = await supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    portfolios = (data as Portfolio[]) || [];
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">
          Your Portfolios
        </h1>
        <p className="text-sm text-[#8a8f98] mt-1">
          Manage and analyze your mutual fund portfolios
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolios.map((portfolio) => (
          <PortfolioCard key={portfolio.id} portfolio={portfolio} />
        ))}
        <NewPortfolioCard />
      </div>

      {portfolios.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-[#8a8f98] text-sm">
            No portfolios yet. Create your first one to get started.
          </p>
        </div>
      )}
    </div>
  );
}
