import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AmbientMesh } from "@/components/ambient-mesh";
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
    "Search the IDF video database: filter by theater, opponent, and footage type. Stream from official CDN or export metadata as CSV.",
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
      "Find official IDF spokesperson footage and metadata for research and reporting.",
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
      <body className="relative min-h-full flex flex-col">
        <AmbientMesh />
        <SiteHeader />
        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-12 sm:px-6 sm:py-12 md:py-14">
          {children}
        </main>
        <footer className="relative z-10 border-t border-[var(--border)] px-4 py-12 text-center sm:px-6">
          <p className="mx-auto max-w-lg text-[12px] leading-relaxed text-[var(--muted)]">
            Built for people who need to locate official footage and metadata
            to use responsibly. Video streams come from public CDN endpoints;
            always verify context at the source.
          </p>
          <p className="mt-4">
            <a
              href="https://www.idf.il/en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-[var(--accent)] underline-offset-4 transition hover:underline"
            >
              IDF website — idf.il/en
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
