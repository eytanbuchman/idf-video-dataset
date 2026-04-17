import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { sql } from "@/lib/db";
import { dispatchWorkflow } from "@/lib/github-dispatch";
import { CACHE_TAG_VIDEOS } from "@/lib/videos";

export async function POST(req: Request) {
  let mode = "incremental";
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const body = (await req.json()) as { mode?: string };
      if (body.mode === "full") mode = "full";
    } else {
      const form = await req.formData();
      if (String(form.get("mode") ?? "") === "full") mode = "full";
    }
  } catch {
    // default stays "incremental"
  }

  const dispatch = await dispatchWorkflow("scrape.yml", { mode });

  if (!dispatch.ok) {
    return NextResponse.json(
      { ok: false, error: dispatch.message },
      { status: dispatch.status },
    );
  }

  // Mark a "running" row so the dashboard shows immediate feedback.
  await sql()`
    INSERT INTO scrape_runs (kind, status, triggered_by)
    VALUES ('scrape', 'running', 'admin')
  `;

  revalidateTag(CACHE_TAG_VIDEOS, "max");

  const back = new URL(req.url);
  back.pathname = "/admin/scrape";
  back.search = "?queued=scrape";
  return NextResponse.redirect(back, { status: 303 });
}
