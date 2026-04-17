export function getSiteUrl(): URL {
  const raw = process.env.SITE_URL ?? "http://localhost:3000";
  try {
    return new URL(raw.endsWith("/") ? raw.slice(0, -1) : raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}
