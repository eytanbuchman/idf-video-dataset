import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link href="/" className="group">
          <span className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--foreground)]">
            IDF Video Dataset
          </span>
          <span className="mt-0.5 block text-xs font-normal text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
            Browse · search · export
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/browse"
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Library
          </Link>
        </nav>
      </div>
    </header>
  );
}
