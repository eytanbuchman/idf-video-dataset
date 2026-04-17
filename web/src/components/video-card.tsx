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
  const title = excerpt(v.message_text, 160);

  const handleOpen = () => {
    if (onOpen) onOpen(v);
  };

  return (
    <article className="group relative">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-elev)] p-5 shadow-[var(--shadow-sm)] transition duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] sm:p-6">
        <div className="flex items-start gap-4">
          {showCheckbox && (
            <label
              className="flex min-h-[44px] min-w-[24px] shrink-0 cursor-pointer items-start justify-center pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={!!selected}
                onChange={onToggle}
                className="mt-0.5 h-[18px] w-[18px] rounded border-[var(--border-strong)] accent-[var(--foreground)]"
              />
              <span className="sr-only">Select video {v.slug}</span>
            </label>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <time
                dateTime={v.date}
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]"
              >
                {dateShort}
              </time>
              <span
                className="inline-block h-1 w-1 rounded-full bg-[var(--border-strong)]"
                aria-hidden
              />
              <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted-strong)]">
                {v.type}
              </span>
            </div>
            {onOpen ? (
              <button
                type="button"
                onClick={handleOpen}
                className="mt-2.5 block w-full text-left text-[15px] font-medium leading-snug text-[var(--foreground)] transition group-hover:text-[var(--accent)] sm:text-[15.5px]"
              >
                {title}
              </button>
            ) : (
              <Link
                href={`/video/${v.slug}`}
                className="mt-2.5 block text-[15px] font-medium leading-snug text-[var(--foreground)] transition group-hover:text-[var(--accent)] sm:text-[15.5px]"
              >
                {title}
              </Link>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted-strong)]">
                {v.front}
              </span>
              <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted-strong)]">
                {v.opponent}
              </span>
            </div>
          </div>
          <div className="shrink-0 self-center">
            {onOpen ? (
              <button
                type="button"
                onClick={handleOpen}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[var(--foreground)] px-4 py-2 text-[13px] font-medium text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
                aria-label={`View ${title}`}
              >
                View
                <span
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                >
                  →
                </span>
              </button>
            ) : (
              <Link
                href={`/video/${v.slug}`}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[var(--foreground)] px-4 py-2 text-[13px] font-medium text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
              >
                View
                <span
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                >
                  →
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
