import Link from "next/link";
import { connection } from "next/server";
import { sql } from "@/lib/db";
import { getLibraryStats } from "@/lib/videos";

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

async function getRecentRuns(): Promise<RunRow[]> {
  const rows = (await sql()`
    SELECT id, kind, started_at, finished_at, status,
           videos_added, videos_updated, error, triggered_by
    FROM scrape_runs ORDER BY started_at DESC LIMIT 5
  `) as unknown as RunRow[];
  return rows;
}

function formatDateTime(iso: string | null): string {
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

export default async function AdminHome() {
  await connection();
  const [stats, runs] = await Promise.all([
    getLibraryStats(),
    getRecentRuns(),
  ]);

  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,4vw,2.5rem)] tracking-[-0.015em] text-[var(--foreground)]">
          Admin dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] text-[var(--muted-strong)]">
          Manage the library, refresh the scrape, and retag the catalog. Public
          pages re-render automatically after any change here.
        </p>
      </header>

      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
          Library at a glance
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Videos" value={stats.total.toLocaleString()} />
          <Stat label="Theaters" value={stats.byFront.length.toString()} />
          <Stat label="Opponents" value={stats.byOpponent.length.toString()} />
          <Stat label="Footage types" value={stats.byType.length.toString()} />
        </div>
        <p className="mt-3 text-[13px] text-[var(--muted)]">
          Range: {stats.dateMin?.slice(0, 10) ?? "—"} →{" "}
          {stats.dateMax?.slice(0, 10) ?? "—"}
        </p>
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            Recent jobs
          </h2>
          <Link
            href="/admin/scrape"
            className="text-[12px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Trigger new run →
          </Link>
        </div>
        {runs.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[13px] text-[var(--muted)]">
            No jobs have run yet. Head over to &ldquo;Scrape &amp; retag&rdquo;
            to kick off the first one.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--background-elev)] shadow-[var(--shadow-sm)]">
            {runs.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  {r.kind}
                </span>
                <span className="text-[13px] text-[var(--foreground)]">
                  {formatDateTime(r.started_at)}
                </span>
                <StatusBadge status={r.status} />
                <span className="text-[12px] text-[var(--muted)]">
                  +{r.videos_added} new · {r.videos_updated} updated
                </span>
                {r.error && (
                  <span className="text-[12px] text-red-700">
                    {r.error.slice(0, 80)}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-elev)] p-5 shadow-[var(--shadow-sm)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl tabular-nums tracking-[-0.01em] text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700",
    running: "bg-amber-50 text-amber-700",
    error: "bg-red-50 text-red-700",
  };
  const cls = map[status] ?? "bg-[var(--surface)] text-[var(--muted-strong)]";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}
    >
      {status}
    </span>
  );
}
