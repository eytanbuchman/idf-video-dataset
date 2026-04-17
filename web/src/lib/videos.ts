import type { Axis, VideoRecord } from "./types";
import { AXES } from "./types";
import { sql } from "./db";

// Kept for api compatibility with admin-actions / api routes that reference
// these symbols. Pages now render dynamically, so there's nothing to tag.
export const CACHE_TAG_VIDEOS = "videos";
export const CACHE_TAG_CATEGORIES = "categories";

type VideoRow = {
  slug: string;
  id: string;
  message_id: string | number;
  date: string;
  bitly_url: string;
  resolved_url: string;
  video_file: string;
  message_text: string;
  front: string;
  opponent: string;
  type: string;
  front_slug: string;
  opponent_slug: string;
  type_slug: string;
};

function mapRow(r: VideoRow): VideoRecord {
  return {
    id: r.id,
    slug: r.slug,
    message_id: typeof r.message_id === "string"
      ? Number(r.message_id)
      : r.message_id,
    date: r.date ?? "",
    bitly_url: r.bitly_url ?? "",
    resolved_url: r.resolved_url ?? "",
    video_file: r.video_file ?? "",
    message_text: r.message_text ?? "",
    front: r.front ?? "Unknown",
    opponent: r.opponent ?? "Unknown",
    type: r.type ?? "Unknown",
    frontSlug: r.front_slug ?? "unknown",
    opponentSlug: r.opponent_slug ?? "unknown",
    typeSlug: r.type_slug ?? "unknown",
  };
}

// ---------------------------------------------------------------------------
// Data accessors (cached, tagged)
// ---------------------------------------------------------------------------

export async function getAllVideos(): Promise<VideoRecord[]> {
  const rows = (await sql()`
    SELECT slug, id, message_id, date, bitly_url, resolved_url, video_file,
           message_text, front, opponent, type,
           front_slug, opponent_slug, type_slug
    FROM videos
    ORDER BY date DESC
  `) as unknown as VideoRow[];
  return rows.map(mapRow);
}

export async function getVideoBySlug(
  slug: string,
): Promise<VideoRecord | undefined> {
  const rows = (await sql()`
    SELECT slug, id, message_id, date, bitly_url, resolved_url, video_file,
           message_text, front, opponent, type,
           front_slug, opponent_slug, type_slug
    FROM videos WHERE slug = ${slug} LIMIT 1
  `) as unknown as VideoRow[];
  if (!rows[0]) return undefined;
  return mapRow(rows[0]);
}

export async function getAllVideoSlugs(): Promise<{ slug: string }[]> {
  const rows = (await sql()`SELECT slug FROM videos`) as unknown as {
    slug: string;
  }[];
  return rows.map((r) => ({ slug: r.slug }));
}

// ---------------------------------------------------------------------------
// Pure helpers (no I/O)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Library stats (rollups across the dataset)
// ---------------------------------------------------------------------------

export type LibraryStats = {
  total: number;
  dateMin: string | null;
  dateMax: string | null;
  byFront: { label: string; slug: string; count: number }[];
  byOpponent: { label: string; slug: string; count: number }[];
  byType: { label: string; slug: string; count: number }[];
};

async function rollupAxis(
  axis: Axis,
): Promise<{ label: string; slug: string; count: number }[]> {
  const slugCol =
    axis === "front"
      ? "front_slug"
      : axis === "opponent"
        ? "opponent_slug"
        : "type_slug";
  const labelCol = axis;

  // Neon `sql` template can't interpolate identifiers. Switch on axis.
  let rows: { label: string; slug: string; count: string | number }[];
  if (axis === "front") {
    rows = (await sql()`
      SELECT front AS label, front_slug AS slug, COUNT(*)::int AS count
      FROM videos GROUP BY front, front_slug ORDER BY count DESC
    `) as unknown as typeof rows;
  } else if (axis === "opponent") {
    rows = (await sql()`
      SELECT opponent AS label, opponent_slug AS slug, COUNT(*)::int AS count
      FROM videos GROUP BY opponent, opponent_slug ORDER BY count DESC
    `) as unknown as typeof rows;
  } else {
    rows = (await sql()`
      SELECT type AS label, type_slug AS slug, COUNT(*)::int AS count
      FROM videos GROUP BY type, type_slug ORDER BY count DESC
    `) as unknown as typeof rows;
  }
  void slugCol;
  void labelCol;
  return rows.map((r) => ({
    label: r.label,
    slug: r.slug,
    count: typeof r.count === "string" ? Number(r.count) : r.count,
  }));
}

export async function getLibraryStats(): Promise<LibraryStats> {
  const totalsRow = (await sql()`
    SELECT COUNT(*)::int AS total,
           MIN(date) AS date_min,
           MAX(date) AS date_max
    FROM videos
  `) as unknown as { total: number; date_min: string | null; date_max: string | null }[];

  const first = totalsRow[0] ?? { total: 0, date_min: null, date_max: null };

  const [byFront, byOpponent, byType] = await Promise.all([
    rollupAxis("front"),
    rollupAxis("opponent"),
    rollupAxis("type"),
  ]);

  return {
    total: first.total,
    dateMin: first.date_min,
    dateMax: first.date_max,
    byFront,
    byOpponent,
    byType,
  };
}
