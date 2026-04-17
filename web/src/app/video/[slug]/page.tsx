import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { CopyPageUrl } from "@/components/copy-page-url";
import { getStreamUrl } from "@/lib/video-url";
import { getSiteUrl } from "@/lib/site";
import { AXES } from "@/lib/types";
import { buildTagIndex, renderLinkedText } from "@/lib/link-tags";
import {
  getAllVideos,
  getLabelForAxis,
  getLibraryStats,
  getSlugForAxis,
  getVideoBySlug,
} from "@/lib/videos";

type Props = { params: Promise<{ slug: string }> };

function excerpt(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVideoBySlug(slug);
  if (!v) return { title: "Not found" };
  const title = excerpt(v.message_text, 72);
  const description = excerpt(v.message_text, 155);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "video.other",
    },
  };
}

export default async function VideoPage({ params }: Props) {
  await connection();
  const { slug } = await params;
  const v = await getVideoBySlug(slug);
  if (!v) notFound();

  const streamUrl = getStreamUrl(v.resolved_url);
  const base = getSiteUrl().origin;
  const stats = await getLibraryStats();
  const tags = buildTagIndex(stats);

  const allVideos = await getAllVideos();
  const related = allVideos
    .filter((x) => x.slug !== v.slug && x.frontSlug === v.frontSlug)
    .slice(0, 8);

  const videoLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: excerpt(v.message_text, 100),
    description: v.message_text,
    uploadDate: v.date,
    contentUrl: streamUrl,
    url: `${base}/video/${v.slug}`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Theater",
        item: `${base}/browse/front/${v.frontSlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: v.front,
        item: `${base}/browse/front/${v.frontSlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Clip",
        item: `${base}/video/${v.slug}`,
      },
    ],
  };

  const crumbs = [
    { label: "Home", href: "/" },
    { label: v.front, href: `/browse/front/${v.frontSlug}` },
    { label: excerpt(v.message_text, 48), href: undefined },
  ];

  return (
    <article>
      <JsonLd data={videoLd} />
      <JsonLd data={breadcrumbLd} />

      <Breadcrumbs items={crumbs} />

      <header className="mt-8">
        <time
          dateTime={v.date}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]"
        >
          {v.date?.slice(0, 10) ?? "—"}
        </time>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl leading-tight tracking-[-0.015em] text-[var(--foreground)] md:text-4xl">
          {excerpt(v.message_text, 120)}
        </h1>
        <div className="mt-6 flex flex-wrap gap-2">
          {AXES.map((axis) => (
            <Link
              key={axis}
              href={`/browse/${axis}/${getSlugForAxis(v, axis)}`}
              className="rounded-full border border-[var(--border)] bg-[var(--background-elev)] px-3 py-1.5 text-[12px] font-medium text-[var(--muted-strong)] shadow-[var(--shadow-sm)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            >
              {axis === "front" && "Theater: "}
              {axis === "opponent" && "Opponent: "}
              {axis === "type" && "Type: "}
              {getLabelForAxis(v, axis)}
            </Link>
          ))}
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0a0b0f] shadow-[var(--shadow-md)]">
            <video
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black"
              src={streamUrl}
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium text-[var(--accent)] underline-offset-4 hover:underline"
            >
              Open stream
            </a>
            <a
              href={streamUrl}
              download={v.video_file || "video.mp4"}
              className="text-[13px] font-medium text-[var(--accent)] underline-offset-4 hover:underline"
            >
              Download
            </a>
            <CopyPageUrl />
          </div>
        </div>

        <aside className="lg:col-span-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            Initial Press Release Update
          </h2>
          <div className="mt-3 max-h-[min(70vh,520px)] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[14px] leading-[1.7]">
            <p className="whitespace-pre-wrap text-[var(--foreground)]">
              {renderLinkedText(v.message_text, tags)}
            </p>
          </div>
          <dl className="mt-6 space-y-2 font-mono text-[11px] text-[var(--muted)]">
            <div>
              <dt className="inline">message_id </dt>
              <dd className="inline text-[var(--foreground)]">
                {v.message_id}
              </dd>
            </div>
            <div>
              <dt className="inline">bitly </dt>
              <dd className="inline break-all">
                <a
                  href={v.bitly_url}
                  className="text-[var(--accent)] underline-offset-2 hover:underline"
                >
                  {v.bitly_url}
                </a>
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-[var(--border)] pt-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.01em] text-[var(--foreground)]">
            More from {v.front}
          </h2>
          <ul className="mt-6 space-y-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/video/${r.slug}`}
                  className="text-[14px] text-[var(--accent)] underline-offset-2 hover:underline"
                >
                  {excerpt(r.message_text, 90)}
                </Link>
                <span className="ml-2 font-mono text-[11px] text-[var(--muted)]">
                  {r.date?.slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
