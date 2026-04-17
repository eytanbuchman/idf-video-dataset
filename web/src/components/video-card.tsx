"use client";

import Link from "next/link";
import type { VideoRecord } from "@/lib/types";

function excerpt(text: string, max = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function VideoCard({
  v,
  showCheckbox,
  selected,
  onToggle,
}: {
  v: VideoRecord;
  showCheckbox?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const dateShort = v.date ? v.date.slice(0, 10) : "—";
  return (
    <article className="group relative border-b border-[var(--border)] py-4 last:border-0">
      <div className="flex gap-3">
        {showCheckbox && (
          <label className="flex shrink-0 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onToggle}
              className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
            />
            <span className="sr-only">Select video {v.slug}</span>
          </label>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <time
              dateTime={v.date}
              className="font-mono text-xs text-[var(--muted)]"
            >
              {dateShort}
            </time>
            <span className="text-xs text-[var(--accent)]">{v.type}</span>
          </div>
          <Link
            href={`/video/${v.slug}`}
            className="mt-1 block font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
          >
            {excerpt(v.message_text, 120)}
          </Link>
          <p className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span>{v.front}</span>
            <span className="text-[var(--border)]">·</span>
            <span>{v.opponent}</span>
          </p>
        </div>
      </div>
    </article>
  );
}
