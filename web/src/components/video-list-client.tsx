"use client";

import { useCallback, useState } from "react";
import type { VideoRecord } from "@/lib/types";
import { VideoCard } from "./video-card";

export function VideoListClient({
  pageVideos,
  exportLabel = "Download CSV",
}: {
  pageVideos: VideoRecord[];
  exportLabel?: string;
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
    if (selected.size === 0) return;
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

  return (
    <div>
      {pageVideos.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-4">
          <button
            type="button"
            onClick={selectAllPage}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Select page
          </button>
          <button
            type="button"
            onClick={clear}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Clear
          </button>
          <span className="text-xs text-[var(--muted)]">
            {selected.size} selected
          </span>
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={exportCsv}
            className="rounded-full border border-[var(--foreground)] bg-[var(--foreground)] px-4 py-1.5 text-xs font-medium text-[var(--background)] disabled:opacity-40"
          >
            {exportLabel}
          </button>
        </div>
      )}
      <div>
        {pageVideos.map((v) => (
          <VideoCard
            key={v.slug}
            v={v}
            showCheckbox
            selected={selected.has(v.slug)}
            onToggle={() => toggle(v.slug)}
          />
        ))}
      </div>
    </div>
  );
}
