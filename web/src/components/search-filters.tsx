import type { ListFilters } from "@/lib/filter-videos";
import type { LibraryStats } from "@/lib/videos";
import { AXIS_CONFIG, FLAG_CONFIG, PRIMARY_FILTER_AXES } from "@/lib/axes-config";
import type { Axis } from "@/lib/types";
import { FilterDetails } from "./filter-details";

export function SearchFilters({
  filters,
  stats,
}: {
  filters: ListFilters;
  stats: LibraryStats;
}) {
  const hasAdvanced = Boolean(
    (filters.axes && Object.values(filters.axes).some((v) => !!v)) ||
      (filters.flags && Object.values(filters.flags).some((v) => !!v)) ||
      filters.dateFrom ||
      filters.dateTo,
  );

  const axisValue = (axis: Axis) => filters.axes?.[axis] ?? "";

  return (
    <form method="get" className="relative">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-elev)] p-3 shadow-[var(--shadow-md)] sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="q" className="sr-only">
              Search descriptions
            </label>
            <span
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              aria-hidden
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.q ?? ""}
              placeholder="Search transcripts, theaters, opponents, units…"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background-elev)] py-3.5 pl-11 pr-4 text-[14px] text-[var(--foreground)] outline-none ring-0 transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
            />
          </div>
          <div className="flex shrink-0 gap-2 sm:pr-1">
            <button
              type="submit"
              className="rounded-2xl bg-[var(--foreground)] px-6 py-3 text-[13px] font-medium text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
            >
              Search
            </button>
          </div>
        </div>

        <FilterDetails defaultOpen={hasAdvanced}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-2 py-2 text-[13px] text-[var(--muted-strong)] transition hover:text-[var(--foreground)]">
            <span className="flex items-center gap-2">
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--accent)] ring-1 ring-[var(--border)]"
                aria-hidden
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                  />
                </svg>
              </span>
              Refine — theater, opponent, type, flags &amp; dates
            </span>
            <span className="text-xs text-[var(--muted)] transition group-open/details:rotate-180">
              ▼
            </span>
          </summary>

          <div className="grid gap-4 px-2 pb-3 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRIMARY_FILTER_AXES.map((axis) => {
              const cfg = AXIS_CONFIG[axis];
              return (
                <label key={axis} className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {cfg.label}
                  </span>
                  <select
                    name={cfg.paramKey}
                    defaultValue={axisValue(axis)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                  >
                    <option value="">Any</option>
                    {stats.by[axis].map((x) => (
                      <option key={x.slug} value={x.slug}>
                        {x.label} ({x.count})
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
            <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Date range
              </span>
              <div className="flex flex-wrap gap-2">
                <input
                  type="date"
                  name="from"
                  defaultValue={filters.dateFrom?.slice(0, 10) ?? ""}
                  className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                />
                <input
                  type="date"
                  name="to"
                  defaultValue={filters.dateTo?.slice(0, 10) ?? ""}
                  className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-2 pb-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {AXIS_CONFIG.domain.label}
              </span>
              <select
                name={AXIS_CONFIG.domain.paramKey}
                defaultValue={axisValue("domain")}
                className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
              >
                <option value="">Any</option>
                {stats.by.domain.map((x) => (
                  <option key={x.slug} value={x.slug}>
                    {x.label} ({x.count})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {AXIS_CONFIG.posture.label}
              </span>
              <select
                name={AXIS_CONFIG.posture.paramKey}
                defaultValue={axisValue("posture")}
                className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
              >
                <option value="">Any</option>
                {stats.by.posture.map((x) => (
                  <option key={x.slug} value={x.slug}>
                    {x.label} ({x.count})
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Flags
              </legend>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {FLAG_CONFIG.map((f) => {
                  const checked = Boolean(
                    (filters.flags as Record<string, boolean> | undefined)?.[
                      f.field
                    ],
                  );
                  return (
                    <label
                      key={f.key}
                      className="inline-flex items-center gap-2 text-[12px] text-[var(--muted-strong)]"
                      title={f.description}
                    >
                      <input
                        type="checkbox"
                        name={f.paramKey}
                        value="1"
                        defaultChecked={checked}
                        className="h-[14px] w-[14px] accent-[var(--foreground)]"
                      />
                      {f.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border)] px-2 pb-2 pt-3">
            <button
              type="submit"
              className="rounded-full bg-[var(--foreground)] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
            >
              Apply filters
            </button>
          </div>
        </FilterDetails>
      </div>
    </form>
  );
}
