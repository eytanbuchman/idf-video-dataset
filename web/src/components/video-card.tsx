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
  onOpen,
}: {
  v: VideoRecord;
  showCheckbox?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  /** Opens in-drawer preview instead of navigating to /video */
  onOpen?: (video: VideoRecord) => void;
}) {
  const dateShort = v.date ? v.date.slice(0, 10) : "—";
  const title = excerpt(v.message_text, 120);

  return (
    <article className="group relative py-2">
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-4 transition duration-300 hover:border-teal-500/20 hover:from-white/[0.05] hover:shadow-[0_0_0_1px_rgba(45,212,191,0.06)]">
        <div className="flex gap-3">
          {showCheckbox && (
            <label
              className="flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-start justify-center pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={!!selected}
                onChange={onToggle}
                className="mt-1 h-5 w-5 rounded border-white/20 bg-black/40 accent-teal-500/80"
              />
              <span className="sr-only">Select video {v.slug}</span>
            </label>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <time
                dateTime={v.date}
                className="font-mono text-[11px] text-[var(--muted)]"
              >
                {dateShort}
              </time>
              <span className="rounded-full bg-violet-500/8 px-2 py-0.5 text-[11px] text-violet-300/75 ring-1 ring-violet-500/15">
                {v.type}
              </span>
            </div>
            {onOpen ? (
              <button
                type="button"
                onClick={() => onOpen(v)}
                className="mt-2 w-full text-left text-[15px] font-medium leading-snug text-[var(--foreground)] transition group-hover:text-teal-200/80"
              >
                {title}
              </button>
            ) : (
              <Link
                href={`/video/${v.slug}`}
                className="mt-2 block text-[15px] font-medium leading-snug text-[var(--foreground)] transition group-hover:text-teal-200/80"
              >
                {title}
              </Link>
            )}
            <p className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[var(--muted)]">
              <span className="rounded-md bg-white/[0.04] px-2 py-0.5">
                {v.front}
              </span>
              <span className="text-white/15">·</span>
              <span className="rounded-md bg-white/[0.04] px-2 py-0.5">
                {v.opponent}
              </span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
