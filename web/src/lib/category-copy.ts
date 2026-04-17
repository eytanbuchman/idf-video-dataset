import type { Axis } from "./types";

export type CategoryCopy = {
  /** Short, two-to-four-word positioning line shown as an eyebrow. */
  tagline: string;
  /** One or two sentences of descriptive context for the category. */
  intro: string;
};

const COPY: Record<string, CategoryCopy> = {
  // --- Fronts ----------------------------------------------------------
  "front:gaza": {
    tagline: "Southern theater",
    intro:
      "The Gaza front covers IDF activity in and around the Gaza Strip — the October 2023 ground campaign, ongoing precision strikes, humanitarian-corridor coordination, and operations by the divisions deployed throughout the strip. It is the largest theater in the library by volume.",
  },
  "front:lebanon": {
    tagline: "Northern theater",
    intro:
      "The Lebanon front captures operations along Israel's northern border. Expect precision strikes on Hezbollah infrastructure, cross-border engagements, eliminations of senior commanders, and the expanded campaign across southern Lebanon and the Beqaa Valley.",
  },
  "front:iran": {
    tagline: "Iran theater",
    intro:
      "Releases tied to the direct and indirect confrontation with the Islamic Republic — long-range strikes, air-defense intercepts over Israeli airspace, and messaging around the Iranian regime and the regional proxy network it coordinates.",
  },
  "front:homefront": {
    tagline: "Inside Israel",
    intro:
      "Homefront footage documents events inside Israeli territory — air-defense intercepts above population centers, Home Front Command activity, civilian preparedness drills, and public-safety communications during active rocket or missile alerts.",
  },
  "front:other": {
    tagline: "Cross-theater",
    intro:
      "Releases that don't fit a single theater. Includes multi-front situational updates, doctrine explainers, memorials and ceremonies, and clips where the IDF spokesperson did not tie the footage to a specific geography.",
  },

  // --- Opponents -------------------------------------------------------
  "opponent:palestinian": {
    tagline: "Palestinian armed groups",
    intro:
      "Footage tied to armed factions operating out of the Gaza Strip, the West Bank, and abroad — Hamas, Palestinian Islamic Jihad, and affiliated groups. The bulk of the material is strike footage, intelligence-driven operations, and releases explaining weapons found in civilian infrastructure.",
  },
  "opponent:hezbollah": {
    tagline: "Lebanese Shia militant organization",
    intro:
      "Releases tagged to Hezbollah — the Iran-backed militant organization and political party based in Lebanon. Expect strikes on weapons infrastructure, eliminations of senior Radwan and missile-unit commanders, and intelligence material uncovered in southern Lebanese villages.",
  },
  "opponent:iran": {
    tagline: "Islamic Republic of Iran",
    intro:
      "Material where the Islamic Republic itself is the opponent actor — IRGC personnel and facilities, strikes against missile and air-defense sites, and operations tied to Iran's nuclear and long-range weapons programs.",
  },
  "opponent:houthi": {
    tagline: "Ansar Allah — Yemen",
    intro:
      "Releases involving the Houthi movement in Yemen. Drone and ballistic-missile launches toward Israel and the Red Sea corridor, long-range IDF responses, and intercepts by air-defense batteries and naval platforms.",
  },
  "opponent:other": {
    tagline: "Unspecified actor",
    intro:
      "Releases where the opposing actor is unspecified, multi-factional, or does not map cleanly to one of the primary groups tracked in this library.",
  },

  // --- Types -----------------------------------------------------------
  "type:aerial-strike": {
    tagline: "Airstrike footage",
    intro:
      "Airstrikes carried out by the Israeli Air Force — fixed-wing precision strikes, UAV engagements, and cockpit or targeting-pod recordings. The largest single category in the library and often the clearest visual record of named targets.",
  },
  "type:ground-operation": {
    tagline: "Maneuver & ground forces",
    intro:
      "Maneuver footage from ground units — brigade- and battalion-level operations, armor and combat-engineering activity, and clips filmed inside opponent territory or along contested borders.",
  },
  "type:press-conference": {
    tagline: "Official statements",
    intro:
      "Recorded statements from the IDF Spokesperson, senior commanders, and officials. These are the best source for direct quotes, formal positions, and situational updates issued to the press.",
  },
  "type:humanitarian": {
    tagline: "Aid & civilian coordination",
    intro:
      "Humanitarian-corridor operations, aid convoy coordination, civilian evacuations, and logistics activity documented by the IDF Spokesperson's unit. Useful for sourcing footage of aid flows and coordination mechanisms.",
  },
  "type:intelligence-briefing": {
    tagline: "Released intelligence",
    intro:
      "Released intelligence material — intercepted communications, captured documents, facility walkthroughs, and pattern-of-life briefings used to contextualize operations or attribute specific actions.",
  },
  "type:combat-footage": {
    tagline: "Small-unit engagements",
    intro:
      "Close-range combat captured from body cameras, GoPros, or vehicle-mounted cameras. Raw engagement material that's typically published after an operation concludes, often the most granular window into small-unit action.",
  },
  "type:surveillance-footage": {
    tagline: "ISR & reconnaissance",
    intro:
      "Surveillance and reconnaissance material — persistent drone feeds, fixed observation posts, and captured CCTV used to document opponent activity or to establish context before a strike.",
  },
  "type:naval-operation": {
    tagline: "Maritime activity",
    intro:
      "Operations run by the Israeli Navy — interdictions, coastal engagements, and amphibious activity. Volume is smaller than the air and ground categories and is typically tied to blockade enforcement or Red Sea responses.",
  },
  "type:military-technology": {
    tagline: "Platforms & systems",
    intro:
      "Demonstrations and explainers focused on equipment and defense-tech platforms — new deployments, intercept systems, unmanned platforms, and capability messaging.",
  },
  "type:other": {
    tagline: "Miscellaneous",
    intro:
      "Releases that don't match one of the primary footage types — ceremonies, memorials, training vignettes, and miscellaneous institutional content.",
  },
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

export function getCategoryCopy(
  axis: Axis,
  slug: string,
  fallbackLabel: string,
): CategoryCopy {
  return COPY[`${axis}:${slug}`] ?? fallbackCopy(axis, fallbackLabel);
}
