import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">404</h1>
      <p className="mt-4 text-[var(--muted)]">This page is not in the dataset.</p>
      <Link
        href="/"
        className="mt-8 inline-block text-[var(--accent)] hover:underline"
      >
        ← Home
      </Link>
    </div>
  );
}
