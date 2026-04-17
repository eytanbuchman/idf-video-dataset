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
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2 shadow-[var(--shadow-sm)]">
          <button
            type="button"
            onClick={selectAllPage}
            className="min-h-[40px] rounded-lg px-3 py-2 text-[12px] font-medium text-[var(--muted-strong)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          >
            Select page
          </button>
          <button
            type="button"
            onClick={clear}
            className="min-h-[40px] rounded-lg px-3 py-2 text-[12px] font-medium text-[var(--muted-strong)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          >
            Clear
          </button>
          <span
            className="mx-1 h-4 w-px bg-[var(--border-strong)]"
            aria-hidden
          />
          <span className="text-[12px] text-[var(--muted)]">
            <span className="tabular-nums text-[var(--foreground)]">
              {selected.size}
            </span>{" "}
            selected
          </span>
          {showExport && (
            <button
              type="button"
              onClick={exportCsv}
              className="ml-auto inline-flex min-h-[40px] items-center rounded-full bg-[var(--foreground)] px-4 py-2 text-[12px] font-semibold text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
            >
              {exportLabel}
            </button>
          )}
        </div>
      )}
      <div className="space-y-3">
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
