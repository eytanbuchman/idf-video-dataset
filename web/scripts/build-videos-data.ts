import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

import type { VideoRecord } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

function stableId(messageId: string, bitly: string): string {
  return createHash("sha256")
    .update(`${messageId}|${bitly}`)
    .digest("hex")
    .slice(0, 16);
}

function rowSlug(messageId: string, bitly: string): string {
  return `v-${stableId(messageId, bitly)}`;
}

type CsvRow = Record<string, string>;

const CSV_PATH = join(__dirname, "..", "..", "output.csv");
const OUT_DIR = join(__dirname, "..", "src", "data");
const OUT_FILE = join(OUT_DIR, "videos.json");

function main() {
  const csv = readFileSync(CSV_PATH, "utf-8");
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as CsvRow[];

  const videos: VideoRecord[] = records.map((row) => {
    const message_id = Number(row.message_id);
    const bitly_url = row.bitly_url ?? "";
    const id = stableId(String(message_id), bitly_url);
    const slug = rowSlug(String(message_id), bitly_url);
    const front = (row.front ?? "").trim() || "Unknown";
    const opponent = (row.opponent ?? "").trim() || "Unknown";
    const type = (row.type ?? "").trim() || "Unknown";

    return {
      id,
      slug,
      message_id,
      date: row.date ?? "",
      bitly_url,
      resolved_url: row.resolved_url ?? "",
      video_file: row.video_file ?? "",
      message_text: row.message_text ?? "",
      front,
      opponent,
      type,
      frontSlug: slugify(front),
      opponentSlug: slugify(opponent),
      typeSlug: slugify(type),
    };
  });

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(videos), "utf-8");
  console.log(`Wrote ${videos.length} rows to ${OUT_FILE}`);
}

main();
