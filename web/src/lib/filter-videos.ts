import type { Axis, VideoRecord } from "./types";
import { AXES } from "./axes-config";
import { getSlugForAxis } from "./videos";

/**
 * Per-axis slug filter. Uses a partial keyed by axis id so adding a new
 * axis is a one-line change in `axes-config.ts` without touching this file.
 */
export type AxisFilters = Partial<Record<Axis, string>>;

export type ListFilters = {
  q?: string;
  axes?: AxisFilters;
  flags?: {
    isGraphic?: boolean;
    involvesHostages?: boolean;
    involvesCeasefireViolation?: boolean;
    hasSensitiveContent?: boolean;
  };
  dateFrom?: string;
  dateTo?: string;
};

function matchesQuery(v: VideoRecord, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    v.message_text.toLowerCase().includes(needle) ||
    v.theater.toLowerCase().includes(needle) ||
    v.opponent.toLowerCase().includes(needle) ||
    v.kind.toLowerCase().includes(needle) ||
    v.domain.toLowerCase().includes(needle) ||
    v.posture.toLowerCase().includes(needle)
  );
}

function dateInRange(iso: string, from?: string, to?: string): boolean {
  if (!iso) return true;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return true;
  if (from) {
    const f = Date.parse(from);
    if (!Number.isNaN(f) && t < f) return false;
  }
  if (to) {
    const x = Date.parse(to);
    if (!Number.isNaN(x) && t > x + 86400000) return false;
  }
  return true;
}

export function filterVideos(
  list: VideoRecord[],
  f: ListFilters,
): VideoRecord[] {
  return list.filter((v) => {
    if (f.q && !matchesQuery(v, f.q)) return false;
    if (f.axes) {
      for (const axis of AXES) {
        const want = f.axes[axis];
        if (want && getSlugForAxis(v, axis) !== want) return false;
      }
    }
    if (f.flags) {
      if (f.flags.isGraphic && !v.isGraphic) return false;
      if (f.flags.involvesHostages && !v.involvesHostages) return false;
      if (
        f.flags.involvesCeasefireViolation &&
        !v.involvesCeasefireViolation
      )
        return false;
      if (f.flags.hasSensitiveContent && !v.hasSensitiveContent) return false;
    }
    if (!dateInRange(v.date, f.dateFrom, f.dateTo)) return false;
    return true;
  });
}

export function filterByPillar(
  list: VideoRecord[],
  axis: Axis,
  categorySlug: string,
): VideoRecord[] {
  return list.filter((v) => getSlugForAxis(v, axis) === categorySlug);
}

export function sortByDateDesc(list: VideoRecord[]): VideoRecord[] {
  return [...list].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

/** True when any filter is active — used to decide whether to show the
 *  landing "last 10" slice vs. full paginated results. */
export function hasAnyFilter(f: ListFilters): boolean {
  if (f.q) return true;
  if (f.dateFrom || f.dateTo) return true;
  if (f.axes && Object.values(f.axes).some((v) => !!v)) return true;
  if (f.flags && Object.values(f.flags).some((v) => !!v)) return true;
  return false;
}
