import Link from "next/link";
import { connection } from "next/server";
import { sql } from "@/lib/db";
import { getLibraryStats } from "@/lib/videos";

const PAGE_SIZE = 20;

type Row = {
  slug: string;
  date: string;
  front: string;
  opponent: string;
  type: string;
  message_text: string;
};

type Search = {
  q?: string;
  front?: string;
  opponent?: string;
  type?: string;
  page?: string;
};

async function loadVideos(search: Search): Promise<{
  rows: Row[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = Math.max(1, parseInt(search.page ?? "1", 10) || 1);

  const q = (search.q ?? "").trim();
  const front = (search.front ?? "").trim();
  const opponent = (search.opponent ?? "").trim();
  const type = (search.type ?? "").trim();

  const like = q ? `%${q}%` : null;

  const rows = (await sql()`
    SELECT slug, date, front, opponent, type, message_text
    FROM videos
    WHERE (${like}::text IS NULL OR message_text ILIKE ${like})
      AND (${front || null}::text IS NULL OR front_slug = ${front || null})
      AND (${opponent || null}::text IS NULL OR opponent_slug = ${opponent || null})
      AND (${type || null}::text IS NULL OR type_slug = ${type || null})
    ORDER BY date DESC
    LIMIT ${PAGE_SIZE}
    OFFSET ${(page - 1) * PAGE_SIZE}
  `) as unknown as Row[];

  const totalRows = (await sql()`
    SELECT COUNT(*)::int AS c FROM videos
    WHERE (${like}::text IS NULL OR message_text ILIKE ${like})
      AND (${front || null}::text IS NULL OR front_slug = ${front || null})
      AND (${opponent || null}::text IS NULL OR opponent_slug = ${opponent || null})
      AND (${type || null}::text IS NULL OR type_slug = ${type || null})
  `) as unknown as { c: number }[];

  const total = totalRows[0]?.c ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return { rows, total, page: Math.min(page, totalPages), totalPages };
}

function excerpt(t: string, max = 140): string {
  const s = (t ?? "").replace(/\s+/g, " ").trim();
  return s.length <= max ? s : s.slice(0, max) + "…";
}

export default async function AdminVideosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const raw = await searchParams;
  const g = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const search: Search = {
    q: g("q"),
    front: g("front"),
    opponent: g("opponent"),
    type: g("type"),
    page: g("page"),
  };
  const saved = g("saved") === "1";
  const deleted = g("deleted") === "1";

  const [stats, data] = await Promise.all([
    getLibraryStats(),
    loadVideos(search),
  ]);

  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (search.q) p.set("q", search.q);
    if (search.front) p.set("front", search.front);
    if (search.opponent) p.set("opponent", search.opponent);
    if (search.type) p.set("type", search.type);
    for (const [k, v] of Object.entries(extra)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3vw,2rem)] tracking-[-0.015em] text-[var(--foreground)]">
          Videos
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
          {data.total.toLocaleString()} total
        </p>
      </header>

      {saved && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] text-emerald-800">
          Saved.
        </div>
      )}
      {deleted && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] text-emerald-800">
          Video deleted.
        </div>
      )}

      <form
        method="get"
        className="mb-8 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background-elev)] p-4 shadow-[var(--shadow-sm)] md:grid-cols-5"
      >
        <input
          name="q"
          type="search"
          defaultValue={search.q ?? ""}
          placeholder="Search message text…"
          className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)] md:col-span-2"
        />
        <select
          name="front"
          defaultValue={search.front ?? ""}
          className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none"
        >
          <option value="">Any front</option>
          {stats.byFront.map((x) => (
            <option key={x.slug} value={x.slug}>
              {x.label}
            </option>
          ))}
        </select>
        <select
          name="opponent"
          defaultValue={search.opponent ?? ""}
          className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none"
        >
          <option value="">Any opponent</option>
          {stats.byOpponent.map((x) => (
            <option key={x.slug} value={x.slug}>
              {x.label}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={search.type ?? ""}
          className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none"
        >
          <option value="">Any type</option>
          {stats.byType.map((x) => (
            <option key={x.slug} value={x.slug}>
              {x.label}
            </option>
          ))}
        </select>
        <div className="md:col-span-5 flex gap-2">
          <button
            type="submit"
            className="rounded-full bg-[var(--foreground)] px-5 py-2 text-[12px] font-semibold text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
          >
            Filter
          </button>
          <Link
            href="/admin/videos"
            className="rounded-full border border-[var(--border)] bg-[var(--background-elev)] px-4 py-2 text-[12px] font-medium text-[var(--muted-strong)] transition hover:bg-[var(--surface)]"
          >
            Clear
          </Link>
        </div>
      </form>

      <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--background-elev)] shadow-[var(--shadow-sm)]">
        {data.rows.map((r) => (
          <li key={r.slug} className="flex flex-wrap items-start gap-4 px-5 py-4">
            <time
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]"
              dateTime={r.date}
            >
              {r.date?.slice(0, 10) ?? "—"}
            </time>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] leading-snug text-[var(--foreground)]">
                {excerpt(r.message_text)}
              </p>
              <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">
                {r.front} · {r.opponent} · {r.type}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/admin/videos/${encodeURIComponent(r.slug)}`}
                className="rounded-full border border-[var(--border)] bg-[var(--background-elev)] px-3 py-1.5 text-[12px] font-medium text-[var(--muted-strong)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              >
                Edit
              </Link>
              <Link
                href={`/video/${encodeURIComponent(r.slug)}`}
                target="_blank"
                className="text-[12px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
              >
                View
              </Link>
            </div>
          </li>
        ))}
        {data.rows.length === 0 && (
          <li className="px-5 py-10 text-center text-[13px] text-[var(--muted)]">
            No videos match these filters.
          </li>
        )}
      </ul>

      {data.totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-between">
          {data.page > 1 ? (
            <Link
              href={`/admin/videos${qs({ page: String(data.page - 1) })}`}
              className="rounded-full border border-[var(--border)] bg-[var(--background-elev)] px-4 py-2 text-[12px] font-medium text-[var(--muted-strong)] transition hover:bg-[var(--surface)]"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Page {data.page} / {data.totalPages}
          </p>
          {data.page < data.totalPages ? (
            <Link
              href={`/admin/videos${qs({ page: String(data.page + 1) })}`}
              className="rounded-full border border-[var(--border)] bg-[var(--background-elev)] px-4 py-2 text-[12px] font-medium text-[var(--muted-strong)] transition hover:bg-[var(--surface)]"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
