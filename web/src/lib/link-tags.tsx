import Link from "next/link";
import type { ReactNode } from "react";
import type { Axis } from "./types";
import { AXES } from "./axes-config";
import type { LibraryStats } from "./videos";

export type TagRef = {
  label: string;
  slug: string;
  axis: Axis;
};

/** Flatten every axis's categories into a single list, longest-label-first
 *  so multi-word tags like "Combat footage" match before "Combat". */
export function buildTagIndex(stats: LibraryStats): TagRef[] {
  const all: TagRef[] = [];
  for (const axis of AXES) {
    for (const row of stats.by[axis]) {
      all.push({ label: row.label, slug: row.slug, axis });
    }
  }
  const seen = new Set<string>();
  const dedup: TagRef[] = [];
  for (const t of all) {
    const key = t.label.trim().toLowerCase();
    if (!key || key === "other" || key === "unknown") continue;
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push({ label: t.label, slug: t.slug, axis: t.axis });
  }
  return dedup.sort((a, b) => b.label.length - a.label.length);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Render text with any substrings matching a known tag label converted to a
 *  Link pointing at /browse/<axis>/<slug>. Case-insensitive whole-word match;
 *  preserves original casing in the output. */
export function renderLinkedText(
  text: string,
  tags: TagRef[],
  opts?: {
    onLinkClick?: () => void;
    linkClassName?: string;
  },
): ReactNode {
  if (!text || tags.length === 0) return text;

  const pattern = tags.map((t) => escapeRegex(t.label)).join("|");
  if (!pattern) return text;
  const re = new RegExp(`(?<![A-Za-z0-9])(${pattern})(?![A-Za-z0-9])`, "gi");

  const byLower = new Map<string, TagRef>();
  for (const t of tags) byLower.set(t.label.toLowerCase(), t);

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  const linkClass =
    opts?.linkClassName ??
    "rounded-md bg-[var(--accent-soft)] px-1 py-0.5 font-medium text-[var(--accent)] underline-offset-2 transition hover:underline";

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    const matched = match[0];
    const tag = byLower.get(matched.toLowerCase());
    if (!tag) continue;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }
    nodes.push(
      <Link
        key={`tag-${key++}-${start}`}
        href={`/browse/${tag.axis}/${tag.slug}`}
        onClick={opts?.onLinkClick}
        className={linkClass}
      >
        {matched}
      </Link>,
    );
    lastIndex = start + matched.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
