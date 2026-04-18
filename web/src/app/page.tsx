import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { JsonLd } from "@/components/json-ld";
import { HeroStats } from "@/components/hero-stats";
import { SearchFilters } from "@/components/search-filters";
import { ResultsWithDrawer } from "@/components/results-with-drawer";
import { ResultsFallback } from "@/components/results-fallback";
import {
  filterVideos,
  hasAnyFilter as isFiltered,
  sortByDateDesc,
  type ListFilters,
} from "@/lib/filter-videos";
import { getAllVideos, getLibraryStats } from "@/lib/videos";
import { buildTagIndex } from "@/lib/link-tags";
import { AXES, AXIS_CONFIG, FLAG_CONFIG } from "@/lib/axes-config";
import { absoluteUrl, homeMetadata, webSiteJsonLd } from "@/lib/seo";

const PAGE_SIZE = 40;
const INITIAL_LIMIT = 10;

function parseFilters(sp: Record<string, string | string[] | undefined>): {
  filters: ListFilters;
  page: number;
} {
  const g = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const page = Math.max(1, parseInt(g("page") ?? "1", 10) || 1);

  const axes: NonNullable<ListFilters["axes"]> = {};
  for (const axis of AXES) {
    const v = g(AXIS_CONFIG[axis].paramKey);
    if (v) axes[axis] = v;
  }

  const flags: NonNullable<ListFilters["flags"]> = {};
  for (const f of FLAG_CONFIG) {
    if (g(f.paramKey) === "1") {
      (flags as Record<string, boolean>)[f.field] = true;
    }
  }

  return {
    page,
    filters: {
      q: g("q"),
      axes,
      flags,
      dateFrom: g("from"),
      dateTo: g("to"),
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const stats = await getLibraryStats();
  return homeMetadata({
    total: stats.total,
    dateMin: stats.dateMin,
    dateMax: stats.dateMax,
  });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const sp = await searchParams;
  const { filters, page } = parseFilters(sp);
  const [stats, allVideos] = await Promise.all([
    getLibraryStats(),
    getAllVideos(),
  ]);
  const tags = buildTagIndex(stats);

  const filtered = isFiltered(filters);
  const list = sortByDateDesc(filterVideos(allVideos, filters));
  const totalPages = filtered
    ? Math.max(1, Math.ceil(list.length / PAGE_SIZE))
    : 1;
  const safePage = Math.min(page, totalPages);
  const slice = filtered
    ? list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
    : list.slice(0, INITIAL_LIMIT);

  // Pass current search params through untouched so the pager preserves state.
  const spForPager: Record<string, string | undefined> = {};
  for (const axis of AXES) {
    const key = AXIS_CONFIG[axis].paramKey;
    const v = filters.axes?.[axis];
    if (v) spForPager[key] = v;
  }
  for (const f of FLAG_CONFIG) {
    const v = (filters.flags as Record<string, boolean> | undefined)?.[f.field];
    if (v) spForPager[f.paramKey] = "1";
  }
  if (filters.q) spForPager.q = filters.q;
  if (filters.dateFrom) spForPager.from = filters.dateFrom;
  if (filters.dateTo) spForPager.to = filters.dateTo;

  return (
    <div>
      <JsonLd
        data={webSiteJsonLd(`${absoluteUrl("/")}?q={search_term_string}`)}
      />
      <HeroStats stats={stats} />

      <div className="mb-10">
        <SearchFilters filters={filters} stats={stats} />
      </div>

      <section aria-label="Results">
        <h2 className="sr-only">Search results</h2>
        <Suspense fallback={<ResultsFallback />}>
          <ResultsWithDrawer
            pageVideos={slice}
            basePath="/"
            searchParams={spForPager}
            page={safePage}
            totalPages={totalPages}
            pageSize={PAGE_SIZE}
            totalMatching={list.length}
            initial={!filtered}
            tags={tags}
          />
        </Suspense>
      </section>
    </div>
  );
}
