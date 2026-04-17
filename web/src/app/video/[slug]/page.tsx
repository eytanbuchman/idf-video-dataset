import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { CopyPageUrl } from "@/components/copy-page-url";
import { getStreamUrl } from "@/lib/video-url";
import { getSiteUrl } from "@/lib/site";
import { AXES } from "@/lib/types";
import {
  getVideoBySlug,
  getLabelForAxis,
  getSlugForAxis,
  videos,
} from "@/lib/videos";

type Props = { params: Promise<{ slug: string }> };

function excerpt(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export async function generateStaticParams() {
  return videos.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const v = getVideoBySlug(slug);
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
  const { slug } = await params;
  const v = getVideoBySlug(slug);
  if (!v) notFound();

  const streamUrl = getStreamUrl(v.resolved_url, v.video_file);
  const base = getSiteUrl().origin;

  const related = videos
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
          className="font-mono text-sm text-[var(--muted)]"
        >
          {v.date?.slice(0, 10) ?? "—"}
        </time>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl leading-tight tracking-tight md:text-4xl">
          {excerpt(v.message_text, 120)}
        </h1>
        <div className="mt-6 flex flex-wrap gap-2">
          {AXES.map((axis) => (
            <Link
              key={axis}
              href={`/browse/${axis}/${getSlugForAxis(v, axis)}`}
              className="rounded-full border border-[var(--border)] bg-[var(--accent-soft)] px-3 py-1 text-xs text-[var(--foreground)] hover:border-[var(--accent)]"
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
          <div className="overflow-hidden border border-[var(--border)] bg-black/5 dark:bg-white/5">
            <video
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full"
              src={streamUrl}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Open stream in new tab
            </a>
            <a
              href={streamUrl}
              download={v.video_file || "video.mp4"}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Download file
            </a>
            <CopyPageUrl />
          </div>
        </div>

        <aside className="lg:col-span-2">
          <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
            Full text
          </h2>
          <div className="mt-3 max-h-[min(70vh,520px)] overflow-y-auto border border-[var(--border)] p-4 text-sm leading-relaxed text-[var(--muted)]">
            <p className="whitespace-pre-wrap text-[var(--foreground)]">
              {v.message_text}
            </p>
          </div>
          <dl className="mt-6 space-y-2 font-mono text-xs text-[var(--muted)]">
            <div>
              <dt className="inline text-[var(--muted)]">message_id </dt>
              <dd className="inline text-[var(--foreground)]">
                {v.message_id}
              </dd>
            </div>
            <div>
              <dt className="inline">bitly </dt>
              <dd className="inline break-all">
                <a
                  href={v.bitly_url}
                  className="text-[var(--accent)] hover:underline"
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
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            More from {v.front}
          </h2>
          <ul className="mt-6 space-y-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/video/${r.slug}`}
                  className="text-[var(--accent)] hover:underline"
                >
                  {excerpt(r.message_text, 90)}
                </Link>
                <span className="ml-2 font-mono text-xs text-[var(--muted)]">
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
