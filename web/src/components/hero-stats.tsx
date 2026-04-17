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

  return (
    <header className="relative mb-12 md:mb-16">
      <p className="mb-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
        <span
          className="inline-block h-1 w-1 rounded-full bg-[var(--accent)]"
          aria-hidden
        />
        Last updated {lastUpdated}
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,6.2vw,4rem)] leading-[1.02] tracking-[-0.015em] text-[var(--foreground)]">
        IDF Military Footage Database
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted-strong)] md:text-[17px]">
        Search across the IDF video database. This index includes{" "}
        <strong className="font-semibold text-[var(--foreground)] tabular-nums">
          {stats.total.toLocaleString()}
        </strong>{" "}
        clips across{" "}
        <strong className="font-semibold text-[var(--foreground)] tabular-nums">
          {stats.by.theater.length}
        </strong>{" "}
        theaters — built for anyone who needs to find official footage and
        metadata to use responsibly in reporting, research, or education.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link
          href="/browse"
          className="group inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-medium text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
        >
          Browse by category
          <span
            className="transition-transform group-hover:translate-x-0.5"
            aria-hidden
          >
            →
          </span>
        </Link>
      </div>
    </header>
  );
}
