import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#000212]">
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#0f1011",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#f7f8f8",
            },
          }}
        />
      </body>
    </html>
  );
}
