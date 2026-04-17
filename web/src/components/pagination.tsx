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
      className="mt-10 flex items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-sm"
      aria-label="Pagination"
    >
      <div className="font-mono text-xs text-[var(--muted)]">
        Page <span className="text-[var(--foreground)]">{page}</span> of{" "}
        {totalPages}
      </div>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={qs(page - 1)}
            className="rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-2 text-sm transition hover:border-teal-500/40 hover:bg-teal-500/10"
          >
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={qs(page + 1)}
            className="rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-2 text-sm transition hover:border-teal-500/40 hover:bg-teal-500/10"
          >
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
