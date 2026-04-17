import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { axisLabel, getLibraryStats, isAxis } from "@/lib/videos";
import type { Axis } from "@/lib/types";

type Props = { params: Promise<{ axis: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { axis: raw } = await params;
  if (!isAxis(raw)) return { title: "Not found" };
  const axis = raw as Axis;
  return {
    title: `${axisLabel(axis)} categories`,
    description: `Index of all ${axisLabel(axis).toLowerCase()} values in the IDF video dataset.`,
  };
}

export default async function AxisHubPage({ params }: Props) {
  await connection();
  const { axis: raw } = await params;
  if (!isAxis(raw)) notFound();
  const axis = raw as Axis;
  const stats = await getLibraryStats();
  const list =
    axis === "front"
      ? stats.byFront
      : axis === "opponent"
        ? stats.byOpponent
        : stats.byType;

  return (
    <div>
      <nav className="mb-6 text-[13px] text-[var(--muted)]">
        <Link href="/browse" className="hover:text-[var(--accent)]">
          Browse
        </Link>
        <span className="mx-2 text-[var(--border-strong)]">/</span>
        <span className="text-[var(--foreground)]">{axisLabel(axis)}</span>
      </nav>
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-[-0.015em] text-[var(--foreground)]">
        {axisLabel(axis)}
      </h1>
      <p className="mt-4 max-w-2xl text-[var(--muted-strong)]">
        {list.length} distinct values. Open a category to see every matching
        clip, stream from Azure, or export a CSV bundle.
      </p>
      <ul className="mt-10 columns-1 gap-x-8 text-[14px] md:columns-2">
        {list.map((row) => (
          <li key={row.slug} className="mb-2 break-inside-avoid">
            <Link
              href={`/browse/${axis}/${row.slug}`}
              className="text-[var(--accent)] underline-offset-2 hover:underline"
            >
              {row.label}
            </Link>
            <span className="ml-2 text-[var(--muted)] tabular-nums">
              ({row.count})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
