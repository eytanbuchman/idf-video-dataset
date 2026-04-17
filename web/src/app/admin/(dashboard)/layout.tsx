import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav className="mb-10 flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-4">
        <Link
          href="/admin"
          className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[var(--muted-strong)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
        >
          Dashboard
        </Link>
        <Link
          href="/admin/videos"
          className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[var(--muted-strong)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
        >
          Videos
        </Link>
        <Link
          href="/admin/tags"
          className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[var(--muted-strong)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
        >
          Tags
        </Link>
        <Link
          href="/admin/scrape"
          className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[var(--muted-strong)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
        >
          Scrape &amp; retag
        </Link>
        <form method="POST" action="/api/admin/logout" className="ml-auto">
          <button
            type="submit"
            className="rounded-full border border-[var(--border)] bg-[var(--background-elev)] px-3 py-1.5 text-[12px] font-medium text-[var(--muted-strong)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          >
            Log out
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
