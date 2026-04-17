import Link from "next/link";
import type { Metadata } from "next";
import { AXES } from "@/lib/types";
import { axisLabel, getLibraryStats } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Browse library",
  description:
    "Explore IDF video releases by theater, opponent, or footage type — pillar pages with full lists and filters.",
};

export default function BrowseIndexPage() {
  const stats = getLibraryStats();
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
        Browse the library
      </h1>
      <p className="mt-4 max-w-2xl text-[var(--muted)]">
        Pick an axis to see every category we track, with clip counts. Each
        category opens a dedicated page with the same rows as your CSV — good
        for SEO, sharing, and deep linking.
      </p>
      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {AXES.map((axis) => (
          <li key={axis}>
            <Link
              href={`/browse/${axis}`}
              className="block border border-[var(--border)] p-6 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
            >
              <h2 className="font-[family-name:var(--font-display)] text-2xl">
                {axisLabel(axis)}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {axis === "front" && `${stats.byFront.length} theaters`}
                {axis === "opponent" && `${stats.byOpponent.length} groups`}
                {axis === "type" && `${stats.byType.length} types`}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
