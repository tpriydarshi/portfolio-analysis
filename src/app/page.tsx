import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Search,
  Layers,
  PieChart,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] flex flex-col">
      {/* Nav */}
      <nav className="h-[72px] bg-[#191a1a]/80 backdrop-blur-[16px] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <span className="font-heading italic text-[#e7e5e5] font-semibold text-lg tracking-tight">
            Portfolio X-Ray
          </span>
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#2f3f92]/15 via-[#bac3ff]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-[rgba(74,222,128,0.08)] rounded-md px-3 py-1 mb-6">
            <Zap className="h-3.5 w-3.5 text-[#4ade80]" />
            <span className="text-xs text-[#4ade80] font-medium uppercase tracking-wider">
              Indian Mutual Fund Analytics
            </span>
          </div>

          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-semibold text-[#e7e5e5] tracking-tight leading-[1.1] mb-6">
            Unmasking your
            <br className="hidden lg:block" />
            {" "}mutual fund
            <br className="hidden lg:block" />
            {" "}portfolio&apos;s{" "}
            <em className="text-[#4ade80]">true stock
            <br className="hidden lg:block" />
            {" "}exposure.</em>
          </h1>

          <p className="text-lg text-[#acabaa] max-w-2xl mb-8 leading-relaxed">
            Decode what you truly own. Beyond fund names lies a constellation of
            individual stocks — discover your actual concentration, overlap, and
            sector tilt across every rupee invested.
          </p>

          <div className="flex items-center gap-3">
            <Link href="/signup">
              <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0e0e0e] h-10 px-6 text-sm font-medium rounded-md">
                Analyze Your Portfolio
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-[#acabaa] hover:text-[#e7e5e5] h-10 px-6 text-sm"
              >
                Sign in
              </Button>
            </Link>
          </div>

          {/* Hero stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "94.2%", label: "Avg Coverage", sub: "of portfolio holdings" },
              { value: "52.8%", label: "Top 10 Concentration", sub: "across typical portfolios" },
              { value: "5000+", label: "Schemes Tracked", sub: "AMFI registered funds" },
              { value: "40+", label: "Fund Houses", sub: "complete AMC coverage" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[#131313] rounded-md p-5"
              >
                <p className="font-heading text-3xl font-semibold text-[#e7e5e5] mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-[#acabaa] font-medium uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-xs text-[#767575] mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stock Exposure Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold text-[#e7e5e5] tracking-tight mb-4">
                Stock Exposure
              </h2>
              <p className="text-[#acabaa] leading-relaxed mb-6">
                See every individual stock you hold across all mutual funds,
                weighted by your allocation. Know exactly which companies
                dominate your portfolio and at what true percentage.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#acabaa]">Top Holding</span>
                  <span className="font-heading text-lg text-[#e7e5e5] font-medium">HDFC Bank</span>
                </div>
                <div className="h-2 bg-[#131313] rounded-full overflow-hidden">
                  <div className="h-full bg-[#4ade80] rounded-full" style={{ width: "62%" }} />
                </div>
                <p className="text-xs text-[#767575]">6.4% of total portfolio</p>
              </div>
            </div>
            <div className="bg-[#131313] rounded-md p-6">
              {/* Decorative bar chart */}
              <p className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium mb-4">
                Exposure Heatmap
              </p>
              <div className="space-y-3">
                {[
                  { name: "Financial Services", pct: 35 },
                  { name: "Information Tech", pct: 25 },
                  { name: "Consumer Goods", pct: 19 },
                  { name: "Pharma & Health", pct: 12 },
                  { name: "Energy", pct: 9 },
                ].map((sector) => (
                  <div key={sector.name} className="flex items-center gap-3">
                    <span className="text-xs text-[#acabaa] w-32 shrink-0">{sector.name}</span>
                    <div className="flex-1 h-6 bg-[#0e0e0e] rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-[#4ade80]/80 rounded-sm"
                        style={{ width: `${sector.pct * 2.5}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-[#9f9da1] w-10 text-right">{sector.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detection of Invisible Redundancy */}
      <section className="py-20 px-6 bg-[#131313]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-[#e7e5e5] tracking-tight mb-4">
              Detection of Invisible
              <br />
              Redundancy.
            </h2>
            <p className="text-[#acabaa] leading-relaxed">
              Your &ldquo;diversified&rdquo; portfolio may not be as diversified as you think.
              When 3 of your funds hold HDFC Bank, your actual exposure is 3x
              what any single fund shows. We reveal these hidden overlaps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0e0e0e] rounded-md p-6">
              <p className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium mb-1">
                Hidden Overlap Score
              </p>
              <p className="font-heading text-5xl font-semibold text-[#4ade80] mb-2">62%</p>
              <p className="text-sm text-[#767575]">
                of stocks appear in 2+ funds
              </p>
            </div>
            <div className="bg-[#0e0e0e] rounded-md p-6">
              <p className="text-xs text-[#9f9da1] uppercase tracking-wider font-medium mb-1">
                Concentration Risk
              </p>
              <p className="font-heading text-5xl font-semibold text-[#facc15] mb-2">52.8%</p>
              <p className="text-sm text-[#767575]">
                held in top 10 stocks alone
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid — The Secure Architecture */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-[#e7e5e5] tracking-tight mb-3">
              The Secure Architecture
            </h2>
            <p className="text-[#9f9da1] max-w-xl mx-auto">
              Built on official AMFI data. No scraping. No approximations. Just
              the SEBI-mandated portfolio disclosures, parsed and analyzed.
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
                className="group bg-[#131313] rounded-md p-5 hover:bg-[#1f2020] transition-all duration-200"
              >
                <div className="h-9 w-9 rounded-md bg-[#2f3f92]/20 flex items-center justify-center mb-4 group-hover:bg-[#2f3f92]/30 transition-colors">
                  <feature.icon className="h-4 w-4 text-[#bac3ff]" />
                </div>
                <h3 className="text-sm font-medium text-[#e7e5e5] mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#9f9da1] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Quote + CTA */}
      <section className="py-20 px-6 bg-[#131313]">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="font-heading italic text-2xl md:text-3xl text-[#e7e5e5] leading-relaxed mb-8">
            &ldquo;True wealth management is no longer about
            accumulation, but about the artful precision of
            Transparency.&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0e0e0e] h-10 px-6 text-sm font-medium rounded-md">
                Start Analyzing Today
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
