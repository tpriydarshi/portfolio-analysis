import { PortfolioForm } from "@/components/portfolio/PortfolioForm";

export const metadata = {
  title: "New Portfolio | Portfolio X-Ray",
};

export default function NewPortfolioPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">
          Create Portfolio
        </h1>
        <p className="text-sm text-[#8a8f98] mt-1">
          Add your mutual funds and their allocation percentages
        </p>
      </div>

      <div className="bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl p-6">
        <PortfolioForm />
      </div>
    </div>
  );
}
