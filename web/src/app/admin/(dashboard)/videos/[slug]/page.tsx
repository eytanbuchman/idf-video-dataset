import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { deleteVideo, updateVideo } from "@/lib/admin-actions";
import { getAllCategories } from "@/lib/category-copy";
import { AXES, AXIS_CONFIG, FLAG_CONFIG } from "@/lib/axes-config";
import { getLabelForAxis, getVideoBySlug } from "@/lib/videos";
import type { Axis } from "@/lib/types";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditVideoPage({ params, searchParams }: Props) {
  await connection();
  const { slug } = await params;
  const sp = await searchParams;
  const saved = (Array.isArray(sp.saved) ? sp.saved[0] : sp.saved) === "1";

  const [v, categories] = await Promise.all([
    getVideoBySlug(slug),
    getAllCategories(),
  ]);
  if (!v) notFound();

  const byAxis: Record<Axis, { label: string; slug: string }[]> = {
    theater: [],
    opponent: [],
    kind: [],
    domain: [],
    posture: [],
  };
  for (const c of categories) {
    if (c.axis in byAxis) {
      byAxis[c.axis as Axis].push({ label: c.label, slug: c.slug });
    }
  }

  const dateInputValue = v.date ? v.date.slice(0, 10) : "";

  return (
    <div className="max-w-3xl">
      <nav className="mb-6 text-[13px] text-[var(--muted)]">
        <Link href="/admin/videos" className="hover:text-[var(--accent)]">
          ← Videos
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3vw,2rem)] tracking-[-0.015em] text-[var(--foreground)]">
          Edit video
        </h1>
        <p className="mt-2 font-mono text-[11px] text-[var(--muted)]">
          slug: {v.slug} · message_id: {v.message_id}
        </p>
      </header>

      {saved && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] text-emerald-800">
          Saved.
        </div>
      )}

      <form action={updateVideo} className="space-y-5">
        <input type="hidden" name="slug" value={v.slug} />

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Date
          </span>
          <input
            name="date"
            type="date"
            defaultValue={dateInputValue}
            className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          />
        </label>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {AXES.map((axis) => {
            const current = getLabelForAxis(v, axis);
            const rows = byAxis[axis];
            return (
              <label key={axis} className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {AXIS_CONFIG[axis].label}
                </span>
                <select
                  name={axis}
                  defaultValue={current}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none"
                >
                  {rows.map((c) => (
                    <option key={c.slug} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                  {!rows.some((c) => c.label === current) && (
                    <option value={current}>{current} (unlisted)</option>
                  )}
                </select>
              </label>
            );
          })}
        </div>

        <fieldset className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] p-4">
          <legend className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Flags
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {FLAG_CONFIG.map((f) => {
              const checked = Boolean(
                (v as unknown as Record<string, boolean>)[f.field],
              );
              return (
                <label
                  key={f.key}
                  className="inline-flex items-center gap-2 text-[13px] text-[var(--muted-strong)]"
                  title={f.description}
                >
                  <input
                    type="checkbox"
                    name={f.key}
                    value="1"
                    defaultChecked={checked}
                    className="h-[16px] w-[16px] accent-[var(--foreground)]"
                  />
                  {f.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Message text
          </span>
          <textarea
            name="message_text"
            defaultValue={v.message_text}
            rows={10}
            className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-4 py-3 text-[14px] leading-relaxed text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Resolved video URL
          </span>
          <input
            name="resolved_url"
            type="url"
            defaultValue={v.resolved_url}
            className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 font-mono text-[12px] text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <button
            type="submit"
            className="rounded-full bg-[var(--foreground)] px-6 py-2.5 text-[13px] font-medium text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
          >
            Save changes
          </button>
          <Link
            href={`/video/${encodeURIComponent(v.slug)}`}
            target="_blank"
            className="text-[13px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          >
            View public page ↗
          </Link>
        </div>
      </form>

      <form
        action={deleteVideo}
        className="mt-14 rounded-2xl border border-red-200 bg-red-50/60 p-5"
      >
        <input type="hidden" name="slug" value={v.slug} />
        <h2 className="text-[13px] font-semibold text-red-800">Danger zone</h2>
        <p className="mt-1 text-[12px] text-red-700">
          Permanently remove this row from the library. Cannot be undone.
        </p>
        <button
          type="submit"
          className="mt-3 rounded-full border border-red-300 bg-white px-4 py-2 text-[12px] font-medium text-red-700 shadow-sm transition hover:bg-red-50"
        >
          Delete video
        </button>
      </form>
    </div>
  );
}
