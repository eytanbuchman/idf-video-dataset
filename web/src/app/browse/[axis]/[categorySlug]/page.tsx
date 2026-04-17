import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { ResultsWithDrawer } from "@/components/results-with-drawer";
import { ResultsFallback } from "@/components/results-fallback";
import { buildTagIndex } from "@/lib/link-tags";
import { getCategoryCopy } from "@/lib/category-copy";
import { filterByPillar, sortByDateDesc } from "@/lib/filter-videos";
import { getSiteUrl } from "@/lib/site";
import type { Axis } from "@/lib/types";
import {
  axisLabel,
  getAllVideos,
  getLabelForAxis,
  getLibraryStats,
  isAxis,
} from "@/lib/videos";

const PAGE_SIZE = 40;

type Props = {
  params: Promise<{ axis: string; categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { axis: raw, categorySlug } = await params;
  if (!isAxis(raw)) return { title: "Not found" };
  const axis = raw as Axis;
  const videos = await getAllVideos();
  const list = filterByPillar(videos, axis, categorySlug);
  const label =
    list[0] != null ? getLabelForAxis(list[0], axis) : categorySlug;
  const title = `${label} · ${axisLabel(axis)}`;
  return {
    title,
    description: `${list.length} IDF video clips tagged "${label}" under ${axisLabel(axis).toLowerCase()}. Stream or export metadata.`,
    openGraph: { title, description: `${list.length} clips` },
  };
}

export default async function PillarPage({ params, searchParams }: Props) {
  const { axis: raw, categorySlug } = await params;
  const sp = await searchParams;
  if (!isAxis(raw)) notFound();
  const axis = raw as Axis;

  const videos = await getAllVideos();
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
  const stats = await getLibraryStats();
  const tags = buildTagIndex(stats);
  const copy = await getCategoryCopy(axis, categorySlug, label);

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

      <nav className="mb-6 text-[13px] text-[var(--muted)]">
        <Link href="/" className="hover:text-[var(--accent)]">
          Home
        </Link>
        <span className="mx-2 text-[var(--border-strong)]">/</span>
        <Link href="/browse" className="hover:text-[var(--accent)]">
          Browse
        </Link>
        <span className="mx-2 text-[var(--border-strong)]">/</span>
        <Link
          href={`/browse/${axis}`}
          className="hover:text-[var(--accent)]"
        >
          {axisLabel(axis)}
        </Link>
        <span className="mx-2 text-[var(--border-strong)]">/</span>
        <span className="text-[var(--foreground)]">{label}</span>
      </nav>

      <header className="mb-12 max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
          {axisLabel(axis)} · {copy.tagline}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-[-0.015em] text-[var(--foreground)] md:text-5xl">
          {label}
        </h1>
        <p className="mt-5 text-[15px] leading-[1.7] text-[var(--muted-strong)] md:text-[16px]">
          {copy.intro}
        </p>
      </header>

      <Suspense fallback={<ResultsFallback />}>
        <ResultsWithDrawer
          pageVideos={slice}
          basePath={`/browse/${axis}/${categorySlug}`}
          searchParams={{}}
          page={safePage}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          totalMatching={list.length}
          tags={tags}
        />
      </Suspense>
    </div>
  );
}
