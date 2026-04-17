import type { Axis } from "./types";

/**
 * Central registry of every axis the app supports. Adding a new axis here +
 * a DB migration is the only change required to surface it everywhere:
 * filters, browse pages, sitemap, admin UI all read off this config.
 */
export type AxisConfig = {
  id: Axis;
  /** Long human label shown in UI headings. */
  label: string;
  /** URL/query-param key (kebab-case). */
  paramKey: string;
  /** DB column names for the label + slug on `videos`. */
  valueColumn: string;
  slugColumn: string;
  /** Helpful one-liner shown on index pages. */
  description: string;
};

export const AXIS_CONFIG: Record<Axis, AxisConfig> = {
  theater: {
    id: "theater",
    label: "Theater",
    paramKey: "theater",
    valueColumn: "theater",
    slugColumn: "theater_slug",
    description:
      "Primary geography — Gaza, Lebanon, Judea & Samaria, Syria, Yemen, Iran, inside Israel.",
  },
  opponent: {
    id: "opponent",
    label: "Opponent",
    paramKey: "opponent",
    valueColumn: "opponent",
    slugColumn: "opponent_slug",
    description:
      "The adversary in the clip — Hezbollah, Hamas, PIJ, Houthi, Iran, Syria-based actors, West Bank cells.",
  },
  kind: {
    id: "kind",
    label: "Footage type",
    paramKey: "kind",
    valueColumn: "kind",
    slugColumn: "kind_slug",
    description:
      "Genre of the release — strike footage, combat, tunnel op, weapons seizure, press conference, graphic…",
  },
  domain: {
    id: "domain",
    label: "Domain",
    paramKey: "domain",
    valueColumn: "domain",
    slugColumn: "domain_slug",
    description:
      "Which service / environment — air, ground, sea, intelligence, or joint multi-domain action.",
  },
  posture: {
    id: "posture",
    label: "Posture",
    paramKey: "posture",
    valueColumn: "posture",
    slugColumn: "posture_slug",
    description:
      "Why the clip was published — offensive action, defensive response, homefront protection, intel, informational.",
  },
};

export const AXES: Axis[] = [
  "theater",
  "opponent",
  "kind",
  "domain",
  "posture",
];

/** Axes that appear in the main advanced-filter UI. Domain/posture are
 *  useful but secondary; we keep them out of the primary filter row. */
export const PRIMARY_FILTER_AXES: Axis[] = ["theater", "opponent", "kind"];

export function isAxis(s: string): s is Axis {
  return s in AXIS_CONFIG;
}

export function axisLabel(axis: Axis): string {
  return AXIS_CONFIG[axis].label;
}

/**
 * Per-video boolean flags. These behave like tags but are always binary
 * (present/absent). They live on every row with a default of false.
 */
export type FlagKey =
  | "is_graphic"
  | "involves_hostages"
  | "involves_ceasefire_violation"
  | "has_sensitive_content";

export type FlagConfig = {
  key: FlagKey;
  /** Field name on `VideoRecord` (camelCase). */
  field:
    | "isGraphic"
    | "involvesHostages"
    | "involvesCeasefireViolation"
    | "hasSensitiveContent";
  label: string;
  paramKey: string;
  description: string;
};

export const FLAG_CONFIG: FlagConfig[] = [
  {
    key: "is_graphic",
    field: "isGraphic",
    label: "Illustrative graphic",
    paramKey: "graphic",
    description:
      "Clip is primarily an animated diagram, map, or explainer graphic rather than kinetic footage.",
  },
  {
    key: "involves_hostages",
    field: "involvesHostages",
    label: "Hostage-related",
    paramKey: "hostages",
    description:
      "Clip references the October 2023 hostages — rescue, body recovery, negotiations, or released-hostage content.",
  },
  {
    key: "involves_ceasefire_violation",
    field: "involvesCeasefireViolation",
    label: "Ceasefire violation",
    paramKey: "ceasefire",
    description:
      "Published to document a ceasefire or de-escalation agreement being violated by the opposing actor.",
  },
  {
    key: "has_sensitive_content",
    field: "hasSensitiveContent",
    label: "Sensitive content",
    paramKey: "sensitive",
    description:
      "Material the Spokesperson's unit flagged as sensitive (graphic injuries, casualties, civilian harm footage).",
  },
];
