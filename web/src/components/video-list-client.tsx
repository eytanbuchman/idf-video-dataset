"use client";

import { useCallback, useState } from "react";
import type { VideoRecord } from "@/lib/types";
import { VideoCard } from "./video-card";

export function VideoListClient({
  pageVideos,
  exportLabel = "Export CSV",
  onVideoOpen,
}: {
  pageVideos: VideoRecord[];
  exportLabel?: string;
  onVideoOpen?: (v: VideoRecord) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const selectAllPage = useCallback(() => {
    setSelected(new Set(pageVideos.map((v) => v.slug)));
  }, [pageVideos]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const exportCsv = useCallback(async () => {
    if (selected.size < 2) return;
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs: [...selected] }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `idf-videos-${selected.size}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selected]);

  const showExport = selected.size >= 2;

  return (
    <div className="space-y-3">
      {pageVideos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 backdrop-blur-sm">
          <button
            type="button"
            onClick={selectAllPage}
            className="min-h-[44px] rounded-lg px-3 py-2 text-xs text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-[var(--foreground)]"
          >
            Select page
          </button>
          <button
            type="button"
            onClick={clear}
            className="min-h-[44px] rounded-lg px-3 py-2 text-xs text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-[var(--foreground)]"
          >
            Clear
          </button>
          <span className="mx-1 h-4 w-px bg-white/10" aria-hidden />
          <span className="text-xs text-[var(--muted)]">
            <span className="tabular-nums text-[var(--foreground)]">
              {selected.size}
            </span>{" "}
            selected
          </span>
          {showExport && (
            <button
              type="button"
              onClick={exportCsv}
              className="ml-auto min-h-[44px] rounded-full bg-gradient-to-r from-teal-600/70 to-emerald-800/60 px-4 py-2 text-xs font-semibold text-white/95 shadow-lg shadow-black/20 transition hover:brightness-110"
            >
              {exportLabel}
            </button>
          )}
        </div>
      )}
      <div className="space-y-2">
        {pageVideos.map((v) => (
          <VideoCard
            key={v.slug}
            v={v}
            showCheckbox
            selected={selected.has(v.slug)}
            onToggle={() => toggle(v.slug)}
            onOpen={onVideoOpen}
          />
        ))}
      </div>
    </div>
  );
}
