import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { AXES, AXIS_CONFIG } from "@/lib/axes-config";
import { getLibraryStats } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Browse library",
  description:
    "Explore IDF video releases by theater, opponent, footage type, domain, or posture — pillar pages with full lists and filters.",
};

export default async function BrowseIndexPage() {
  await connection();
  const stats = await getLibraryStats();
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3rem)] tracking-[-0.015em] text-[var(--foreground)]">
        Browse the library
      </h1>
      <p className="mt-5 max-w-2xl text-[var(--muted-strong)] leading-relaxed">
        Pick an axis to see every category we track, with clip counts. Each
        category opens a dedicated page with the same rows as your CSV — good
        for SEO, sharing, and deep linking.
      </p>
      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {AXES.map((axis) => {
          const cfg = AXIS_CONFIG[axis];
          return (
            <li key={axis}>
              <Link
                href={`/browse/${axis}`}
                className="group relative block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-elev)] p-8 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"
              >
                <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.01em] text-[var(--foreground)]">
                  {cfg.label}
                </h2>
                <p className="mt-2 text-[13px] text-[var(--muted)]">
                  {stats.by[axis].length} values
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-[var(--muted-strong)]">
                  {cfg.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--accent)]">
                  Open index
                  <span className="transition group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
