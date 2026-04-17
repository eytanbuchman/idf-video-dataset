/**
 * Stream URL on Azure CDN — no bytes proxied through Vercel.
 *
 * Use `resolved_url` exactly as returned from Bitly (HEAD redirect). That URL
 * is the canonical blob path on videoidf.azureedge.net (often a GUID with no
 * `.mp4` in the path — the CDN still serves video).
 *
 * `video_file` in the CSV is the scraper’s *local* download filename
 * (see scraper `video_dest_path`), not a segment to append to the CDN URL.
 * Appending it produced broken links like `.../guid/filename.mp4`.
 */
export function getStreamUrl(resolvedUrl: string): string {
  return resolvedUrl.trim();
}
