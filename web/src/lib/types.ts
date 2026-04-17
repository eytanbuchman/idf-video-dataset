/**
 * Core type definitions for the video library. Axis metadata lives in
 * `axes-config.ts`; this file exports the string-literal union and the
 * `VideoRecord` shape every component consumes.
 */
export type Axis = "theater" | "opponent" | "kind" | "domain" | "posture";

// Re-export AXES from axes-config for backwards compatibility.
export { AXES, isAxis, axisLabel, AXIS_CONFIG } from "./axes-config";

export type VideoRecord = {
  id: string;
  slug: string;
  message_id: number;
  date: string;
  bitly_url: string;
  resolved_url: string;
  video_file: string;
  message_text: string;

  theater: string;
  theaterSlug: string;
  opponent: string;
  opponentSlug: string;
  kind: string;
  kindSlug: string;
  domain: string;
  domainSlug: string;
  posture: string;
  postureSlug: string;

  isGraphic: boolean;
  involvesHostages: boolean;
  involvesCeasefireViolation: boolean;
  hasSensitiveContent: boolean;
};
