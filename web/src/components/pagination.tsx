import Link from "next/link";

export function Pagination({
  basePath,
  searchParams,
  page,
  totalPages,
}: {
  basePath: string;
  searchParams: Record<string, string | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const qs = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v != null && v !== "" && k !== "page") sp.set(k, v);
    }
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <nav
      className="mt-10 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-8 text-sm"
      aria-label="Pagination"
    >
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
        Page <span className="text-[var(--foreground)]">{page}</span> of{" "}
        {totalPages}
      </div>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={qs(page - 1)}
            className="inline-flex min-h-[40px] items-center rounded-full border border-[var(--border)] bg-[var(--background-elev)] px-5 py-2 text-[13px] font-medium text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
          >
            ← Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={qs(page + 1)}
            className="inline-flex min-h-[40px] items-center rounded-full bg-[var(--foreground)] px-5 py-2 text-[13px] font-medium text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
          >
            Next →
          </Link>
        )}
      </div>
    </nav>
  );
}
