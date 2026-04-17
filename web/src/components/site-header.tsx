import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-[var(--background)]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl min-h-[52px] items-center justify-between gap-4 px-4 py-3 sm:min-h-0 sm:py-4 md:px-6">
        <Link href="/" className="group min-h-[44px] py-1">
          <span className="bg-gradient-to-r from-[var(--foreground)]/95 to-teal-400/55 bg-clip-text font-[family-name:var(--font-display)] text-lg tracking-tight text-transparent sm:text-xl">
            IDF Video Dataset
          </span>
          <span className="mt-0.5 block max-w-[16rem] text-[11px] font-normal leading-snug text-[var(--muted)] transition group-hover:text-teal-400/55 sm:max-w-none sm:text-xs">
            Find footage &amp; metadata
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/browse"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-4 text-[var(--muted)] ring-1 ring-white/[0.06] transition hover:bg-white/[0.04] hover:text-[var(--foreground)] sm:min-w-0"
          >
            Library
          </Link>
        </nav>
      </div>
    </header>
  );
}
