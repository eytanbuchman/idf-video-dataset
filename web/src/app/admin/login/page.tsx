import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: Props) {
  await connection();
  const sp = await searchParams;
  const nextRaw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const errorRaw = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const next = nextRaw && nextRaw.startsWith("/") ? nextRaw : "/admin";

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.015em] text-[var(--foreground)]">
        Admin sign in
      </h1>
      <p className="mt-3 text-[14px] text-[var(--muted-strong)]">
        Enter the admin password to manage the library.
      </p>

      <form
        method="POST"
        action="/api/admin/login"
        className="mt-8 space-y-4"
      >
        <input type="hidden" name="next" value={next} />
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Password
          </span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            className="rounded-xl border border-[var(--border)] bg-[var(--background-elev)] px-4 py-3 text-[14px] text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          />
        </label>
        {errorRaw ? (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700"
          >
            Wrong password. Try again.
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-full bg-[var(--foreground)] px-5 py-3 text-[13px] font-medium text-[var(--background-elev)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted-strong)]"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
