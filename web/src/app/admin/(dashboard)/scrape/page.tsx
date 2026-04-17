import { sql } from "@/lib/db";

type RunRow = {
  id: string;
  kind: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  videos_added: number;
  videos_updated: number;
  error: string | null;
  triggered_by: string;
};

async function loadRuns(): Promise<RunRow[]> {
  const rows = (await sql()`
    SELECT id, kind, started_at, finished_at, status,
           videos_added, videos_updated, error, triggered_by
    FROM scrape_runs ORDER BY started_at DESC LIMIT 15
  `) as unknown as RunRow[];
  return rows;
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ScrapePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const queued = Array.isArray(sp.queued) ? sp.queued[0] : sp.queued;

  const runs = await loadRuns();
  const repoConfigured = Boolean(process.env.GITHUB_REPO && process.env.GITHUB_DISPATCH_TOKEN);

  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3vw,2rem)] tracking-[-0.015em] text-[var(--foreground)]">
          Scrape &amp; retag
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] text-[var(--muted-strong)]">
          These buttons dispatch GitHub Actions workflows. The actual
          scrape/retag runs on GitHub and writes back to the database. You can
          close this tab — the dashboard will reflect the latest state.
        </p>
      </header>

      {queued === "scrape" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] text-emerald-800">
          Scrape workflow dispatched. Check back in a few minutes.
        </div>
      )}
      {queued === "retag" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] text-emerald-800">
          Retag workflow dispatched. Check back in a few minutes.
        </div>
      )}
      {!repoConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <p className="font-semibold">Not fully configured yet.</p>
          <p className="mt-1">
            Set <code>GITHUB_REPO</code> (e.g. <code>eytan/idf-video</code>) and{" "}
            <code>GITHUB_DISPATCH_TOKEN</code> (a fine-grained PAT with{" "}
            <em>Actions: Read and write</em>) in the Vercel project env before
            using these buttons.
          </p>
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <form
          method="POST"
          action="/api/admin/scrape"
          className="rounded-2xl border border-[var(--border)] bg-[var(--background-elev)] p-6 shadow-[var(--shadow-sm)]"
        >
          <h2 className="font-[family-name:var(--font-display)] text-xl tracking-[-0.01em] text-[var(--foreground)]">
            Refresh scrape
          </h2>
          <p className="mt-2 text-[13px] text-[var(--muted-strong)]">
            Pull any new Telegram posts since the last run and add them to the
            library. Runs incrementally by default.
          </p>
          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2 text-[13px] text-[var(--foreground)]">
              <input type="radio" name="mode" value="incremental" defaultChecked />
              Incremental (only new posts)
            </label>
            <label className="flex items-center gap-2 text-[13px] text-[var(--foreground)]">
              <input type="radio" name="mode" value="full" />
              Full rescrape (since 2023-10-07)
            </label>
          </div>
          <button
            type="submit"
            className="mt-5 rounded-full bg-[var(--foreground)] px-5 py-2 text-[13px] font-medium text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
          >
            Dispatch scrape
          </button>
        </form>

        <form
          method="POST"
          action="/api/admin/retag"
          className="rounded-2xl border border-[var(--border)] bg-[var(--background-elev)] p-6 shadow-[var(--shadow-sm)]"
        >
          <h2 className="font-[family-name:var(--font-display)] text-xl tracking-[-0.01em] text-[var(--foreground)]">
            Retag everything
          </h2>
          <p className="mt-2 text-[13px] text-[var(--muted-strong)]">
            Re-run GPT classification on every video using the current tag
            list. Use this after adding a new tag or relabeling an existing one.
          </p>
          <button
            type="submit"
            className="mt-5 rounded-full bg-[var(--foreground)] px-5 py-2 text-[13px] font-medium text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
          >
            Dispatch retag
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
          Recent jobs
        </h2>
        {runs.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[13px] text-[var(--muted)]">
            No runs yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--background-elev)] shadow-[var(--shadow-sm)]">
            {runs.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  {r.kind}
                </span>
                <span className="text-[13px] text-[var(--foreground)]">
                  {fmt(r.started_at)}
                </span>
                <span className="text-[12px] text-[var(--muted)]">
                  → {fmt(r.finished_at)}
                </span>
                <Badge status={r.status} />
                <span className="text-[12px] text-[var(--muted)]">
                  +{r.videos_added} new · {r.videos_updated} updated
                </span>
                {r.error && (
                  <span className="text-[12px] text-red-700">
                    {r.error.slice(0, 120)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700",
    running: "bg-amber-50 text-amber-700",
    error: "bg-red-50 text-red-700",
  };
  const cls = map[status] ?? "bg-[var(--surface)] text-[var(--muted-strong)]";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  );
}
