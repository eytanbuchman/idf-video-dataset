import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { getSiteUrl } from "@/lib/site";

const display = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans-body",
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "IDF Video Dataset",
    template: "%s · IDF Video Dataset",
  },
  description:
    "Searchable catalog of IDF Spokesperson video releases: filter by theater, opponent, and footage type. Stream from official CDN or export metadata as CSV.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "IDF Video Dataset",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "IDF Video Dataset",
    description:
      "Browse and search IDF Spokesperson video releases with filters and CSV export.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)]">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-12">
          {children}
        </main>
        <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-[var(--muted)]">
          <p>
            Metadata from public Telegram releases; video streams served from
            official Azure CDN endpoints.
          </p>
        </footer>
      </body>
    </html>
  );
}
