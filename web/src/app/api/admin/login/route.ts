import { NextResponse } from "next/server";
import {
  checkPassword,
  sessionCookieOptions,
  signSession,
} from "@/lib/admin-auth";

export async function POST(req: Request) {
  let password = "";
  let next = "/admin";
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const body = (await req.json()) as { password?: string; next?: string };
      password = body.password ?? "";
      if (body.next) next = body.next;
    } else {
      const form = await req.formData();
      password = String(form.get("password") ?? "");
      const formNext = form.get("next");
      if (typeof formNext === "string" && formNext) next = formNext;
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!checkPassword(password)) {
    const url = new URL(req.url);
    url.pathname = "/admin/login";
    url.searchParams.set("error", "1");
    if (next) url.searchParams.set("next", next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const token = await signSession();
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
  const dest = new URL(req.url);
  dest.pathname = safeNext;
  dest.search = "";

  const res = NextResponse.redirect(dest, { status: 303 });
  const opts = sessionCookieOptions();
  res.cookies.set({ ...opts, value: token });
  return res;
}
