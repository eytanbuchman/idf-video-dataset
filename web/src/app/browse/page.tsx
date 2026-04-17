import Link from "next/link";
import type { Metadata } from "next";
import { AXES } from "@/lib/types";
import { axisLabel, getLibraryStats } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Browse library",
  description:
    "Explore IDF video releases by theater, opponent, or footage type — pillar pages with full lists and filters.",
};

const cardGradients = [
  "from-teal-500/15 via-teal-600/5 to-transparent border-teal-500/20 hover:shadow-teal-500/10",
  "from-violet-500/15 via-violet-600/5 to-transparent border-violet-500/20 hover:shadow-violet-500/10",
  "from-rose-500/12 via-rose-600/5 to-transparent border-rose-500/20 hover:shadow-rose-500/10",
];

export default function BrowseIndexPage() {
  const stats = getLibraryStats();
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3rem)] tracking-tight">
        <span className="text-gradient">Browse the library</span>
      </h1>
      <p className="mt-5 max-w-2xl text-[var(--muted)] leading-relaxed">
        Pick an axis to see every category we track, with clip counts. Each
        category opens a dedicated page with the same rows as your CSV — good
        for SEO, sharing, and deep linking.
      </p>
      <ul className="mt-12 grid gap-5 md:grid-cols-3">
        {AXES.map((axis, i) => (
          <li key={axis}>
            <Link
              href={`/browse/${axis}`}
              className={`group relative block overflow-hidden rounded-2xl border bg-gradient-to-br p-8 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 ${cardGradients[i]}`}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-3xl transition group-hover:bg-white/10"
                aria-hidden
              />
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)]">
                {axisLabel(axis)}
              </h2>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {axis === "front" && `${stats.byFront.length} theaters`}
                {axis === "opponent" && `${stats.byOpponent.length} groups`}
                {axis === "type" && `${stats.byType.length} types`}
              </p>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-teal-300/90">
                Open index
                <span className="transition group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
