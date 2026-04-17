import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-[-0.015em] text-[var(--foreground)]">
        404
      </h1>
      <p className="mt-4 text-[var(--muted-strong)]">
        This page is not in the dataset.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-[44px] items-center rounded-full bg-[var(--foreground)] px-6 py-2 text-[13px] font-medium text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
      >
        ← Home
      </Link>
    </div>
  );
}
