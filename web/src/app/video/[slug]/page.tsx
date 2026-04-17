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

  const streamUrl = getStreamUrl(v.resolved_url);
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
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl leading-tight tracking-tight text-[var(--foreground)] md:text-4xl">
          {excerpt(v.message_text, 120)}
        </h1>
        <div className="mt-6 flex flex-wrap gap-2">
          {AXES.map((axis) => (
            <Link
              key={axis}
              href={`/browse/${axis}/${getSlugForAxis(v, axis)}`}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-[var(--foreground)] ring-1 ring-white/[0.04] transition hover:border-teal-500/40 hover:bg-teal-500/10"
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500/20 via-violet-500/10 to-rose-500/15 p-[1px] shadow-2xl shadow-black/50">
            <div className="overflow-hidden rounded-2xl bg-[#050608]">
              <video
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full"
                src={streamUrl}
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-teal-300/90 underline-offset-4 hover:underline"
            >
              Open stream
            </a>
            <a
              href={streamUrl}
              download={v.video_file || "video.mp4"}
              className="text-sm text-teal-300/90 underline-offset-4 hover:underline"
            >
              Download
            </a>
            <CopyPageUrl />
          </div>
        </div>

        <aside className="lg:col-span-2">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Full text
          </h2>
          <div className="mt-3 max-h-[min(70vh,520px)] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[var(--glass)] p-5 text-sm leading-relaxed shadow-inner shadow-black/20 backdrop-blur-md">
            <p className="whitespace-pre-wrap text-[var(--foreground)]/95">
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
                  className="text-teal-300/90 underline-offset-2 hover:underline"
                >
                  {v.bitly_url}
                </a>
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-white/[0.06] pt-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)]">
            More from {v.front}
          </h2>
          <ul className="mt-6 space-y-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/video/${r.slug}`}
                  className="text-teal-300/90 underline-offset-2 hover:underline"
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
