import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Portfolio X-Ray | Mutual Fund Stock Exposure Analysis",
  description:
    "Analyze your Indian mutual fund portfolio to discover your true stock exposure across all funds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0e0e0e]">
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#191a1a",
              border: "none",
              color: "#e7e5e5",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
            },
          }}
        />
      </body>
    </html>
  );
}
