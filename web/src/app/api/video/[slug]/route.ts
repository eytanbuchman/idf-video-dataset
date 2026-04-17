import { NextResponse } from "next/server";
import { getVideoBySlug } from "@/lib/videos";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const v = getVideoBySlug(slug);
  if (!v) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(v);
}
