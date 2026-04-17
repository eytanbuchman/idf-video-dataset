import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        <span className="text-gradient">404</span>
      </h1>
      <p className="mt-4 text-[var(--muted)]">This page is not in the dataset.</p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-white/[0.06] px-6 py-2 text-sm text-teal-300/90 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
      >
        ← Home
      </Link>
    </div>
  );
}
