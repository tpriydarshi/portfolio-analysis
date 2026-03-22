import { PortfolioForm } from "@/components/portfolio/PortfolioForm";
import Link from "next/link";

export const metadata = {
  title: "New Portfolio | Portfolio X-Ray",
};

export default function NewPortfolioPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-[#767575] uppercase tracking-wider mb-4">
          <Link href="/dashboard" className="hover:text-[#acabaa] transition-colors">
            Portfolios
          </Link>
          <span>&gt;</span>
          <span className="text-[#acabaa]">New</span>
        </div>
        <h1 className="font-heading text-3xl font-semibold text-[#e7e5e5] tracking-tight">
          Create Portfolio
        </h1>
        <p className="text-sm text-[#9f9da1] mt-1">
          Add your mutual funds and their allocation percentages
        </p>
      </div>

      <div className="bg-[#131313] rounded-md p-6">
        <PortfolioForm />
      </div>
    </div>
  );
}
