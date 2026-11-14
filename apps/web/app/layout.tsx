import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "VeriPoC | Smart-contract security evidence", template: "%s | VeriPoC" },
  description: "A shared smart-contract security workspace for DeFi teams and independent researchers using their own AI agents.",
  icons: { icon: "/brand/veripoc-app-icon.svg", apple: "/brand/veripoc-app-icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <a href="#main" className="skip-link focus-ring">Skip to content</a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
