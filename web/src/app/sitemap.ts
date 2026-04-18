import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getSiteUrl } from "@/lib/site";
import type { VideoRecord } from "@/lib/types";
import { AXES } from "@/lib/types";
import { getAllVideos, getSlugForAxis } from "@/lib/videos";

/** Parse message date for `lastmod`; fall back to now if missing or invalid. */
function asDate(raw: string | undefined): Date {
  if (!raw) return new Date();
  const t = Date.parse(raw);
  return Number.isNaN(t) ? new Date() : new Date(t);
}

/** Latest clip date in the set (for hub pages’ lastmod). */
function latestVideoDate(videos: VideoRecord[]): Date {
  let latest = 0;
  for (const v of videos) {
    const t = Date.parse(v.date);
    if (!Number.isNaN(t) && t > latest) latest = t;
  }
  return latest ? new Date(latest) : new Date();
}

/**
 * Full sitemap for the public site: home, browse hubs, every category URL,
 * and every video permalink. `/admin` and API routes are excluded via
 * `robots.ts`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = getSiteUrl().origin;
  const videos = await getAllVideos();
  const hubLastMod = latestVideoDate(videos);

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: hubLastMod,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/browse`,
      lastModified: hubLastMod,
      changeFrequency: "weekly",
      priority: 0.95,
    },
  ];

  for (const axis of AXES) {
    entries.push({
      url: `${base}/browse/${axis}`,
      lastModified: hubLastMod,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  const pillarSeen = new Set<string>();
  for (const v of videos) {
    for (const axis of AXES) {
      const slug = getSlugForAxis(v, axis);
      const key = `${axis}:${slug}`;
      if (pillarSeen.has(key)) continue;
      pillarSeen.add(key);
      entries.push({
        url: `${base}/browse/${axis}/${slug}`,
        lastModified: hubLastMod,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  }

  for (const v of videos) {
    entries.push({
      url: `${base}/video/${v.slug}`,
      lastModified: asDate(v.date),
      changeFrequency: "monthly",
      priority: 0.65,
    });
  }

  return entries;
}
