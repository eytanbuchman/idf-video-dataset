"use client";

import Link from "next/link";
import { useEffect, useCallback } from "react";
import type { VideoRecord } from "@/lib/types";
import { AXES } from "@/lib/types";
import { getStreamUrl } from "@/lib/video-url";

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
}: {
  video: VideoRecord | null;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
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
      <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          onClick={onClose}
        />
        <div className="drawer-panel relative w-full rounded-t-3xl border border-white/[0.07] bg-[#0a0b0f] p-8 shadow-2xl sm:max-w-md sm:rounded-3xl">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-teal-500/50" />
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
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      <div
        className="drawer-panel relative flex max-h-[min(92dvh,900px)] w-full flex-col rounded-t-3xl border border-white/[0.07] bg-[#0a0b0f] shadow-2xl sm:max-h-[85vh] sm:max-w-2xl sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 pb-3 pt-4 sm:px-6">
          <p
            id="drawer-title"
            className="min-w-0 font-[family-name:var(--font-display)] text-lg leading-snug text-[var(--foreground)] sm:text-xl"
          >
            {excerpt(video.message_text, 90)}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-lg text-[var(--muted)] transition hover:bg-white/[0.1] hover:text-[var(--foreground)]"
            aria-label="Close panel"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-5">
          <time
            dateTime={video.date}
            className="font-mono text-xs text-[var(--muted)]"
          >
            {video.date?.slice(0, 10) ?? "—"}
          </time>

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
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-[var(--foreground)] transition hover:border-teal-500/25"
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-900/15 via-transparent to-violet-900/12 p-[1px]">
            <div className="overflow-hidden rounded-2xl bg-black/80">
              <video
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full max-h-[40vh] bg-black object-contain sm:max-h-[min(50vh,360px)]"
                src={streamUrl}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] text-sm text-teal-400/65 underline-offset-4 hover:underline"
            >
              Open stream
            </a>
            <a
              href={streamUrl}
              download={video.video_file || "video.mp4"}
              className="min-h-[44px] text-sm text-teal-400/65 underline-offset-4 hover:underline"
            >
              Download
            </a>
            <Link
              href={`/video/${video.slug}`}
              className="min-h-[44px] text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
            >
              Open full page
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Full text
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]/90">
              {video.message_text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
