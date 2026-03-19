import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Search,
  Layers,
  PieChart,
  Shield,
  Zap,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#000212] flex flex-col">
      {/* Nav */}
      <nav className="h-[72px] border-b border-[rgba(255,255,255,0.08)] bg-[#000212]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#5e6ad2]" />
            <span className="text-[#f7f8f8] font-semibold text-base tracking-tight">
              Portfolio X-Ray
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-[#b4bcd0] hover:text-[#f7f8f8] text-sm"
              >
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white text-sm h-8 px-4">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        {/* Gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#5e6ad2]/20 via-[#5e6ad2]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[rgba(94,106,210,0.1)] border border-[rgba(94,106,210,0.2)] rounded-full px-3 py-1 mb-6">
            <Zap className="h-3.5 w-3.5 text-[#5e6ad2]" />
            <span className="text-xs text-[#5e6ad2] font-medium">
              Indian Mutual Fund Analytics
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-[#f7f8f8] tracking-tight leading-[1.1] mb-6">
            See through your
            <br />
            <span className="bg-gradient-to-r from-[#5e6ad2] to-[#8b5cf6] bg-clip-text text-transparent">
              mutual fund portfolio
            </span>
          </h1>

          <p className="text-lg text-[#b4bcd0] max-w-2xl mx-auto mb-8 leading-relaxed">
            Discover your true stock exposure across all your mutual funds.
            Know exactly which companies you own and how concentrated your
            portfolio really is.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button className="bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white h-10 px-6 text-sm font-medium">
                Analyze your portfolio
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-[#b4bcd0] hover:text-[#f7f8f8] h-10 px-6 text-sm border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]"
              >
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-[#f7f8f8] tracking-tight mb-3">
              Data to enhance your intuition
            </h2>
            <p className="text-[#8a8f98] max-w-xl mx-auto">
              Go beyond fund names. Understand what you actually own.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Search,
                title: "Stock Exposure",
                description:
                  "See every stock you own across all funds, weighted by your allocation. Know your true exposure.",
              },
              {
                icon: Layers,
                title: "Fund Overlap Detection",
                description:
                  "Discover which stocks appear in multiple funds. Avoid unintentional concentration risk.",
              },
              {
                icon: PieChart,
                title: "Sector Breakdown",
                description:
                  "Understand your sector allocation across the entire portfolio. Spot overweight areas.",
              },
              {
                icon: BarChart3,
                title: "Concentration Analysis",
                description:
                  "See how concentrated your portfolio is in top holdings. Measure your diversification.",
              },
              {
                icon: Shield,
                title: "Risk Insight",
                description:
                  "Identify single-stock risk that spans multiple funds. Know your true risk exposure.",
              },
              {
                icon: Zap,
                title: "INR Breakdown",
                description:
                  "Enter your portfolio value and see exact rupee amounts for every stock holding.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 hover:border-[rgba(255,255,255,0.15)] transition-all duration-200"
              >
                <div className="h-9 w-9 rounded-lg bg-[#5e6ad2]/10 flex items-center justify-center mb-4 group-hover:bg-[#5e6ad2]/20 transition-colors">
                  <feature.icon className="h-4 w-4 text-[#5e6ad2]" />
                </div>
                <h3 className="text-sm font-medium text-[#f7f8f8] mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#8a8f98] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-t border-b border-[rgba(255,255,255,0.08)]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "5000+", label: "Mutual Fund Schemes" },
              { value: "1500+", label: "Stocks Tracked" },
              { value: "40+", label: "Fund Houses" },
              { value: "100%", label: "Free to Use" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-semibold text-[#f7f8f8] font-mono mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-[#8a8f98]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-[#f7f8f8] tracking-tight mb-3">
            Start analyzing today
          </h2>
          <p className="text-[#8a8f98] mb-6">
            Enter your mutual funds, set allocation percentages, and get instant
            insights into your stock-level exposure.
          </p>
          <Link href="/signup">
            <Button className="bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white h-10 px-6 text-sm font-medium">
              Create your free account
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
