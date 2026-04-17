import type { Axis, VideoRecord } from "./types";
import { AXES } from "./types";
import videosData from "@/data/videos.json";

export const videos = videosData as VideoRecord[];

export function getVideoBySlug(slug: string): VideoRecord | undefined {
  return videos.find((v) => v.slug === slug);
}

export function isAxis(s: string): s is Axis {
  return AXES.includes(s as Axis);
}

export function axisLabel(axis: Axis): string {
  switch (axis) {
    case "front":
      return "Theater / front";
    case "opponent":
      return "Opponent";
    case "type":
      return "Footage type";
    default:
      return axis;
  }
}

export function getSlugForAxis(v: VideoRecord, axis: Axis): string {
  switch (axis) {
    case "front":
      return v.frontSlug;
    case "opponent":
      return v.opponentSlug;
    case "type":
      return v.typeSlug;
  }
}

export function getLabelForAxis(v: VideoRecord, axis: Axis): string {
  switch (axis) {
    case "front":
      return v.front;
    case "opponent":
      return v.opponent;
    case "type":
      return v.type;
  }
}

export type LibraryStats = {
  total: number;
  dateMin: string | null;
  dateMax: string | null;
  byFront: { label: string; slug: string; count: number }[];
  byOpponent: { label: string; slug: string; count: number }[];
  byType: { label: string; slug: string; count: number }[];
};

function rollup(
  axis: Axis,
): { label: string; slug: string; count: number }[] {
  const map = new Map<string, { label: string; slug: string; count: number }>();
  for (const v of videos) {
    const slug = getSlugForAxis(v, axis);
    const label = getLabelForAxis(v, axis);
    const cur = map.get(slug);
    if (cur) cur.count += 1;
    else map.set(slug, { label, slug, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function getLibraryStats(): LibraryStats {
  const dates = videos
    .map((v) => v.date)
    .filter(Boolean)
    .sort();
  return {
    total: videos.length,
    dateMin: dates[0] ?? null,
    dateMax: dates[dates.length - 1] ?? null,
    byFront: rollup("front"),
    byOpponent: rollup("opponent"),
    byType: rollup("type"),
  };
}
