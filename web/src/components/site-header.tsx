import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl min-h-[56px] items-center justify-between gap-4 px-4 py-3 sm:py-4 md:px-6">
        <Link
          href="/"
          className="group inline-flex min-h-[44px] items-center gap-2.5 py-1"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--foreground)] font-[family-name:var(--font-display)] text-[13px] leading-none text-[var(--background-elev)]"
            aria-hidden
          >
            ID
          </span>
          <span className="font-[family-name:var(--font-display)] text-[17px] leading-none tracking-[-0.01em] text-[var(--foreground)] sm:text-[18px]">
            IDF Video Dataset
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/browse"
            className="flex min-h-[40px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-elev)] px-4 text-[13px] font-medium text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
          >
            Library
          </Link>
        </nav>
      </div>
    </header>
  );
}
