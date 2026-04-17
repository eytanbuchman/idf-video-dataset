import { NextResponse } from "next/server";
import { getVideoBySlug } from "@/lib/videos";

const CSV_HEADER =
  "message_id,date,bitly_url,resolved_url,video_file,message_text,front,opponent,type";

function escapeField(s: string): string {
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function POST(req: Request) {
  let body: { slugs?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const slugs = body.slugs;
  if (!Array.isArray(slugs) || slugs.length === 0) {
    return NextResponse.json({ error: "slugs required" }, { status: 400 });
  }

  const lines: string[] = [CSV_HEADER];
  for (const slug of slugs) {
    const v = await getVideoBySlug(slug);
    if (!v) continue;
    const row = [
      String(v.message_id),
      v.date,
      v.bitly_url,
      v.resolved_url,
      v.video_file,
      v.message_text,
      v.front,
      v.opponent,
      v.type,
    ].map(escapeField);
    lines.push(row.join(","));
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="export.csv"',
    },
  });
}
