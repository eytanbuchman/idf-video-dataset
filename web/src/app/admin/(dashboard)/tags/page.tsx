import { sql } from "@/lib/db";
import { deleteCategory, upsertCategory } from "@/lib/admin-actions";
import { getAllCategories, type CategoryRow } from "@/lib/category-copy";
import type { Axis } from "@/lib/types";

type CountRow = { axis: Axis; slug: string; c: number };

async function getCategoryCounts(): Promise<Map<string, number>> {
  const rows = (await sql()`
    SELECT 'front'::text AS axis, front_slug AS slug, COUNT(*)::int AS c FROM videos GROUP BY front_slug
    UNION ALL
    SELECT 'opponent'::text, opponent_slug, COUNT(*)::int FROM videos GROUP BY opponent_slug
    UNION ALL
    SELECT 'type'::text, type_slug, COUNT(*)::int FROM videos GROUP BY type_slug
  `) as unknown as CountRow[];
  const m = new Map<string, number>();
  for (const r of rows) m.set(`${r.axis}:${r.slug}`, r.c);
  return m;
}

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const g = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const saved = g("saved") === "1";
  const deleted = g("deleted") === "1";
  const inUse = g("in_use");
  const inUseCount = g("count");

  const [cats, counts] = await Promise.all([
    getAllCategories(),
    getCategoryCounts(),
  ]);

  const grouped: Record<Axis, CategoryRow[]> = {
    front: cats.filter((c) => c.axis === "front"),
    opponent: cats.filter((c) => c.axis === "opponent"),
    type: cats.filter((c) => c.axis === "type"),
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3vw,2rem)] tracking-[-0.015em] text-[var(--foreground)]">
          Tags &amp; categories
        </h1>
        <p className="max-w-lg text-[13px] text-[var(--muted)]">
          Edit labels, taglines, and intro copy for each category page. Renames
          automatically propagate to every video that used the old label.
        </p>
      </header>

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] text-emerald-800">
          Saved.
        </div>
      )}
      {deleted && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] text-emerald-800">
          Tag deleted.
        </div>
      )}
      {inUse && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-[13px] text-amber-800">
          Tag <strong>{inUse}</strong> still referenced by {inUseCount} videos.
          Reassign them before deleting.
        </div>
      )}

      {(["front", "opponent", "type"] as Axis[]).map((axis) => (
        <section key={axis}>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              {axisLabel(axis)}
            </h2>
            <p className="text-[12px] text-[var(--muted)]">
              {grouped[axis].length} tags
            </p>
          </div>

          <div className="space-y-4">
            {grouped[axis].map((c) => {
              const count = counts.get(`${c.axis}:${c.slug}`) ?? 0;
              return (
                <form
                  key={`${axis}:${c.slug}`}
                  action={upsertCategory}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--background-elev)] p-5 shadow-[var(--shadow-sm)]"
                >
                  <input type="hidden" name="axis" value={axis} />
                  <input type="hidden" name="old_label" value={c.label} />
                  <input type="hidden" name="slug" value={c.slug} />

                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-mono text-[11px] text-[var(--muted)]">
                      slug: {c.slug} · {count} videos
                    </p>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Label
                      </span>
                      <input
                        name="label"
                        defaultValue={c.label}
                        className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2 text-[13px] text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Tagline
                      </span>
                      <input
                        name="tagline"
                        defaultValue={c.tagline}
                        className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2 text-[13px] text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                      />
                    </label>
                  </div>
                  <label className="mt-3 flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Intro copy
                    </span>
                    <textarea
                      name="intro"
                      defaultValue={c.intro}
                      rows={3}
                      className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2 text-[13px] leading-relaxed text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                    />
                  </label>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="submit"
                      className="rounded-full bg-[var(--foreground)] px-4 py-1.5 text-[12px] font-medium text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
                    >
                      Save
                    </button>
                    <button
                      type="submit"
                      formAction={deleteCategory}
                      className="text-[12px] font-medium text-red-700 underline-offset-2 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </form>
              );
            })}

            {/* Add new tag */}
            <form
              action={upsertCategory}
              className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-5"
            >
              <input type="hidden" name="axis" value={axis} />
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                Add new {axis} tag
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Label
                  </span>
                  <input
                    name="label"
                    required
                    className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2 text-[13px] text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Tagline (optional)
                  </span>
                  <input
                    name="tagline"
                    className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2 text-[13px] text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                  />
                </label>
              </div>
              <label className="mt-3 flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Intro copy (optional)
                </span>
                <textarea
                  name="intro"
                  rows={3}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2 text-[13px] leading-relaxed text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                />
              </label>
              <div className="mt-4">
                <button
                  type="submit"
                  className="rounded-full bg-[var(--foreground)] px-4 py-1.5 text-[12px] font-medium text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
                >
                  Add tag
                </button>
              </div>
            </form>
          </div>
        </section>
      ))}
    </div>
  );
}

function axisLabel(axis: Axis): string {
  return axis === "front" ? "Fronts" : axis === "opponent" ? "Opponents" : "Footage types";
}
