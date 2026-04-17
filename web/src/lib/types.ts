export type Axis = "front" | "opponent" | "type";

export const AXES: Axis[] = ["front", "opponent", "type"];

export type VideoRecord = {
  id: string;
  slug: string;
  message_id: number;
  date: string;
  bitly_url: string;
  resolved_url: string;
  video_file: string;
  message_text: string;
  front: string;
  opponent: string;
  type: string;
  frontSlug: string;
  opponentSlug: string;
  typeSlug: string;
};
