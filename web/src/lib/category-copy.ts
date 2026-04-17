import { cacheTag } from "next/cache";
import type { Axis } from "./types";
import { sql } from "./db";
import { CACHE_TAG_CATEGORIES } from "./videos";

export type CategoryCopy = {
  /** Short, two-to-four-word positioning line shown as an eyebrow. */
  tagline: string;
  /** One or two sentences of descriptive context for the category. */
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
  switch (axis) {
    case "front":
      return {
        tagline: "Theater",
        intro: `Clips tagged to the ${label} theater in the IDF video library.`,
      };
    case "opponent":
      return {
        tagline: "Opposing actor",
        intro: `Footage tagged to ${label} as the opposing actor in the IDF video library.`,
      };
    case "type":
      return {
        tagline: "Footage type",
        intro: `Clips tagged as ${label.toLowerCase()} in the IDF video library.`,
      };
  }
}

export async function getAllCategories(): Promise<CategoryRow[]> {
  "use cache";
  cacheTag(CACHE_TAG_CATEGORIES);
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
  "use cache";
  cacheTag(CACHE_TAG_CATEGORIES);
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
