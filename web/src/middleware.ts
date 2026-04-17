import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  verifySession,
} from "@/lib/admin-auth";

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/browse/front/:path*",
    "/browse/type/:path*",
  ],
};

const PUBLIC_PATHS = new Set<string>(["/admin/login"]);
const PUBLIC_API_PATHS = new Set<string>(["/api/admin/login"]);

// Legacy axis slugs got renamed when the taxonomy grew (Apr 2026). Keep the
// old URLs alive with a permanent redirect so shared links and search indexes
// don't 404.
const AXIS_RENAMES: Record<string, string> = {
  front: "theater",
  type: "kind",
};

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/browse/")) {
    const parts = pathname.split("/");
    const legacyAxis = parts[2];
    if (legacyAxis && AXIS_RENAMES[legacyAxis]) {
      parts[2] = AXIS_RENAMES[legacyAxis];
      const url = req.nextUrl.clone();
      url.pathname = parts.join("/");
      url.search = search;
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname) || PUBLIC_API_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const ok = await verifySession(token);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}
