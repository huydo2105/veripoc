import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "VeriPoC | Smart-contract security evidence", template: "%s | VeriPoC" },
  description: "A shared smart-contract security workspace for DeFi teams and independent researchers using their own AI agents.",
  icons: { icon: "/brand/veripoc-app-icon.svg", apple: "/brand/veripoc-app-icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <a href="#main" className="skip-link focus-ring">Skip to content</a>
        <SiteHeader />
        {children}
        <footer className="border-t border-line text-sm text-muted">
          <div className="mx-auto flex w-full max-w-[1160px] flex-wrap justify-between gap-2 px-5 py-6 md:px-6">
            <span>VeriPoC</span><span>Local demo · No automatic audit certification or bounty decision</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
