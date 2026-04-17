import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { deleteVideo, updateVideo } from "@/lib/admin-actions";
import { getAllCategories } from "@/lib/category-copy";
import { getVideoBySlug } from "@/lib/videos";

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

  const fronts = categories.filter((c) => c.axis === "front");
  const opponents = categories.filter((c) => c.axis === "opponent");
  const types = categories.filter((c) => c.axis === "type");

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

        <div className="grid gap-5 md:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Front
            </span>
            <select
              name="front"
              defaultValue={v.front}
              className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none"
            >
              {fronts.map((c) => (
                <option key={c.slug} value={c.label}>
                  {c.label}
                </option>
              ))}
              {!fronts.some((c) => c.label === v.front) && (
                <option value={v.front}>{v.front} (unlisted)</option>
              )}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Opponent
            </span>
            <select
              name="opponent"
              defaultValue={v.opponent}
              className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none"
            >
              {opponents.map((c) => (
                <option key={c.slug} value={c.label}>
                  {c.label}
                </option>
              ))}
              {!opponents.some((c) => c.label === v.opponent) && (
                <option value={v.opponent}>{v.opponent} (unlisted)</option>
              )}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Type
            </span>
            <select
              name="type"
              defaultValue={v.type}
              className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none"
            >
              {types.map((c) => (
                <option key={c.slug} value={c.label}>
                  {c.label}
                </option>
              ))}
              {!types.some((c) => c.label === v.type) && (
                <option value={v.type}>{v.type} (unlisted)</option>
              )}
            </select>
          </label>
        </div>

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
