/**
 * Migration 002: new axis vocabulary (theater, kind, domain, posture) +
 * boolean flags. Applies db/migration-002-new-axes.sql, then seeds the
 * category rows for every new axis label.
 *
 * Usage:
 *   DATABASE_URL='postgres://...' npx tsx web/scripts/migrate-axes.ts
 *
 * Safe to re-run: schema changes are IF NOT EXISTS / DROP IF EXISTS and the
 * category upsert is keyed on (axis, slug).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIGRATION_PATH = join(
  __dirname,
  "..",
  "..",
  "db",
  "migration-002-new-axes.sql",
);

type SeedCategory = {
  axis: "theater" | "opponent" | "kind" | "domain" | "posture";
  slug: string;
  label: string;
  tagline: string;
  intro: string;
};

const SEED_CATEGORIES: SeedCategory[] = [
  // ---------------------------------------------------------------------------
  // Theater — primary geographic context for the clip
  // ---------------------------------------------------------------------------
  { axis: "theater", slug: "gaza", label: "Gaza", tagline: "Southern theater", intro: "The Gaza front covers IDF activity in and around the Gaza Strip — the October 2023 ground campaign, ongoing precision strikes, humanitarian-corridor coordination, and operations by the divisions deployed throughout the strip. The largest theater in the library by clip count." },
  { axis: "theater", slug: "lebanon", label: "Lebanon", tagline: "Northern theater", intro: "Operations along Israel's northern border and across Lebanese territory — precision strikes on Hezbollah infrastructure, cross-border engagements, eliminations of senior commanders, and the expanded campaign throughout southern Lebanon and the Beqaa Valley." },
  { axis: "theater", slug: "judea-samaria", label: "Judea & Samaria", tagline: "West Bank operations", intro: "Counter-terror operations across Judea and Samaria (the West Bank). Expect raids on terror cells in Jenin, Nablus, and Tulkarm, weapons seizures, arrests, and clashes with armed groups operating out of refugee camps." },
  { axis: "theater", slug: "syria", label: "Syria", tagline: "Syrian theater", intro: "IDF activity tied to Syria — airstrikes on Iranian and Hezbollah logistics routes, strikes on weapons-transfer convoys, and operations around the Golan Heights and the Syrian side of the border." },
  { axis: "theater", slug: "yemen", label: "Yemen", tagline: "Red Sea / Houthi theater", intro: "Operations tied to Yemen and the Houthi threat — long-range strikes on Houthi infrastructure, intercepts of ballistic missiles and drones launched toward Israel, and naval activity in the Red Sea corridor." },
  { axis: "theater", slug: "iran", label: "Iran", tagline: "Iranian theater", intro: "Releases tied to the direct confrontation with the Islamic Republic — long-range strikes, air-defense intercepts over Israeli airspace during Iranian missile salvos, and messaging around the regime and its nuclear and missile programs." },
  { axis: "theater", slug: "israel-home", label: "Israel (home)", tagline: "Inside Israel", intro: "Footage documenting events inside Israeli territory — air-defense intercepts above population centers, Home Front Command activity, civilian preparedness drills, search-and-rescue operations, and public-safety updates during active rocket or missile alerts." },
  { axis: "theater", slug: "regional", label: "Regional", tagline: "Cross-theater / multi-front", intro: "Releases that span multiple fronts or frame the conflict in regional terms — multi-front situational updates, joint air-defense actions with partners, and senior-leadership briefings that cover more than one theater at once." },
  { axis: "theater", slug: "other", label: "Other", tagline: "Uncategorized", intro: "Releases that don't tie cleanly to one theater. Includes doctrine explainers, institutional communications, and clips where the Spokesperson did not name a specific geography." },

  // ---------------------------------------------------------------------------
  // Opponent — the adversary actor
  // ---------------------------------------------------------------------------
  { axis: "opponent", slug: "hamas", label: "Hamas", tagline: "Hamas — Gaza", intro: "Material tagged to Hamas, the Islamist movement that controlled the Gaza Strip before the October 2023 ground campaign. Expect strike footage, operations inside Hamas command infrastructure, eliminations of senior operatives, and intelligence material recovered from the strip." },
  { axis: "opponent", slug: "palestinian-islamic-jihad", label: "Palestinian Islamic Jihad", tagline: "PIJ — Gaza / J&S", intro: "Footage tied to Palestinian Islamic Jihad, a smaller Iran-backed faction operating out of Gaza and the West Bank. Clips typically cover strikes on PIJ rocket launchers, arrests in Judea & Samaria, and eliminations of local commanders." },
  { axis: "opponent", slug: "hezbollah", label: "Hezbollah", tagline: "Lebanese Shia militant organization", intro: "Releases tagged to Hezbollah — the Iran-backed militant organization and political party based in Lebanon. Expect strikes on weapons infrastructure, eliminations of senior Radwan and missile-unit commanders, and intelligence material uncovered in southern Lebanese villages." },
  { axis: "opponent", slug: "houthi", label: "Houthi", tagline: "Ansar Allah — Yemen", intro: "The Houthi movement in Yemen. Drone and ballistic-missile launches toward Israel and the Red Sea corridor, long-range IDF responses, and intercepts by air-defense batteries and naval platforms." },
  { axis: "opponent", slug: "iran", label: "Iran", tagline: "Islamic Republic of Iran", intro: "Material where the Islamic Republic itself is the opposing actor — IRGC personnel and facilities, strikes against missile and air-defense sites, and operations tied to Iran's nuclear and long-range weapons programs." },
  { axis: "opponent", slug: "judea-samaria-terror-groups", label: "J&S terror groups", tagline: "West Bank terror cells", intro: "Armed groups operating across Judea & Samaria — local Hamas, PIJ, and Lions' Den style cells based in Jenin, Tulkarm, and Nablus refugee camps. Counter-terror raids, arrests, and weapons seizures." },
  { axis: "opponent", slug: "syrian-regime", label: "Syrian regime / factions", tagline: "Syria-based actors", intro: "Actors operating on Syrian territory — the former Assad regime, Iranian-backed militias using Syria as a logistics corridor, and related groups subject to IDF strikes." },
  { axis: "opponent", slug: "other", label: "Other", tagline: "Unspecified actor", intro: "Releases where the adversary is unspecified, multi-factional, or does not map cleanly to one of the primary groups tracked in this library." },

  // ---------------------------------------------------------------------------
  // Kind — genre of footage (replaces legacy `type`)
  // ---------------------------------------------------------------------------
  { axis: "kind", slug: "strike-footage", label: "Strike footage", tagline: "Airstrike / missile impact", intro: "Kinetic strike footage from the Israeli Air Force and long-range missile assets — precision strikes, UAV engagements, cockpit and targeting-pod recordings, and impact video of named targets. The clearest visual record of the strike campaign." },
  { axis: "kind", slug: "combat-footage", label: "Combat footage", tagline: "Small-unit engagements", intro: "Close-range combat captured from body cameras, vehicle-mounted cameras, and unit photographers — raw engagement material from inside the ground campaign, typically published after the operation concludes." },
  { axis: "kind", slug: "tunnel-operation", label: "Tunnel operation", tagline: "Underground warfare", intro: "Operations inside the Hamas and Hezbollah tunnel systems — entries, discovery and destruction of subterranean infrastructure, and footage of the combat-engineering units specialized in underground warfare." },
  { axis: "kind", slug: "weapons-seizure", label: "Weapons seizure", tagline: "Captured weapons & documents", intro: "Footage of weapons, ammunition, documents, and intelligence material recovered inside opponent territory — caches found in homes, mosques, schools, and buried beneath civilian infrastructure." },
  { axis: "kind", slug: "commander-tour", label: "Commander tour", tagline: "Senior-leadership visits", intro: "Senior commanders touring front-line positions or situational-assessment trips — often paired with tactical briefings to subordinate units and used as a way to signal institutional messaging." },
  { axis: "kind", slug: "press-conference", label: "Press conference", tagline: "On-camera briefings", intro: "Recorded statements from the IDF Spokesperson, senior commanders, and officials. The best source for direct quotes, formal positions, and situational updates issued to the press." },
  { axis: "kind", slug: "spokesperson-statement", label: "Spokesperson statement", tagline: "Direct-to-camera comms", intro: "Short, produced direct-to-camera messages from the IDF Spokesperson's unit — typically explaining a single operation or announcement, rather than a full press conference." },
  { axis: "kind", slug: "intel-briefing", label: "Intelligence briefing", tagline: "Released intel material", intro: "Released intelligence material — intercepted communications, captured documents, facility walkthroughs, and pattern-of-life briefings used to contextualize operations or attribute specific actions." },
  { axis: "kind", slug: "hostage-operation", label: "Hostage operation", tagline: "Hostage-related ops", intro: "Releases tied to the October 2023 hostages — rescue operations, information releases, body recovery, and releases covering negotiations milestones and returning-hostage footage." },
  { axis: "kind", slug: "humanitarian", label: "Humanitarian", tagline: "Aid & civilian coordination", intro: "Humanitarian-corridor operations, aid convoy coordination, civilian evacuations, and logistics activity documented by the IDF Spokesperson's unit." },
  { axis: "kind", slug: "memorial-ceremony", label: "Memorial / ceremony", tagline: "Official commemorations", intro: "Memorial events, fallen-soldier honors, unit ceremonies, and institutional commemorations. Useful for sourcing footage tied to named fallen soldiers and memorial dates." },
  { axis: "kind", slug: "drill-exercise", label: "Drill / exercise", tagline: "Training & readiness", intro: "Training exercises, unit drills, and readiness activity — including multi-national drills, reservist call-ups, and institutional skill-development footage." },
  { axis: "kind", slug: "tech-showcase", label: "Technology showcase", tagline: "Platforms & capabilities", intro: "Demonstrations and explainers focused on equipment and defense-tech platforms — new deployments, intercept systems, unmanned platforms, and capability messaging." },
  { axis: "kind", slug: "illustrative-graphic", label: "Illustrative graphic", tagline: "Animation / diagram", intro: "Animated diagrams, maps, and explanatory graphics produced by the Spokesperson's unit. Typically used to contextualize an operation when no kinetic footage is being released." },
  { axis: "kind", slug: "other", label: "Other", tagline: "Miscellaneous", intro: "Releases that don't match one of the primary footage genres — institutional content, mixed packages, and miscellaneous material." },

  // ---------------------------------------------------------------------------
  // Domain — air / ground / sea / intel / multi
  // ---------------------------------------------------------------------------
  { axis: "domain", slug: "air", label: "Air", tagline: "Air Force operations", intro: "Operations conducted in the air domain — Israeli Air Force fixed-wing sorties, UAV operations, rotary-wing activity, and air-defense engagements above Israeli airspace." },
  { axis: "domain", slug: "ground", label: "Ground", tagline: "Ground-force maneuver", intro: "Ground-domain activity — maneuver by brigade- and battalion-level units, armor and combat-engineering action, infantry operations, and footage captured inside opponent territory." },
  { axis: "domain", slug: "sea", label: "Sea", tagline: "Naval operations", intro: "Naval-domain activity — Israeli Navy surface and subsurface operations, Red Sea and Mediterranean patrols, interdictions, and amphibious activity tied to coastal objectives." },
  { axis: "domain", slug: "intelligence", label: "Intelligence", tagline: "ISR & intel operations", intro: "Intelligence-domain material — surveillance feeds, intelligence-driven operations, released captured material, and the cyber and SIGINT releases the IDF puts into the public domain." },
  { axis: "domain", slug: "multi-domain", label: "Multi-domain", tagline: "Joint / combined operations", intro: "Joint operations that cross domains — air-ground coordinated strikes, air-defense tied to naval intercepts, and multi-service institutional communications." },

  // ---------------------------------------------------------------------------
  // Posture — why was this published
  // ---------------------------------------------------------------------------
  { axis: "posture", slug: "offensive", label: "Offensive", tagline: "Offensive action", intro: "Footage of offensive action — strikes, raids, assaults, and kinetic operations where the IDF is the initiating force. The largest posture category across the strike-heavy phases of the conflict." },
  { axis: "posture", slug: "defensive", label: "Defensive", tagline: "Defensive action", intro: "Defensive operations — repelling cross-border attacks, engaging infiltrators, and tactical responses to opponent-initiated action on Israeli or held territory." },
  { axis: "posture", slug: "homefront-protection", label: "Homefront protection", tagline: "Civilian protection", intro: "Civilian-protection activity — air-defense intercepts above population centers, Home Front Command coordination, shelter and preparedness content, and search-and-rescue after attacks." },
  { axis: "posture", slug: "intelligence", label: "Intelligence", tagline: "Intel posture", intro: "Intelligence-posture releases — surveillance activity, operations framed around gathering and exploiting intelligence, and the release of captured material to shape the narrative." },
  { axis: "posture", slug: "informational", label: "Informational", tagline: "Institutional comms", intro: "Institutional communications — press conferences, spokesperson statements, memorials, drills, and explainers. Material whose primary purpose is to inform rather than document a kinetic action." },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = neon(url);

  console.log("[1/2] Applying db/migration-002-new-axes.sql...");
  const migration = readFileSync(MIGRATION_PATH, "utf-8");
  for (const stmt of migration
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)) {
    await sql.query(stmt);
  }
  console.log("   Schema updated.");

  console.log(`[2/2] Upserting ${SEED_CATEGORIES.length} category rows...`);
  for (const [i, c] of SEED_CATEGORIES.entries()) {
    await sql`
      INSERT INTO categories (axis, slug, label, tagline, intro, sort_order)
      VALUES (${c.axis}, ${c.slug}, ${c.label}, ${c.tagline}, ${c.intro}, ${i})
      ON CONFLICT (axis, slug) DO UPDATE
        SET label      = EXCLUDED.label,
            tagline    = EXCLUDED.tagline,
            intro      = EXCLUDED.intro,
            sort_order = EXCLUDED.sort_order,
            updated_at = now()
    `;
  }

  console.log(`\nDone. Seeded ${SEED_CATEGORIES.length} new-axis categories.`);
  console.log("Next step: run retag.py to reclassify videos into the new vocabulary.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
