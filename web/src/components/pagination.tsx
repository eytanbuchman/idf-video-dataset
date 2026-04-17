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
      className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-6 text-sm"
      aria-label="Pagination"
    >
      <div className="text-[var(--muted)]">
        Page {page} of {totalPages}
      </div>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={qs(page - 1)}
            className="rounded-full border border-[var(--border)] px-4 py-1.5 hover:border-[var(--foreground)]"
          >
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={qs(page + 1)}
            className="rounded-full border border-[var(--border)] px-4 py-1.5 hover:border-[var(--foreground)]"
          >
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
