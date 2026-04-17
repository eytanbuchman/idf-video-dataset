import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-[var(--muted)]">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-2">
            {i > 0 && (
              <span className="text-[var(--border)]" aria-hidden>
                /
              </span>
            )}
            {c.href ? (
              <Link
                href={c.href}
                className="hover:text-[var(--foreground)] transition-colors"
              >
                {c.label}
              </Link>
            ) : (
              <span className="text-[var(--foreground)]">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
