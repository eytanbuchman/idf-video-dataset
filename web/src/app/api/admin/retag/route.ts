import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { sql } from "@/lib/db";
import { dispatchWorkflow } from "@/lib/github-dispatch";
import { CACHE_TAG_VIDEOS } from "@/lib/videos";

export async function POST(req: Request) {
  const dispatch = await dispatchWorkflow("retag.yml", {});
  if (!dispatch.ok) {
    return NextResponse.json(
      { ok: false, error: dispatch.message },
      { status: dispatch.status },
    );
  }

  await sql()`
    INSERT INTO scrape_runs (kind, status, triggered_by)
    VALUES ('retag', 'running', 'admin')
  `;

  revalidateTag(CACHE_TAG_VIDEOS, "max");

  const back = new URL(req.url);
  back.pathname = "/admin/scrape";
  back.search = "?queued=retag";
  return NextResponse.redirect(back, { status: 303 });
}
