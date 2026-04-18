import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AmbientMesh } from "@/components/ambient-mesh";
import { SiteHeader } from "@/components/site-header";
import { getSiteUrl } from "@/lib/site";
import { SEO_SITE_NAME } from "@/lib/seo";

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
    default: `${SEO_SITE_NAME} — Search official IDF military footage`,
    template: `%s · ${SEO_SITE_NAME}`,
  },
  description:
    "Search thousands of indexed IDF spokesperson videos: filter by theater (Gaza, Lebanon, Judea & Samaria), opponent, footage type, domain, and posture. Stream CDN URLs or export CSV metadata.",
  applicationName: SEO_SITE_NAME,
  referrer: "strict-origin-when-cross-origin",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SEO_SITE_NAME,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SEO_SITE_NAME} — Official IDF video search`,
    description:
      "Browse and filter official Israel Defense Forces spokesperson footage with structured metadata for journalists and researchers.",
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
