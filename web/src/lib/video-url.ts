const VIDEO_EXT = /\.(mp4|webm|mov|mkv|avi)$/i;

/** Stream URL on Azure CDN — no bytes proxied through Vercel. */
export function getStreamUrl(resolvedUrl: string, videoFile: string): string {
  const path = resolvedUrl.split("?")[0];
  if (VIDEO_EXT.test(path)) return resolvedUrl;
  const base = resolvedUrl.replace(/\/$/, "");
  const file = videoFile.replace(/^\//, "");
  return `${base}/${file}`;
}
