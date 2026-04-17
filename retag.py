#!/usr/bin/env python3
"""
Bulk re-classify every video in the DB against the *current* category list.

Runs GPT-4o-mini once per video, skipping rows that are already correctly
tagged against the current axes + flags (tracked via cache.json). Safe to
re-run.

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

from scraper import (
    AXIS_KEYS,
    DEFAULT_AXES,
    FLAG_KEYS,
    categorize,
    db_connect,
    load_cache,
    read_axes_from_db,
    record_run_end,
    record_run_start,
    save_cache,
    slugify,
)

load_dotenv()


def _row_changed(new: dict, current: dict) -> bool:
    for axis in AXIS_KEYS:
        if new[axis] != current.get(axis):
            return True
    for flag in FLAG_KEYS:
        if bool(new[flag]) != bool(current.get(flag)):
            return True
    return False


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

            select_cols = (
                ["slug", "message_id", "bitly_url", "message_text"]
                + list(AXIS_KEYS)
                + list(FLAG_KEYS)
            )
            sql_cols = ", ".join(select_cols)

            with conn.cursor() as cur:
                if limit:
                    cur.execute(
                        f"SELECT {sql_cols} FROM videos "
                        "ORDER BY date DESC LIMIT %s",
                        (limit,),
                    )
                else:
                    cur.execute(
                        f"SELECT {sql_cols} FROM videos ORDER BY date DESC"
                    )
                rows = cur.fetchall()

            total = len(rows)
            print(f"Re-tagging {total} videos against axes: {list(axes.keys())}")

            for i, row in enumerate(rows, start=1):
                record = dict(zip(select_cols, row))
                slug = record["slug"]
                message_id = record["message_id"]
                bitly_url = record["bitly_url"]
                text = record["message_text"] or ""

                cats = categorize(
                    text,
                    axes,
                    cache,
                    f"{message_id}_{bitly_url}",
                )

                if not _row_changed(cats, record):
                    skipped += 1
                else:
                    # Build the UPDATE dynamically so adding another axis or
                    # flag later stays a one-line change.
                    set_parts: list[str] = []
                    params: list = []
                    for axis in AXIS_KEYS:
                        set_parts.append(f"{axis} = %s")
                        set_parts.append(f"{axis}_slug = %s")
                        params.append(cats[axis])
                        params.append(slugify(cats[axis]))
                    # Keep legacy columns aligned with theater / kind.
                    set_parts += [
                        "front = %s",
                        "front_slug = %s",
                        "type = %s",
                        "type_slug = %s",
                    ]
                    params += [
                        cats["theater"], slugify(cats["theater"]),
                        cats["kind"], slugify(cats["kind"]),
                    ]
                    for flag in FLAG_KEYS:
                        set_parts.append(f"{flag} = %s")
                        params.append(bool(cats[flag]))
                    set_parts.append("updated_at = now()")
                    params.append(slug)

                    with conn.cursor() as cur2:
                        cur2.execute(
                            f"UPDATE videos SET {', '.join(set_parts)} "
                            f"WHERE slug = %s",
                            params,
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
    parser = argparse.ArgumentParser(
        description="Re-classify all videos against current DB tags."
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional max rows to process",
    )
    args = parser.parse_args()
    run_retag(limit=args.limit)


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    _ = OpenAI
    _ = json
    main()
