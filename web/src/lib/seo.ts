import type { Metadata } from "next";
import { AXES } from "./axes-config";
import type { LibraryStats } from "./videos";
import { getSiteUrl } from "./site";

/** Public-facing site name (matches the home H1 / brand). */
export const SEO_SITE_NAME = "IDF Military Footage Database";

export function absoluteUrl(path: string): string {
  const base = getSiteUrl().origin;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Trim and ellipsize for meta descriptions (aim ~150–160 chars). */
export function clampMetaDescription(text: string, max = 158): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

const BASE_KEYWORDS: string[] = [
  "IDF",
  "Israel Defense Forces",
  "military footage",
  "official video",
  "Israel spokesperson",
];

export function homeMetadata(input: {
  total: number;
  dateMin: string | null;
  dateMax: string | null;
}): Metadata {
  const { total, dateMin, dateMax } = input;
  const range =
    dateMin && dateMax
      ? ` Coverage from ${dateMin.slice(0, 10)} through ${dateMax.slice(0, 10)}.`
      : "";

  const title = `${SEO_SITE_NAME} — Search official IDF video`;
  const description = clampMetaDescription(
    `Filter ${total.toLocaleString("en-US")} indexed IDF spokesperson clips by theater, opponent, footage kind, domain (air, ground, sea), and posture. Stream public CDN URLs or export metadata as CSV.${range}`,
  );
  const url = absoluteUrl("/");

  return {
    title,
    description,
    keywords: [...BASE_KEYWORDS, "Gaza", "Lebanon", "West Bank", "CSV export"],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      title,
      description,
      siteName: SEO_SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export function browseIndexMetadata(stats: LibraryStats): Metadata {
  const facetCount = AXES.length;
  const tagCount = AXES.reduce((n, a) => n + stats.by[a].length, 0);
  const title = `Browse categories — ${SEO_SITE_NAME}`;
  const description = clampMetaDescription(
    `${stats.total.toLocaleString("en-US")} clips · ${tagCount} tags across ${facetCount} axes (theater, opponent, kind, domain, posture). Pillar pages with clip counts and deep links for journalists and researchers.`,
  );
  const url = absoluteUrl("/browse");
  return {
    title,
    description,
    keywords: [...BASE_KEYWORDS, "browse", "categories", "filters"],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: SEO_SITE_NAME,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export function axisHubMetadata(axisLabel: string, axisSlug: string, valueCount: number): Metadata {
  const title = `${axisLabel} — categories`;
  const description = clampMetaDescription(
    `${valueCount} ${axisLabel.toLowerCase()} labels in the ${SEO_SITE_NAME}. Jump to a category to see every matching clip and metadata — Gaza, Lebanon, air ops, humanitarian drops, and more.`,
  );
  const url = absoluteUrl(`/browse/${axisSlug}`);
  return {
    title,
    description,
    keywords: [...BASE_KEYWORDS, axisLabel, axisSlug],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${axisLabel} | ${SEO_SITE_NAME}`,
      description,
      siteName: SEO_SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: `${axisLabel} | ${SEO_SITE_NAME}`,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export function categoryMetadata(input: {
  /** e.g. /browse/theater/gaza */
  pathname: string;
  /** Page H1 / category label */
  label: string;
  /** Axis display name (Theater, Opponent, …) */
  axisLabel: string;
  clipCount: number;
  /** Curated intro from DB or fallback */
  intro: string;
}): Metadata {
  const { pathname, label, axisLabel, clipCount, intro } = input;
  const url = absoluteUrl(pathname);

  const longDesc = clampMetaDescription(
    `${clipCount.toLocaleString("en-US")} IDF video clips tagged “${label}” under ${axisLabel}. ${intro}`,
  );
  const shortTitle = `${label} (${axisLabel})`;

  return {
    title: shortTitle,
    description: longDesc,
    keywords: [
      ...BASE_KEYWORDS,
      label,
      axisLabel,
      "video library",
      "Israel military",
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${shortTitle} | ${SEO_SITE_NAME}`,
      description: longDesc,
      siteName: SEO_SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: `${shortTitle} | ${SEO_SITE_NAME}`,
      description: longDesc,
    },
    robots: { index: true, follow: true },
  };
}

export function videoMetadata(input: {
  pathname: string;
  messageExcerpt: string;
  theater: string;
  kind: string;
  date: string;
}): Metadata {
  const { pathname, messageExcerpt, theater, kind, date } = input;
  const url = absoluteUrl(pathname);
  const baseTitle =
    messageExcerpt.length > 70
      ? `${messageExcerpt.slice(0, 67).trimEnd()}…`
      : messageExcerpt;
  const title = baseTitle || "IDF video clip";
  const description = clampMetaDescription(
    `${title} Theater: ${theater}. Type: ${kind}.`,
  );

  return {
    title,
    description,
    keywords: [...BASE_KEYWORDS, theater, kind, "IDF clip"],
    alternates: { canonical: url },
    openGraph: {
      type: "video.other",
      url,
      title: `${title} | ${SEO_SITE_NAME}`,
      description,
      siteName: SEO_SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SEO_SITE_NAME}`,
      description,
    },
    robots: { index: true, follow: true },
    ...(date
      ? {
          other: {
            "article:published_time": date,
          },
        }
      : {}),
  };
}

/** JSON-LD for the home page (WebSite + optional site search). */
export function webSiteJsonLd(searchUrlTemplate: string): object {
  const base = getSiteUrl().origin;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SEO_SITE_NAME,
    url: base,
    description: clampMetaDescription(
      "Search and filter official IDF spokesperson military footage with theater, opponent, and domain facets.",
    ),
    publisher: {
      "@type": "Organization",
      name: SEO_SITE_NAME,
      url: base,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: searchUrlTemplate,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
