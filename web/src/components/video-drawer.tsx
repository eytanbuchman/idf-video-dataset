"use client";

import Link from "next/link";
import { useEffect, useCallback } from "react";
import type { VideoRecord } from "@/lib/types";
import { AXES } from "@/lib/types";
import { getStreamUrl } from "@/lib/video-url";
import { renderLinkedText, type TagRef } from "@/lib/link-tags";

function excerpt(text: string, max = 100): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function VideoDrawer({
  video,
  open,
  loading,
  onClose,
  tags = [],
}: {
  video: VideoRecord | null;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  tags?: TagRef[];
}) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prev;
    };
  }, [open, handleKey]);

  if (!open) return null;

  if (loading && !video) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4">
        <button
          type="button"
          aria-label="Close"
          className="drawer-scrim absolute inset-0 bg-[rgba(15,17,28,0.28)] backdrop-blur-[3px]"
          onClick={onClose}
        />
        <div className="drawer-panel relative w-full rounded-t-3xl border border-[var(--border)] bg-[var(--background-elev)] p-8 shadow-[var(--shadow-lg)] sm:max-w-md sm:rounded-3xl">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)]" />
          <p className="mt-4 text-center text-sm text-[var(--muted)]">
            Loading clip…
          </p>
        </div>
      </div>
    );
  }

  if (!video) return null;

  const streamUrl = getStreamUrl(video.resolved_url);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="drawer-scrim absolute inset-0 bg-[rgba(15,17,28,0.32)] backdrop-blur-[3px] transition-opacity"
        onClick={onClose}
      />
      <div
        className="drawer-panel relative flex max-h-[min(92dvh,900px)] w-full flex-col rounded-t-3xl border border-[var(--border)] bg-[var(--background-elev)] shadow-[var(--shadow-lg)] sm:max-h-[86vh] sm:max-w-2xl sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-5 pb-4 pt-5 sm:px-7">
          <p
            id="drawer-title"
            className="min-w-0 font-[family-name:var(--font-display)] text-[18px] leading-snug tracking-[-0.01em] text-[var(--foreground)] sm:text-[22px]"
          >
            {excerpt(video.message_text, 90)}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-elev)] text-[var(--muted-strong)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            aria-label="Close panel"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-7 sm:py-6">
          <time
            dateTime={video.date}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]"
          >
            {video.date?.slice(0, 10) ?? "—"}
          </time>

          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0a0b0f] shadow-[var(--shadow-sm)]">
            <video
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black object-contain max-h-[40vh] sm:max-h-[min(50vh,360px)]"
              src={streamUrl}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] text-[13px] font-medium text-[var(--accent)] underline-offset-4 hover:underline"
            >
              Open stream
            </a>
            <a
              href={streamUrl}
              download={video.video_file || "video.mp4"}
              className="min-h-[40px] text-[13px] font-medium text-[var(--accent)] underline-offset-4 hover:underline"
            >
              Download
            </a>
            <Link
              href={`/video/${video.slug}`}
              className="min-h-[40px] text-[13px] text-[var(--muted-strong)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
            >
              Open full page
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              Initial Press Release Update
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-[14px] leading-[1.7] text-[var(--foreground)]">
              {renderLinkedText(video.message_text, tags, {
                onLinkClick: onClose,
              })}
            </p>
          </div>

          <div className="mt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              Categories
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AXES.map((axis) => {
                const href =
                  axis === "front"
                    ? `/browse/front/${video.frontSlug}`
                    : axis === "opponent"
                      ? `/browse/opponent/${video.opponentSlug}`
                      : `/browse/type/${video.typeSlug}`;
                const label =
                  axis === "front"
                    ? `Theater: ${video.front}`
                    : axis === "opponent"
                      ? `Opponent: ${video.opponent}`
                      : `Type: ${video.type}`;
                return (
                  <Link
                    key={axis}
                    href={href}
                    onClick={onClose}
                    className="rounded-full border border-[var(--border)] bg-[var(--background-elev)] px-3 py-1.5 text-[12px] font-medium text-[var(--muted-strong)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
