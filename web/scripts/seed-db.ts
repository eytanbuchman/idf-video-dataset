/**
 * One-shot seed script: reads ../output.csv + ../db/schema.sql + seeded
 * category copy and pushes everything into Neon.
 *
 * Usage (from repo root):
 *   DATABASE_URL='postgres://...' npx tsx web/scripts/seed-db.ts
 *
 * Safe to re-run: creates tables if missing, upserts videos by slug, upserts
 * categories by (axis, slug). Existing rows are updated in place.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CSV_PATH = join(__dirname, "..", "..", "output.csv");
const SCHEMA_PATH = join(__dirname, "..", "..", "db", "schema.sql");

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

type CsvRow = Record<string, string>;

type SeedCategory = {
  axis: "front" | "opponent" | "type";
  slug: string;
  label: string;
  tagline: string;
  intro: string;
};

const SEED_CATEGORIES: SeedCategory[] = [
  // Fronts
  { axis: "front", slug: "gaza", label: "Gaza", tagline: "Southern theater", intro: "The Gaza front covers IDF activity in and around the Gaza Strip — the October 2023 ground campaign, ongoing precision strikes, humanitarian-corridor coordination, and operations by the divisions deployed throughout the strip. It is the largest theater in the library by volume." },
  { axis: "front", slug: "lebanon", label: "Lebanon", tagline: "Northern theater", intro: "The Lebanon front captures operations along Israel's northern border. Expect precision strikes on Hezbollah infrastructure, cross-border engagements, eliminations of senior commanders, and the expanded campaign across southern Lebanon and the Beqaa Valley." },
  { axis: "front", slug: "iran", label: "Iran", tagline: "Iran theater", intro: "Releases tied to the direct and indirect confrontation with the Islamic Republic — long-range strikes, air-defense intercepts over Israeli airspace, and messaging around the Iranian regime and the regional proxy network it coordinates." },
  { axis: "front", slug: "homefront", label: "Homefront", tagline: "Inside Israel", intro: "Homefront footage documents events inside Israeli territory — air-defense intercepts above population centers, Home Front Command activity, civilian preparedness drills, and public-safety communications during active rocket or missile alerts." },
  { axis: "front", slug: "other", label: "Other", tagline: "Cross-theater", intro: "Releases that don't fit a single theater. Includes multi-front situational updates, doctrine explainers, memorials and ceremonies, and clips where the IDF spokesperson did not tie the footage to a specific geography." },
  // Opponents
  { axis: "opponent", slug: "palestinian", label: "Palestinian", tagline: "Palestinian armed groups", intro: "Footage tied to armed factions operating out of the Gaza Strip, the West Bank, and abroad — Hamas, Palestinian Islamic Jihad, and affiliated groups. The bulk of the material is strike footage, intelligence-driven operations, and releases explaining weapons found in civilian infrastructure." },
  { axis: "opponent", slug: "hezbollah", label: "Hezbollah", tagline: "Lebanese Shia militant organization", intro: "Releases tagged to Hezbollah — the Iran-backed militant organization and political party based in Lebanon. Expect strikes on weapons infrastructure, eliminations of senior Radwan and missile-unit commanders, and intelligence material uncovered in southern Lebanese villages." },
  { axis: "opponent", slug: "iran", label: "Iran", tagline: "Islamic Republic of Iran", intro: "Material where the Islamic Republic itself is the opponent actor — IRGC personnel and facilities, strikes against missile and air-defense sites, and operations tied to Iran's nuclear and long-range weapons programs." },
  { axis: "opponent", slug: "houthi", label: "Houthi", tagline: "Ansar Allah — Yemen", intro: "Releases involving the Houthi movement in Yemen. Drone and ballistic-missile launches toward Israel and the Red Sea corridor, long-range IDF responses, and intercepts by air-defense batteries and naval platforms." },
  { axis: "opponent", slug: "other", label: "Other", tagline: "Unspecified actor", intro: "Releases where the opposing actor is unspecified, multi-factional, or does not map cleanly to one of the primary groups tracked in this library." },
  // Types
  { axis: "type", slug: "aerial-strike", label: "Aerial strike", tagline: "Airstrike footage", intro: "Airstrikes carried out by the Israeli Air Force — fixed-wing precision strikes, UAV engagements, and cockpit or targeting-pod recordings. The largest single category in the library and often the clearest visual record of named targets." },
  { axis: "type", slug: "ground-operation", label: "Ground operation", tagline: "Maneuver & ground forces", intro: "Maneuver footage from ground units — brigade- and battalion-level operations, armor and combat-engineering activity, and clips filmed inside opponent territory or along contested borders." },
  { axis: "type", slug: "press-conference", label: "Press conference", tagline: "Official statements", intro: "Recorded statements from the IDF Spokesperson, senior commanders, and officials. These are the best source for direct quotes, formal positions, and situational updates issued to the press." },
  { axis: "type", slug: "humanitarian", label: "Humanitarian", tagline: "Aid & civilian coordination", intro: "Humanitarian-corridor operations, aid convoy coordination, civilian evacuations, and logistics activity documented by the IDF Spokesperson's unit. Useful for sourcing footage of aid flows and coordination mechanisms." },
  { axis: "type", slug: "intelligence-briefing", label: "Intelligence briefing", tagline: "Released intelligence", intro: "Released intelligence material — intercepted communications, captured documents, facility walkthroughs, and pattern-of-life briefings used to contextualize operations or attribute specific actions." },
  { axis: "type", slug: "combat-footage", label: "Combat footage", tagline: "Small-unit engagements", intro: "Close-range combat captured from body cameras, GoPros, or vehicle-mounted cameras. Raw engagement material that's typically published after an operation concludes, often the most granular window into small-unit action." },
  { axis: "type", slug: "surveillance-footage", label: "Surveillance footage", tagline: "ISR & reconnaissance", intro: "Surveillance and reconnaissance material — persistent drone feeds, fixed observation posts, and captured CCTV used to document opponent activity or to establish context before a strike." },
  { axis: "type", slug: "naval-operation", label: "Naval operation", tagline: "Maritime activity", intro: "Operations run by the Israeli Navy — interdictions, coastal engagements, and amphibious activity. Volume is smaller than the air and ground categories and is typically tied to blockade enforcement or Red Sea responses." },
  { axis: "type", slug: "military-technology", label: "Military technology", tagline: "Platforms & systems", intro: "Demonstrations and explainers focused on equipment and defense-tech platforms — new deployments, intercept systems, unmanned platforms, and capability messaging." },
  { axis: "type", slug: "other", label: "Other", tagline: "Miscellaneous", intro: "Releases that don't match one of the primary footage types — ceremonies, memorials, training vignettes, and miscellaneous institutional content." },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required (e.g. DATABASE_URL=postgres://... npx tsx web/scripts/seed-db.ts)");
    process.exit(1);
  }

  const sql = neon(url);

  console.log("[1/4] Applying schema...");
  const schema = readFileSync(SCHEMA_PATH, "utf-8");
  // Neon's sql.query style: fire each statement separately.
  for (const stmt of schema.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) {
    await sql.query(stmt);
  }

  console.log("[2/4] Seeding categories...");
  let catCount = 0;
  for (const [i, c] of SEED_CATEGORIES.entries()) {
    await sql`
      INSERT INTO categories (axis, slug, label, tagline, intro, sort_order)
      VALUES (${c.axis}, ${c.slug}, ${c.label}, ${c.tagline}, ${c.intro}, ${i})
      ON CONFLICT (axis, slug) DO UPDATE
        SET label = EXCLUDED.label,
            tagline = EXCLUDED.tagline,
            intro = EXCLUDED.intro,
            sort_order = EXCLUDED.sort_order,
            updated_at = now()
    `;
    catCount++;
  }
  console.log(`   Upserted ${catCount} category rows`);

  console.log("[3/4] Reading output.csv...");
  const csv = readFileSync(CSV_PATH, "utf-8");
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as CsvRow[];

  console.log(`[4/4] Upserting ${records.length} videos...`);
  // Neon free tier chokes on parallel INSERTs with heavy payloads
  // (message_text can be several KB). Run serially with a small concurrency
  // cap to stay within the 0.25 CU memory budget.
  const CONCURRENCY = 4;
  let n = 0;
  let active = 0;
  let idx = 0;

  await new Promise<void>((resolve, reject) => {
    const spawn = () => {
      if (idx >= records.length && active === 0) return resolve();
      while (active < CONCURRENCY && idx < records.length) {
        const row = records[idx++];
        active++;
        (async () => {
          const message_id = Number(row.message_id);
          const bitly_url = row.bitly_url ?? "";
          const id = stableId(String(message_id), bitly_url);
          const slug = `v-${id}`;
          const front = (row.front ?? "").trim() || "Unknown";
          const opponent = (row.opponent ?? "").trim() || "Unknown";
          const type = (row.type ?? "").trim() || "Unknown";
          await sql`
            INSERT INTO videos (
              slug, id, message_id, date, bitly_url, resolved_url, video_file,
              message_text, front, opponent, type,
              front_slug, opponent_slug, type_slug
            ) VALUES (
              ${slug}, ${id}, ${message_id}, ${row.date ?? ""}, ${bitly_url},
              ${row.resolved_url ?? ""}, ${row.video_file ?? ""},
              ${row.message_text ?? ""}, ${front}, ${opponent}, ${type},
              ${slugify(front)}, ${slugify(opponent)}, ${slugify(type)}
            )
            ON CONFLICT (slug) DO UPDATE SET
              date = EXCLUDED.date,
              resolved_url = EXCLUDED.resolved_url,
              video_file = EXCLUDED.video_file,
              message_text = EXCLUDED.message_text,
              front = EXCLUDED.front,
              opponent = EXCLUDED.opponent,
              type = EXCLUDED.type,
              front_slug = EXCLUDED.front_slug,
              opponent_slug = EXCLUDED.opponent_slug,
              type_slug = EXCLUDED.type_slug,
              updated_at = now()
          `;
        })()
          .then(() => {
            n++;
            if (n % 200 === 0 || n === records.length) {
              console.log(`   ${n}/${records.length}`);
            }
          })
          .catch(reject)
          .finally(() => {
            active--;
            spawn();
          });
      }
    };
    spawn();
  });

  console.log(`\nDone. Seeded ${catCount} categories and ${records.length} videos.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
