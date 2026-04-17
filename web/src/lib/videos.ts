import type { Axis, VideoRecord } from "./types";
import { AXES, AXIS_CONFIG } from "./types";
import { sql } from "./db";

// Kept for api compatibility with admin-actions / api routes. Pages render
// dynamically, so there's nothing to tag — these are stubs.
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

  theater: string;
  theater_slug: string;
  opponent: string;
  opponent_slug: string;
  kind: string;
  kind_slug: string;
  domain: string;
  domain_slug: string;
  posture: string;
  posture_slug: string;

  is_graphic: boolean;
  involves_hostages: boolean;
  involves_ceasefire_violation: boolean;
  has_sensitive_content: boolean;
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
    theater: r.theater ?? "Unknown",
    theaterSlug: r.theater_slug ?? "unknown",
    opponent: r.opponent ?? "Unknown",
    opponentSlug: r.opponent_slug ?? "unknown",
    kind: r.kind ?? "Unknown",
    kindSlug: r.kind_slug ?? "unknown",
    domain: r.domain ?? "Multi-domain",
    domainSlug: r.domain_slug ?? "multi-domain",
    posture: r.posture ?? "Informational",
    postureSlug: r.posture_slug ?? "informational",
    isGraphic: Boolean(r.is_graphic),
    involvesHostages: Boolean(r.involves_hostages),
    involvesCeasefireViolation: Boolean(r.involves_ceasefire_violation),
    hasSensitiveContent: Boolean(r.has_sensitive_content),
  };
}

// ---------------------------------------------------------------------------
// Data accessors
// ---------------------------------------------------------------------------

export async function getAllVideos(): Promise<VideoRecord[]> {
  const rows = (await sql()`
    SELECT slug, id, message_id, date, bitly_url, resolved_url, video_file, message_text,
           theater, theater_slug, opponent, opponent_slug, kind, kind_slug,
           domain, domain_slug, posture, posture_slug,
           is_graphic, involves_hostages, involves_ceasefire_violation, has_sensitive_content
    FROM videos
    ORDER BY date DESC
  `) as unknown as VideoRow[];
  return rows.map(mapRow);
}

export async function getVideoBySlug(
  slug: string,
): Promise<VideoRecord | undefined> {
  const rows = (await sql()`
    SELECT slug, id, message_id, date, bitly_url, resolved_url, video_file, message_text,
           theater, theater_slug, opponent, opponent_slug, kind, kind_slug,
           domain, domain_slug, posture, posture_slug,
           is_graphic, involves_hostages, involves_ceasefire_violation, has_sensitive_content
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
// Axis-aware helpers (no I/O)
// ---------------------------------------------------------------------------

export { axisLabel, isAxis } from "./types";

export function getSlugForAxis(v: VideoRecord, axis: Axis): string {
  switch (axis) {
    case "theater":
      return v.theaterSlug;
    case "opponent":
      return v.opponentSlug;
    case "kind":
      return v.kindSlug;
    case "domain":
      return v.domainSlug;
    case "posture":
      return v.postureSlug;
  }
}

export function getLabelForAxis(v: VideoRecord, axis: Axis): string {
  switch (axis) {
    case "theater":
      return v.theater;
    case "opponent":
      return v.opponent;
    case "kind":
      return v.kind;
    case "domain":
      return v.domain;
    case "posture":
      return v.posture;
  }
}

// ---------------------------------------------------------------------------
// Library stats (rollups across the dataset)
// ---------------------------------------------------------------------------

export type AxisRollup = { label: string; slug: string; count: number }[];

export type LibraryStats = {
  total: number;
  dateMin: string | null;
  dateMax: string | null;
  by: Record<Axis, AxisRollup>;
  flags: {
    isGraphic: number;
    involvesHostages: number;
    involvesCeasefireViolation: number;
    hasSensitiveContent: number;
  };
};

async function rollupAxis(axis: Axis): Promise<AxisRollup> {
  const cfg = AXIS_CONFIG[axis];
  // `cfg.valueColumn` / `cfg.slugColumn` come from our own static config so
  // it's safe to inline into the SQL here; they are never user input.
  const q = `
    SELECT ${cfg.valueColumn} AS label,
           ${cfg.slugColumn}  AS slug,
           COUNT(*)::int      AS count
      FROM videos
     GROUP BY ${cfg.valueColumn}, ${cfg.slugColumn}
     ORDER BY count DESC
  `;
  const rows = (await sql().query(q)) as unknown as {
    label: string;
    slug: string;
    count: string | number;
  }[];
  return rows.map((r) => ({
    label: r.label ?? "Unknown",
    slug: r.slug ?? "unknown",
    count: typeof r.count === "string" ? Number(r.count) : r.count,
  }));
}

export async function getLibraryStats(): Promise<LibraryStats> {
  const totalsRow = (await sql()`
    SELECT COUNT(*)::int AS total,
           MIN(date)     AS date_min,
           MAX(date)     AS date_max,
           COUNT(*) FILTER (WHERE is_graphic)::int                   AS c_graphic,
           COUNT(*) FILTER (WHERE involves_hostages)::int            AS c_hostages,
           COUNT(*) FILTER (WHERE involves_ceasefire_violation)::int AS c_ceasefire,
           COUNT(*) FILTER (WHERE has_sensitive_content)::int        AS c_sensitive
    FROM videos
  `) as unknown as {
    total: number;
    date_min: string | null;
    date_max: string | null;
    c_graphic: number;
    c_hostages: number;
    c_ceasefire: number;
    c_sensitive: number;
  }[];

  const first = totalsRow[0] ?? {
    total: 0,
    date_min: null,
    date_max: null,
    c_graphic: 0,
    c_hostages: 0,
    c_ceasefire: 0,
    c_sensitive: 0,
  };

  const rollups = await Promise.all(AXES.map((axis) => rollupAxis(axis)));
  const by = Object.fromEntries(
    AXES.map((axis, i) => [axis, rollups[i]]),
  ) as Record<Axis, AxisRollup>;

  return {
    total: first.total,
    dateMin: first.date_min,
    dateMax: first.date_max,
    by,
    flags: {
      isGraphic: first.c_graphic,
      involvesHostages: first.c_hostages,
      involvesCeasefireViolation: first.c_ceasefire,
      hasSensitiveContent: first.c_sensitive,
    },
  };
}
