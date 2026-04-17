import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { AXES, type Axis } from "@/lib/types";
import { videos } from "@/lib/videos";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().origin;
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/browse`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];

  for (const axis of AXES) {
    entries.push({
      url: `${base}/browse/${axis}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    });
  }

  const pillarSeen = new Set<string>();
  for (const v of videos) {
    for (const axis of AXES) {
      const slug =
        axis === "front"
          ? v.frontSlug
          : axis === "opponent"
            ? v.opponentSlug
            : v.typeSlug;
      const key = `${axis}:${slug}`;
      if (pillarSeen.has(key)) continue;
      pillarSeen.add(key);
      entries.push({
        url: `${base}/browse/${axis}/${slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  for (const v of videos) {
    entries.push({
      url: `${base}/video/${v.slug}`,
      lastModified: new Date(v.date || now),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
