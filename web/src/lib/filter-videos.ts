import type { Axis, VideoRecord } from "./types";
import { getSlugForAxis } from "./videos";

export type ListFilters = {
  q?: string;
  frontSlug?: string;
  opponentSlug?: string;
  typeSlug?: string;
  dateFrom?: string;
  dateTo?: string;
};

function matchesQuery(v: VideoRecord, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    v.message_text.toLowerCase().includes(needle) ||
    v.front.toLowerCase().includes(needle) ||
    v.opponent.toLowerCase().includes(needle) ||
    v.type.toLowerCase().includes(needle)
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
    if (f.frontSlug && v.frontSlug !== f.frontSlug) return false;
    if (f.opponentSlug && v.opponentSlug !== f.opponentSlug) return false;
    if (f.typeSlug && v.typeSlug !== f.typeSlug) return false;
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
