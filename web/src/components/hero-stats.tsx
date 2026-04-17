import Link from "next/link";
import type { LibraryStats } from "@/lib/videos";

export function HeroStats({ stats }: { stats: LibraryStats }) {
  const lastUpdated = stats.dateMax
    ? new Date(stats.dateMax).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const cards = [
    {
      label: "Clips",
      value: stats.total,
      sub: "indexed releases",
      glow: "from-teal-500/12 via-teal-600/5 to-transparent",
      border: "border-teal-500/12",
    },
    {
      label: "Theaters",
      value: stats.byFront.length,
      sub: "distinct fronts",
      glow: "from-violet-500/10 via-violet-600/5 to-transparent",
      border: "border-violet-500/12",
    },
    {
      label: "Coverage",
      value: (() => {
        const a = stats.dateMin?.slice(0, 4);
        const b = stats.dateMax?.slice(0, 4);
        if (!a || !b) return "—";
        return a === b ? a : `${a}–${b}`;
      })(),
      sub:
        stats.dateMin && stats.dateMax
          ? `${stats.dateMin.slice(0, 10)} → ${stats.dateMax.slice(0, 10)}`
          : "indexed dates",
      glow: "from-rose-500/8 via-rose-600/5 to-transparent",
      border: "border-rose-500/12",
    },
  ];

  return (
    <header className="relative mb-12 md:mb-16">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
        Last updated {lastUpdated}
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.05] tracking-tight">
        <span className="text-gradient">IDF video library</span>
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--muted)] md:text-lg">
        Search across the IDF video database. This index includes{" "}
        <strong className="font-semibold text-[var(--foreground)]/90 tabular-nums">
          {stats.total.toLocaleString()}
        </strong>{" "}
        clips across{" "}
        <strong className="font-semibold text-[var(--foreground)]/90 tabular-nums">
          {stats.byFront.length}
        </strong>{" "}
        theaters — built for anyone who needs to find official footage and
        metadata to use responsibly in reporting, research, or education.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          href="/browse"
          className="group inline-flex min-h-[44px] items-center gap-2 rounded-full bg-gradient-to-r from-teal-800/50 to-emerald-900/40 px-5 py-2.5 text-sm font-medium text-teal-100/95 ring-1 ring-teal-500/20 transition hover:from-teal-700/55 hover:to-emerald-800/45"
        >
          Browse by Category
          <span
            className="transition-transform group-hover:translate-x-0.5"
            aria-hidden
          >
            →
          </span>
        </Link>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`relative overflow-hidden rounded-2xl border ${c.border} bg-[var(--glass)] p-6 shadow-lg shadow-black/25 backdrop-blur-xl`}
          >
            <div
              className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br ${c.glow} blur-2xl`}
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
              {c.label}
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl tabular-nums tracking-tight text-[var(--foreground)] md:text-4xl">
              {typeof c.value === "number"
                ? c.value.toLocaleString()
                : c.value}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">{c.sub}</p>
          </div>
        ))}
      </div>
    </header>
  );
}
