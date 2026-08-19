import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Repo Atlas",
  description:
    "Paste a GitHub repo, get its architecture: every file classified into presentation, application, domain, infrastructure, and tooling layers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[#0a0a0a] font-sans text-[#ededed] antialiased">
        <header className="border-b border-[#1f1f1f]">
          <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-tight">repo-atlas</span>
              <span className="font-mono text-[11px] text-[#666]">architecture layers for any repo</span>
            </Link>
            <a
              href="https://github.com/tayden-b/repo-atlas"
              className="font-mono text-[11px] text-[#888] transition-colors hover:text-[#ededed]"
              target="_blank"
              rel="noreferrer"
            >
              github
            </a>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
