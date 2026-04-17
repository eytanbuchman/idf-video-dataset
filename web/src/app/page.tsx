import Link from "next/link";
import { VideoListClient } from "@/components/video-list-client";
import { Pagination } from "@/components/pagination";
import {
  filterVideos,
  sortByDateDesc,
  type ListFilters,
} from "@/lib/filter-videos";
import { getLibraryStats, videos } from "@/lib/videos";

const PAGE_SIZE = 40;

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
  const list = sortByDateDesc(filterVideos(videos, filters));
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = list.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

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
      <header className="mb-10 max-w-2xl">
        <h1
          className="font-[family-name:var(--font-display)] text-4xl leading-tight tracking-tight text-[var(--foreground)] md:text-5xl"
        >
          IDF video library
        </h1>
        <p className="mt-4 text-lg text-[var(--muted)]">
          {stats.total.toLocaleString()} clips indexed
          {stats.dateMin && stats.dateMax && (
            <>
              {" "}
              · {stats.dateMin.slice(0, 10)} → {stats.dateMax.slice(0, 10)}
            </>
          )}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          <Link href="/browse" className="text-[var(--accent)] hover:underline">
            Explore by category
          </Link>
        </p>
      </header>

      <section
        aria-label="Library overview"
        className="mb-10 grid gap-4 border border-[var(--border)] p-6 md:grid-cols-3"
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
            Theaters
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {stats.byFront.length}
          </p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
            Opponents
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {stats.byOpponent.length}
          </p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
            Footage types
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {stats.byType.length}
          </p>
        </div>
      </section>

      <form
        method="get"
        className="mb-8 space-y-4 border-b border-[var(--border)] pb-8"
      >
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-[var(--muted)]">
              Search text
            </span>
            <input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Keywords in description…"
              className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="flex min-w-[140px] flex-col gap-1">
            <span className="text-xs font-medium text-[var(--muted)]">
              Theater
            </span>
            <select
              name="front"
              defaultValue={filters.frontSlug ?? ""}
              className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="">Any</option>
              {stats.byFront.map((x) => (
                <option key={x.slug} value={x.slug}>
                  {x.label} ({x.count})
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[140px] flex-col gap-1">
            <span className="text-xs font-medium text-[var(--muted)]">
              Opponent
            </span>
            <select
              name="opponent"
              defaultValue={filters.opponentSlug ?? ""}
              className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="">Any</option>
              {stats.byOpponent.map((x) => (
                <option key={x.slug} value={x.slug}>
                  {x.label} ({x.count})
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[160px] flex-col gap-1">
            <span className="text-xs font-medium text-[var(--muted)]">
              Type
            </span>
            <select
              name="type"
              defaultValue={filters.typeSlug ?? ""}
              className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="">Any</option>
              {stats.byType.map((x) => (
                <option key={x.slug} value={x.slug}>
                  {x.label} ({x.count})
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--muted)]">From</span>
            <input
              type="date"
              name="from"
              defaultValue={filters.dateFrom?.slice(0, 10) ?? ""}
              className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--muted)]">To</span>
            <input
              type="date"
              name="to"
              defaultValue={filters.dateTo?.slice(0, 10) ?? ""}
              className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="self-end rounded-full bg-[var(--foreground)] px-6 py-2 text-sm font-medium text-[var(--background)]"
          >
            Apply
          </button>
        </div>
      </form>

      <section aria-label="Results">
        <h2 className="sr-only">Search results</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Showing {(safePage - 1) * PAGE_SIZE + 1}–
          {Math.min(safePage * PAGE_SIZE, list.length)} of{" "}
          {list.length.toLocaleString()}
        </p>
        <VideoListClient pageVideos={slice} />
        <Pagination
          basePath="/"
          searchParams={spForPager}
          page={safePage}
          totalPages={totalPages}
        />
      </section>
    </div>
  );
}
