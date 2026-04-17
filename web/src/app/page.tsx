import { Suspense } from "react";
import { HeroStats } from "@/components/hero-stats";
import { SearchFilters } from "@/components/search-filters";
import { ResultsWithDrawer } from "@/components/results-with-drawer";
import { ResultsFallback } from "@/components/results-fallback";
import {
  filterVideos,
  sortByDateDesc,
  type ListFilters,
} from "@/lib/filter-videos";
import { getLibraryStats, videos } from "@/lib/videos";
import { buildTagIndex } from "@/lib/link-tags";

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
  return {
    page,
    filters: {
      q: g("q"),
      frontSlug: g("front"),
      opponentSlug: g("opponent"),
      typeSlug: g("type"),
      dateFrom: g("from"),
      dateTo: g("to"),
    },
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { filters, page } = parseFilters(sp);
  const stats = getLibraryStats();
  const tags = buildTagIndex(stats);

  const hasAnyFilter = Boolean(
    filters.q ||
      filters.frontSlug ||
      filters.opponentSlug ||
      filters.typeSlug ||
      filters.dateFrom ||
      filters.dateTo,
  );

  const list = sortByDateDesc(filterVideos(videos, filters));
  const totalPages = hasAnyFilter
    ? Math.max(1, Math.ceil(list.length / PAGE_SIZE))
    : 1;
  const safePage = Math.min(page, totalPages);
  const slice = hasAnyFilter
    ? list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
    : list.slice(0, INITIAL_LIMIT);

  const spForPager: Record<string, string | undefined> = {
    q: filters.q,
    front: filters.frontSlug,
    opponent: filters.opponentSlug,
    type: filters.typeSlug,
    from: filters.dateFrom,
    to: filters.dateTo,
  };

  return (
    <div>
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
            initial={!hasAnyFilter}
            tags={tags}
          />
        </Suspense>
      </section>
    </div>
  );
}
