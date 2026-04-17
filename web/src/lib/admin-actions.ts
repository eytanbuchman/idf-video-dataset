"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "./db";
import {
  SESSION_COOKIE,
  verifySession,
} from "./admin-auth";
import {
  CACHE_TAG_CATEGORIES,
  CACHE_TAG_VIDEOS,
} from "./videos";

/** Guard all server actions with the session cookie. */
async function requireAdmin(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const ok = await verifySession(token);
  if (!ok) {
    redirect("/admin/login");
  }
}

function slugify(raw: string): string {
  const s = raw
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "unknown";
}

// ---------------------------------------------------------------------------
// Video mutations
// ---------------------------------------------------------------------------

export async function updateVideo(formData: FormData): Promise<void> {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "");
  if (!slug) throw new Error("slug required");

  const message_text = String(formData.get("message_text") ?? "");
  const date = String(formData.get("date") ?? "");
  const front = (String(formData.get("front") ?? "").trim()) || "Unknown";
  const opponent = (String(formData.get("opponent") ?? "").trim()) || "Unknown";
  const type = (String(formData.get("type") ?? "").trim()) || "Unknown";
  const resolved_url = String(formData.get("resolved_url") ?? "");

  await sql()`
    UPDATE videos SET
      message_text = ${message_text},
      date = ${date},
      front = ${front},
      opponent = ${opponent},
      type = ${type},
      resolved_url = ${resolved_url},
      front_slug = ${slugify(front)},
      opponent_slug = ${slugify(opponent)},
      type_slug = ${slugify(type)},
      updated_at = now()
    WHERE slug = ${slug}
  `;

  updateTag(CACHE_TAG_VIDEOS);
  redirect(`/admin/videos/${encodeURIComponent(slug)}?saved=1`);
}

export async function deleteVideo(formData: FormData): Promise<void> {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  if (!slug) throw new Error("slug required");
  await sql()`DELETE FROM videos WHERE slug = ${slug}`;
  updateTag(CACHE_TAG_VIDEOS);
  redirect("/admin/videos?deleted=1");
}

// ---------------------------------------------------------------------------
// Category (tag) mutations
// ---------------------------------------------------------------------------

export async function upsertCategory(formData: FormData): Promise<void> {
  await requireAdmin();

  const axis = String(formData.get("axis") ?? "");
  if (!["front", "opponent", "type"].includes(axis)) {
    throw new Error("invalid axis");
  }
  const label = String(formData.get("label") ?? "").trim();
  if (!label) throw new Error("label required");
  const providedSlug = String(formData.get("slug") ?? "").trim();
  const slug = providedSlug ? slugify(providedSlug) : slugify(label);
  const tagline = String(formData.get("tagline") ?? "").trim();
  const intro = String(formData.get("intro") ?? "").trim();
  const oldLabel = String(formData.get("old_label") ?? "").trim();

  await sql()`
    INSERT INTO categories (axis, slug, label, tagline, intro, sort_order)
    VALUES (${axis}, ${slug}, ${label}, ${tagline}, ${intro}, 0)
    ON CONFLICT (axis, slug) DO UPDATE SET
      label = EXCLUDED.label,
      tagline = EXCLUDED.tagline,
      intro = EXCLUDED.intro,
      updated_at = now()
  `;

  // If the label changed, update the denormalized label + slug columns on all
  // videos that used the old label under this axis. This keeps the video rows
  // in sync so filtering by slug still works.
  if (oldLabel && oldLabel !== label) {
    const column =
      axis === "front" ? "front" : axis === "opponent" ? "opponent" : "type";
    const slugColumn =
      axis === "front"
        ? "front_slug"
        : axis === "opponent"
          ? "opponent_slug"
          : "type_slug";

    if (column === "front") {
      await sql()`
        UPDATE videos
        SET front = ${label}, front_slug = ${slug}, updated_at = now()
        WHERE front = ${oldLabel}
      `;
    } else if (column === "opponent") {
      await sql()`
        UPDATE videos
        SET opponent = ${label}, opponent_slug = ${slug}, updated_at = now()
        WHERE opponent = ${oldLabel}
      `;
    } else {
      await sql()`
        UPDATE videos
        SET type = ${label}, type_slug = ${slug}, updated_at = now()
        WHERE type = ${oldLabel}
      `;
    }
    void slugColumn;
  }

  updateTag(CACHE_TAG_VIDEOS);
  updateTag(CACHE_TAG_CATEGORIES);
  redirect("/admin/tags?saved=1");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const axis = String(formData.get("axis") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!["front", "opponent", "type"].includes(axis)) {
    throw new Error("invalid axis");
  }
  if (!slug) throw new Error("slug required");

  // Refuse if any videos still reference this slug.
  let usage = 0;
  if (axis === "front") {
    const rows = (await sql()`SELECT COUNT(*)::int AS c FROM videos WHERE front_slug = ${slug}`) as unknown as { c: number }[];
    usage = rows[0]?.c ?? 0;
  } else if (axis === "opponent") {
    const rows = (await sql()`SELECT COUNT(*)::int AS c FROM videos WHERE opponent_slug = ${slug}`) as unknown as { c: number }[];
    usage = rows[0]?.c ?? 0;
  } else {
    const rows = (await sql()`SELECT COUNT(*)::int AS c FROM videos WHERE type_slug = ${slug}`) as unknown as { c: number }[];
    usage = rows[0]?.c ?? 0;
  }
  if (usage > 0) {
    redirect(`/admin/tags?in_use=${encodeURIComponent(axis + ":" + slug)}&count=${usage}`);
  }

  await sql()`DELETE FROM categories WHERE axis = ${axis} AND slug = ${slug}`;
  updateTag(CACHE_TAG_CATEGORIES);
  redirect("/admin/tags?deleted=1");
}
