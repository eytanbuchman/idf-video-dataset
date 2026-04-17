"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "./db";
import {
  SESSION_COOKIE,
  verifySession,
} from "./admin-auth";
import { AXIS_CONFIG, AXES, FLAG_CONFIG } from "./axes-config";
import type { Axis } from "./types";
import {
  CACHE_TAG_CATEGORIES,
  CACHE_TAG_VIDEOS,
} from "./videos";

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

function asBool(v: FormDataEntryValue | null): boolean {
  if (!v) return false;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "on" || s === "yes";
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
  const resolved_url = String(formData.get("resolved_url") ?? "");

  const axisValues: Record<Axis, string> = {
    theater:  (String(formData.get("theater")  ?? "").trim()) || "Unknown",
    opponent: (String(formData.get("opponent") ?? "").trim()) || "Unknown",
    kind:     (String(formData.get("kind")     ?? "").trim()) || "Unknown",
    domain:   (String(formData.get("domain")   ?? "").trim()) || "Multi-domain",
    posture:  (String(formData.get("posture")  ?? "").trim()) || "Informational",
  };
  const axisSlugs: Record<Axis, string> = {
    theater:  slugify(axisValues.theater),
    opponent: slugify(axisValues.opponent),
    kind:     slugify(axisValues.kind),
    domain:   slugify(axisValues.domain),
    posture:  slugify(axisValues.posture),
  };

  const flags = {
    is_graphic: asBool(formData.get("is_graphic")),
    involves_hostages: asBool(formData.get("involves_hostages")),
    involves_ceasefire_violation: asBool(
      formData.get("involves_ceasefire_violation"),
    ),
    has_sensitive_content: asBool(formData.get("has_sensitive_content")),
  };

  await sql()`
    UPDATE videos SET
      message_text = ${message_text},
      date         = ${date},
      resolved_url = ${resolved_url},
      theater      = ${axisValues.theater},
      theater_slug = ${axisSlugs.theater},
      opponent     = ${axisValues.opponent},
      opponent_slug = ${axisSlugs.opponent},
      kind         = ${axisValues.kind},
      kind_slug    = ${axisSlugs.kind},
      domain       = ${axisValues.domain},
      domain_slug  = ${axisSlugs.domain},
      posture      = ${axisValues.posture},
      posture_slug = ${axisSlugs.posture},
      is_graphic                   = ${flags.is_graphic},
      involves_hostages            = ${flags.involves_hostages},
      involves_ceasefire_violation = ${flags.involves_ceasefire_violation},
      has_sensitive_content        = ${flags.has_sensitive_content},
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

function isAxisKey(s: string): s is Axis {
  return AXES.includes(s as Axis);
}

export async function upsertCategory(formData: FormData): Promise<void> {
  await requireAdmin();

  const axis = String(formData.get("axis") ?? "");
  if (!isAxisKey(axis)) {
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
      label      = EXCLUDED.label,
      tagline    = EXCLUDED.tagline,
      intro      = EXCLUDED.intro,
      updated_at = now()
  `;

  // If the label changed, propagate the new label + slug to every video that
  // still uses the old label under this axis, so filtering keeps working.
  if (oldLabel && oldLabel !== label) {
    const cfg = AXIS_CONFIG[axis];
    // Column names come from our own static config — safe to inline.
    await sql().query(
      `UPDATE videos SET ${cfg.valueColumn} = $1,
                         ${cfg.slugColumn}  = $2,
                         updated_at = now()
       WHERE ${cfg.valueColumn} = $3`,
      [label, slug, oldLabel],
    );
  }

  updateTag(CACHE_TAG_VIDEOS);
  updateTag(CACHE_TAG_CATEGORIES);
  redirect("/admin/tags?saved=1");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const axis = String(formData.get("axis") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!isAxisKey(axis)) {
    throw new Error("invalid axis");
  }
  if (!slug) throw new Error("slug required");

  const cfg = AXIS_CONFIG[axis];
  // Refuse if any videos still reference this slug.
  const usageRows = (await sql().query(
    `SELECT COUNT(*)::int AS c FROM videos WHERE ${cfg.slugColumn} = $1`,
    [slug],
  )) as unknown as { c: number }[];
  const usage = usageRows[0]?.c ?? 0;
  if (usage > 0) {
    redirect(
      `/admin/tags?in_use=${encodeURIComponent(axis + ":" + slug)}&count=${usage}`,
    );
  }

  await sql()`DELETE FROM categories WHERE axis = ${axis} AND slug = ${slug}`;
  updateTag(CACHE_TAG_CATEGORIES);
  redirect("/admin/tags?deleted=1");
}

// Re-export for downstream consumers that previously imported FLAG_CONFIG
// indirectly from admin-actions. Keeps the import graph tidy.
export { FLAG_CONFIG };
