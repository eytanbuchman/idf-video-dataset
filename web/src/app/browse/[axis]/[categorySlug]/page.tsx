import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { VideoListClient } from "@/components/video-list-client";
import { Pagination } from "@/components/pagination";
import { filterByPillar, sortByDateDesc } from "@/lib/filter-videos";
import { getSiteUrl } from "@/lib/site";
import type { Axis } from "@/lib/types";
import { AXES } from "@/lib/types";
import {
  axisLabel,
  getLabelForAxis,
  getSlugForAxis,
  getLibraryStats,
  isAxis,
  videos,
} from "@/lib/videos";

const PAGE_SIZE = 40;

type Props = {
  params: Promise<{ axis: string; categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
  const seen = new Set<string>();
  const out: { axis: string; categorySlug: string }[] = [];
  for (const v of videos) {
    for (const axis of AXES) {
      const categorySlug = getSlugForAxis(v, axis);
      const key = `${axis}:${categorySlug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ axis, categorySlug });
    }
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { axis: raw, categorySlug } = await params;
  if (!isAxis(raw)) return { title: "Not found" };
  const axis = raw as Axis;
  const list = filterByPillar(videos, axis, categorySlug);
  const label =
    list[0] != null ? getLabelForAxis(list[0], axis) : categorySlug;
  const title = `${label} · ${axisLabel(axis)}`;
  return {
    title,
    description: `${list.length} IDF video clips tagged “${label}” under ${axisLabel(axis).toLowerCase()}. Stream or export metadata.`,
    openGraph: { title, description: `${list.length} clips` },
  };
}

export default async function PillarPage({ params, searchParams }: Props) {
  const { axis: raw, categorySlug } = await params;
  const sp = await searchParams;
  if (!isAxis(raw)) notFound();
  const axis = raw as Axis;

  const list = sortByDateDesc(filterByPillar(videos, axis, categorySlug));
  if (list.length === 0) notFound();

  const label = getLabelForAxis(list[0], axis);
  const page = Math.max(
    1,
    parseInt(
      (Array.isArray(sp.page) ? sp.page[0] : sp.page) ?? "1",
      10,
    ) || 1,
  );
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = list.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const base = getSiteUrl().origin;
  const stats = getLibraryStats();
  const dates = list.map((v) => v.date).filter(Boolean).sort();
  const dateMin = dates[0];
  const dateMax = dates[dates.length - 1];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Browse",
        item: `${base}/browse`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: axisLabel(axis),
        item: `${base}/browse/${axis}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: label,
        item: `${base}/browse/${axis}/${categorySlug}`,
      },
    ],
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${label} — ${axisLabel(axis)}`,
    description: `IDF video dataset: ${list.length} clips.`,
    numberOfItems: list.length,
  };

  return (
    <div>
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={collectionLd} />

      <nav className="mb-6 text-sm text-[var(--muted)]">
        <Link href="/" className="hover:text-[var(--foreground)]">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/browse" className="hover:text-[var(--foreground)]">
          Browse
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/browse/${axis}`}
          className="hover:text-[var(--foreground)]"
        >
          {axisLabel(axis)}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">{label}</span>
      </nav>

      <header className="mb-10 max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
          {axisLabel(axis)}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-tight md:text-5xl">
          {label}
        </h1>
        <p className="mt-4 text-[var(--muted)]">
          <strong className="text-[var(--foreground)]">
            {list.length.toLocaleString()}
          </strong>{" "}
          clips in this category
          {dateMin && dateMax && (
            <>
              {" "}
              · dated {dateMin.slice(0, 10)} → {dateMax.slice(0, 10)}
            </>
          )}
          . Streams use the official Azure CDN URLs from your dataset; this
          page only lists metadata.
        </p>
      </header>

      <section className="mb-10 border border-[var(--border)] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
          Dataset context
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          The full library holds {stats.total.toLocaleString()} indexed videos
          across {stats.byFront.length} theaters, {stats.byOpponent.length}{" "}
          opponent labels, and {stats.byType.length} footage types. Use the
          home search to combine this category with other filters, or export
          selected rows as CSV.
        </p>
        <p className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/" className="text-[var(--accent)] hover:underline">
            ← Back to search
          </Link>
          <Link
            href={`/browse/${axis}`}
            className="text-[var(--accent)] hover:underline"
          >
            All {axisLabel(axis)} values
          </Link>
        </p>
      </section>

      <p className="mb-4 text-sm text-[var(--muted)]">
        Showing {(safePage - 1) * PAGE_SIZE + 1}–
        {Math.min(safePage * PAGE_SIZE, list.length)} of{" "}
        {list.length.toLocaleString()}
      </p>
      <VideoListClient pageVideos={slice} />
      <Pagination
        basePath={`/browse/${axis}/${categorySlug}`}
        searchParams={{}}
        page={safePage}
        totalPages={totalPages}
      />
    </div>
  );
}
