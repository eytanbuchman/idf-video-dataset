import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

/** Lazily construct the Neon serverless client. Throws if DATABASE_URL
 *  is missing. Keep this import-light so `next build` static analysis
 *  doesn't error when env vars aren't set yet in local sandbox builds. */
export function sql(): NeonQueryFunction<false, false> {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add Neon to the Vercel project (or set DATABASE_URL in web/.env.local) and try again.",
    );
  }
  client = neon(url);
  return client;
}
