#!/usr/bin/env python3
"""
Bulk re-classify every video in the DB against the *current* category list.

Runs GPT-4o-mini once per video, skipping rows that are already correctly
tagged against the current axes (tracked via cache.json). Safe to re-run.

Required env:
  DATABASE_URL     postgres connection string
  OPENAI_API_KEY   OpenAI API key
"""

import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

# Reuse helpers from the scraper module — same DB layout, same classify logic.
from scraper import (
    CACHE_FILE,
    DEFAULT_AXES,
    categorize,
    db_connect,
    load_cache,
    read_axes_from_db,
    record_run_start,
    record_run_end,
    save_cache,
    slugify,
)

load_dotenv()


def run_retag(limit: int | None = None) -> None:
    if not os.getenv("OPENAI_API_KEY"):
        print("Missing OPENAI_API_KEY")
        sys.exit(1)
    if not os.getenv("DATABASE_URL"):
        print("Missing DATABASE_URL")
        sys.exit(1)

    cache = load_cache()

    with db_connect() as conn:
        triggered_by = os.getenv("SCRAPE_TRIGGERED_BY", "manual")
        run_id = record_run_start(conn, kind="retag", triggered_by=triggered_by)
        print(f"[run_id={run_id}] starting retag...")

        updated = 0
        skipped = 0
        try:
            axes = read_axes_from_db(conn) or DEFAULT_AXES

            with conn.cursor() as cur:
                if limit:
                    cur.execute(
                        "SELECT slug, message_id, bitly_url, message_text, "
                        "front, opponent, type FROM videos "
                        "ORDER BY date DESC LIMIT %s",
                        (limit,),
                    )
                else:
                    cur.execute(
                        "SELECT slug, message_id, bitly_url, message_text, "
                        "front, opponent, type FROM videos ORDER BY date DESC"
                    )
                rows = cur.fetchall()

            total = len(rows)
            print(f"Re-tagging {total} videos...")

            for i, (slug, message_id, bitly_url, text, cur_front, cur_opp, cur_type) in enumerate(rows, start=1):
                cats = categorize(
                    text or "",
                    axes,
                    cache,
                    f"{message_id}_{bitly_url}",
                )
                new_front = cats["front"]
                new_opp = cats["opponent"]
                new_type = cats["type"]

                if (new_front, new_opp, new_type) == (cur_front, cur_opp, cur_type):
                    skipped += 1
                else:
                    with conn.cursor() as cur2:
                        cur2.execute(
                            """
                            UPDATE videos SET
                              front = %s, opponent = %s, type = %s,
                              front_slug = %s, opponent_slug = %s, type_slug = %s,
                              updated_at = now()
                            WHERE slug = %s
                            """,
                            (
                                new_front, new_opp, new_type,
                                slugify(new_front), slugify(new_opp), slugify(new_type),
                                slug,
                            ),
                        )
                    updated += 1

                if i % 25 == 0 or i == total:
                    print(f"  {i}/{total} · updated={updated} skipped={skipped}")
                    save_cache(cache)

            save_cache(cache)
            record_run_end(conn, run_id, "success", updated=updated)
            print(f"\nDone. Updated {updated}, skipped (unchanged) {skipped}.")
        except Exception as e:
            record_run_end(
                conn,
                run_id,
                "error",
                updated=updated,
                error=f"{type(e).__name__}: {e}",
            )
            raise


def main():
    parser = argparse.ArgumentParser(description="Re-classify all videos against current DB tags.")
    parser.add_argument("--limit", type=int, default=None, help="Optional max rows to process")
    args = parser.parse_args()
    run_retag(limit=args.limit)


if __name__ == "__main__":
    # Make sure `from scraper import ...` resolves when CI runs from repo root.
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    # Sanity-touch OpenAI import so CI catches missing deps early.
    _ = OpenAI
    _ = json
    main()
