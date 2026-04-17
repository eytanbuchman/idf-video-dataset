import type { Axis } from "./types";
import { AXIS_CONFIG } from "./axes-config";
import { sql } from "./db";

export type CategoryCopy = {
  /** Short positioning line shown as an eyebrow. */
  tagline: string;
  /** One or two sentences of descriptive context. */
  intro: string;
};

export type CategoryRow = {
  axis: Axis;
  slug: string;
  label: string;
  tagline: string;
  intro: string;
};

function fallbackCopy(axis: Axis, label: string): CategoryCopy {
  const cfg = AXIS_CONFIG[axis];
  return {
    tagline: cfg.label,
    intro: `Clips tagged "${label}" under ${cfg.label.toLowerCase()} in the IDF video library.`,
  };
}

export async function getAllCategories(): Promise<CategoryRow[]> {
  const rows = (await sql()`
    SELECT axis, slug, label, tagline, intro
    FROM categories
    ORDER BY axis, sort_order, label
  `) as unknown as CategoryRow[];
  return rows;
}

export async function getCategory(
  axis: Axis,
  slug: string,
): Promise<CategoryRow | undefined> {
  const rows = (await sql()`
    SELECT axis, slug, label, tagline, intro
    FROM categories
    WHERE axis = ${axis} AND slug = ${slug}
    LIMIT 1
  `) as unknown as CategoryRow[];
  return rows[0];
}

export async function getCategoryCopy(
  axis: Axis,
  slug: string,
  fallbackLabel: string,
): Promise<CategoryCopy> {
  const row = await getCategory(axis, slug);
  if (!row || (!row.tagline && !row.intro)) {
    return fallbackCopy(axis, fallbackLabel);
  }
  return {
    tagline: row.tagline || fallbackCopy(axis, fallbackLabel).tagline,
    intro: row.intro || fallbackCopy(axis, fallbackLabel).intro,
  };
}
