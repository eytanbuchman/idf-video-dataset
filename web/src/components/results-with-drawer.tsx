"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { VideoRecord } from "@/lib/types";
import { VideoDrawer } from "@/components/video-drawer";
import { VideoListClient } from "@/components/video-list-client";
import { Pagination } from "@/components/pagination";

export function ResultsWithDrawer({
  pageVideos,
  basePath,
  searchParams: pagerParams,
  page,
  totalPages,
  pageSize,
  totalMatching,
}: {
  pageVideos: VideoRecord[];
  basePath: string;
  searchParams: Record<string, string | undefined>;
  page: number;
  totalPages: number;
  pageSize: number;
  totalMatching: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const vSlug = urlSearchParams.get("v");
  const [remoteCache, setRemoteCache] = useState<Record<string, VideoRecord>>({});

  const drawerVideo = useMemo(() => {
    if (!vSlug) return null;
    const local = pageVideos.find((x) => x.slug === vSlug);
    if (local) return local;
    return remoteCache[vSlug] ?? null;
  }, [vSlug, pageVideos, remoteCache]);

  const drawerLoading = Boolean(vSlug) && !drawerVideo;

  useEffect(() => {
    if (!vSlug) return;
    if (pageVideos.some((x) => x.slug === vSlug)) return;
    if (remoteCache[vSlug]) return;
    const ac = new AbortController();
    fetch(`/api/video/${encodeURIComponent(vSlug)}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((v: VideoRecord) => {
        setRemoteCache((prev) => ({ ...prev, [v.slug]: v }));
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        const params = new URLSearchParams(urlSearchParams.toString());
        params.delete("v");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    return () => ac.abort();
  }, [vSlug, pageVideos, pathname, router, urlSearchParams, remoteCache]);

  const openVideo = useCallback(
    (v: VideoRecord) => {
      setRemoteCache((prev) => ({ ...prev, [v.slug]: v }));
      const params = new URLSearchParams(urlSearchParams.toString());
      params.set("v", v.slug);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, urlSearchParams],
  );

  const closeDrawer = useCallback(() => {
    const params = new URLSearchParams(urlSearchParams.toString());
    params.delete("v");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, urlSearchParams]);

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalMatching);

  const drawerOpen = Boolean(vSlug);

  return (
    <>
      <div className="mb-6 flex flex-col gap-2 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
          Results
        </p>
        <p className="text-sm text-[var(--muted)]">
          <span className="tabular-nums text-[var(--foreground)]">
            {from}–{to}
          </span>
          <span className="mx-1.5 text-white/20">/</span>
          <span className="tabular-nums">{totalMatching.toLocaleString()}</span>
        </p>
      </div>
      <VideoListClient pageVideos={pageVideos} onVideoOpen={openVideo} />
      <Pagination
        basePath={basePath}
        searchParams={pagerParams}
        page={page}
        totalPages={totalPages}
      />
      <VideoDrawer
        video={drawerVideo}
        open={drawerOpen}
        loading={drawerLoading}
        onClose={closeDrawer}
      />
    </>
  );
}
