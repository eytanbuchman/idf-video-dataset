#!/usr/bin/env python3
"""
Telegram Channel Video Scraper

Scrapes a public Telegram channel for Bitly video links, resolves video URLs,
categorizes with GPT from the Telegram message text, and upserts the rows into
a Neon/Postgres database.

Modes:
  --mode incremental (default)  stop paginating once we reach max(date) in DB
  --mode full                   walk back to --date-from (default 2023-10-07)

Downloads are OFF by default; pass --download-videos to save MP4s locally.

Required env:
  DATABASE_URL     postgres connection string
  OPENAI_API_KEY   OpenAI API key
"""

import argparse
import hashlib
import json
import os
import re
import sys
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

import httpx
import psycopg
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from openai import OpenAI
from psycopg.rows import dict_row

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

BITLY_PATTERN = re.compile(r"https?://bit\.ly/[A-Za-z0-9]+")
VIDEO_EXTENSIONS = (".mp4", ".mov", ".avi", ".mkv", ".webm")
VIDEO_DOMAINS = ("videoidf.azureedge.net",)

VIDEOS_DIR = Path("videos")
CACHE_FILE = Path("cache.json")

DEFAULT_CHANNEL = "idfofficial"
DEFAULT_DATE_FROM = "2023-10-07"

# Fallback axis options if the DB isn't seeded with categories yet. These
# mirror what the seed script inserts. `run_scrape()` will replace these with
# the current DB contents so GPT classification stays in sync with /admin/tags.
DEFAULT_AXES = {
    "front": ["Lebanon", "Gaza", "Iran", "Homefront", "Other"],
    "opponent": ["Hezbollah", "Iran", "Houthi", "Palestinian", "Other"],
    "type": [
        "Combat footage", "Aerial strike", "Naval operation",
        "Ground operation", "Surveillance footage", "Press conference",
        "Humanitarian", "Intelligence briefing", "Military technology",
        "Other",
    ],
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def validate_env():
    missing = []
    if not OPENAI_API_KEY:
        missing.append("OPENAI_API_KEY")
    if not DATABASE_URL:
        missing.append("DATABASE_URL")
    if missing:
        print(f"Missing env var(s): {', '.join(missing)}. "
              "Copy .env.example to .env and fill in credentials.")
        sys.exit(1)


def slugify(raw: str) -> str:
    s = unicodedata.normalize("NFKD", raw or "").encode("ascii", "ignore").decode("ascii")
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    s = s.strip("-")
    return s or "unknown"


def stable_id(message_id: int | str, bitly: str) -> str:
    return hashlib.sha256(f"{message_id}|{bitly}".encode()).hexdigest()[:16]


def load_cache() -> dict:
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text())
    return {"resolved_urls": {}, "categories": {}}


def save_cache(cache: dict):
    CACHE_FILE.write_text(json.dumps(cache, indent=2, ensure_ascii=False))


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def db_connect():
    # Neon doesn't love psycopg's default sslmode; explicit for safety.
    return psycopg.connect(DATABASE_URL, autocommit=True)


def read_axes_from_db(conn) -> dict[str, list[str]]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT axis, label FROM categories ORDER BY axis, sort_order, label"
        )
        rows = cur.fetchall()
    by_axis: dict[str, list[str]] = {}
    for r in rows:
        by_axis.setdefault(r["axis"], []).append(r["label"])
    # Ensure each axis has at least "Other" — GPT needs a fallback option.
    for axis in ("front", "opponent", "type"):
        labels = by_axis.get(axis) or DEFAULT_AXES[axis][:]
        if "Other" not in labels:
            labels.append("Other")
        by_axis[axis] = labels
    return by_axis


def read_max_date(conn) -> str | None:
    with conn.cursor() as cur:
        cur.execute("SELECT max(date) FROM videos")
        row = cur.fetchone()
    return row[0] if row and row[0] else None


def record_run_start(conn, kind: str = "scrape", triggered_by: str = "manual") -> int:
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO scrape_runs (kind, status, triggered_by) "
            "VALUES (%s, 'running', %s) RETURNING id",
            (kind, triggered_by),
        )
        return cur.fetchone()[0]


def record_run_end(
    conn,
    run_id: int,
    status: str,
    added: int = 0,
    updated: int = 0,
    error: str | None = None,
):
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE scrape_runs SET finished_at = now(), status = %s, "
            "videos_added = %s, videos_updated = %s, error = %s WHERE id = %s",
            (status, added, updated, error, run_id),
        )


def upsert_video(conn, row: dict) -> str:
    """Insert a row, or update if slug already exists.
    Returns 'inserted' or 'updated'."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO videos (
              slug, id, message_id, date, bitly_url, resolved_url, video_file,
              message_text, front, opponent, type,
              front_slug, opponent_slug, type_slug
            ) VALUES (
              %(slug)s, %(id)s, %(message_id)s, %(date)s, %(bitly_url)s,
              %(resolved_url)s, %(video_file)s, %(message_text)s,
              %(front)s, %(opponent)s, %(type)s,
              %(front_slug)s, %(opponent_slug)s, %(type_slug)s
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
            RETURNING (xmax = 0) AS inserted
            """,
            row,
        )
        inserted = cur.fetchone()[0]
    return "inserted" if inserted else "updated"


def existing_bitly_urls(conn) -> set[str]:
    with conn.cursor() as cur:
        cur.execute("SELECT bitly_url FROM videos")
        return {r[0] for r in cur.fetchall() if r[0]}


# ---------------------------------------------------------------------------
# Scrape Telegram
# ---------------------------------------------------------------------------

def _get_with_retries(client: httpx.Client, url: str, max_attempts: int = 5) -> httpx.Response:
    last_err: Exception | None = None
    for attempt in range(max_attempts):
        try:
            return client.get(url)
        except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError) as e:
            last_err = e
            wait = min(2 ** attempt, 60)
            print(f"  Request failed ({e!s}), retry {attempt + 1}/{max_attempts} in {wait}s...")
            time.sleep(wait)
    raise last_err  # type: ignore[misc]


def scrape_channel(channel: str, date_from: str | None = None) -> list[dict]:
    channel = channel.lstrip("@")
    cutoff = datetime.strptime(date_from, "%Y-%m-%d") if date_from else None
    base_url = f"https://t.me/s/{channel}"

    all_messages: list[dict] = []
    seen_ids: set[int] = set()
    url = base_url
    page = 0

    with httpx.Client(headers=HEADERS, follow_redirects=True, timeout=60) as client:
        while True:
            page += 1
            print(f"  Page {page}: fetching {url[:80]}...")
            resp = _get_with_retries(client, url)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            widgets = soup.select(".tgme_widget_message_wrap")
            if not widgets:
                print(f"  No more messages found on page {page}.")
                break

            oldest_id = None
            reached_cutoff = False

            for wrap in widgets:
                msg_el = wrap.select_one(".tgme_widget_message")
                if not msg_el or not msg_el.get("data-post"):
                    continue

                post_id_str = msg_el["data-post"].split("/")[-1]
                try:
                    post_id = int(post_id_str)
                except ValueError:
                    continue

                if post_id in seen_ids:
                    continue
                seen_ids.add(post_id)

                if oldest_id is None or post_id < oldest_id:
                    oldest_id = post_id

                date_el = msg_el.select_one("time[datetime]")
                msg_date = date_el["datetime"] if date_el else ""

                if cutoff and msg_date:
                    try:
                        dt = datetime.fromisoformat(msg_date.replace("Z", "+00:00"))
                        if dt.replace(tzinfo=None) < cutoff:
                            reached_cutoff = True
                            continue
                    except ValueError:
                        pass

                text_el = msg_el.select_one(".tgme_widget_message_text")
                text = text_el.get_text(separator=" ") if text_el else ""

                links = BITLY_PATTERN.findall(text)
                if links:
                    all_messages.append({
                        "message_id": post_id,
                        "date": msg_date,
                        "text": text,
                        "bitly_urls": links,
                    })

            print(f"  Page {page}: {len(widgets)} messages, "
                  f"{len(all_messages)} with Bitly links so far")

            if reached_cutoff:
                print(f"  Reached cutoff date {date_from}, stopping.")
                break

            if oldest_id is None:
                break

            url = f"{base_url}?before={oldest_id}"
            time.sleep(1)

    print(f"\nTotal: {len(all_messages)} messages with Bitly links.")
    return all_messages


# ---------------------------------------------------------------------------
# URL resolution
# ---------------------------------------------------------------------------

def resolve_url(bitly_url: str, cache: dict) -> str | None:
    if bitly_url in cache["resolved_urls"]:
        return cache["resolved_urls"][bitly_url]
    try:
        with httpx.Client(follow_redirects=True, timeout=30) as client:
            resp = client.head(bitly_url)
            final_url = str(resp.url)
            cache["resolved_urls"][bitly_url] = final_url
            save_cache(cache)
            return final_url
    except httpx.HTTPError as e:
        print(f"  Failed to resolve {bitly_url}: {e}")
        return None


def is_video_url(url: str) -> bool:
    parsed_path = url.split("?")[0].lower()
    if any(parsed_path.endswith(ext) for ext in VIDEO_EXTENSIONS):
        return True

    from urllib.parse import urlparse
    hostname = urlparse(url).hostname or ""
    if any(domain in hostname for domain in VIDEO_DOMAINS):
        return True

    try:
        with httpx.Client(follow_redirects=True, timeout=15) as client:
            resp = client.head(url)
            content_type = resp.headers.get("content-type", "")
            if "video" in content_type:
                return True
    except httpx.HTTPError:
        pass

    return False


def video_dest_path(url: str) -> Path:
    url_hash = hashlib.md5(url.encode()).hexdigest()[:10]
    filename = url.split("?")[0].split("/")[-1]
    if not any(filename.lower().endswith(ext) for ext in VIDEO_EXTENSIONS):
        filename = f"{url_hash}.mp4"
    return VIDEOS_DIR / f"{url_hash}_{filename}"


def download_video(url: str) -> Path | None:
    dest = video_dest_path(url)
    if dest.exists():
        print(f"  Already downloaded: {dest.name}")
        return dest
    print(f"  Downloading: {url[:80]}...")
    try:
        with httpx.Client(follow_redirects=True, timeout=300) as client:
            with client.stream("GET", url) as resp:
                resp.raise_for_status()
                with open(dest, "wb") as f:
                    for chunk in resp.iter_bytes(chunk_size=8192):
                        f.write(chunk)
        print(f"  Saved: {dest.name} ({dest.stat().st_size / 1024 / 1024:.1f} MB)")
        return dest
    except httpx.HTTPError as e:
        print(f"  Download failed: {e}")
        if dest.exists():
            dest.unlink()
        return None


# ---------------------------------------------------------------------------
# Categorize with GPT
# ---------------------------------------------------------------------------

def categorize(
    message_text: str,
    axes: dict[str, list[str]],
    cache: dict,
    cache_key: str,
) -> dict:
    # Cache key embeds the full axes list so re-running after admin edits the
    # tag set invalidates old entries automatically.
    full_key = f"{cache_key}|{json.dumps(axes, sort_keys=True)}"
    if full_key in cache["categories"]:
        return cache["categories"][full_key]

    client = OpenAI(api_key=OPENAI_API_KEY)
    content = message_text.strip() or "(no usable text)"

    axes_description = "\n".join(
        f'  "{axis}": one of [{", ".join(opts)}]' for axis, opts in axes.items()
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a military content classifier for IDF (Israel Defense Forces) videos.\n"
                    "Classify the following content along THREE axes. For each axis, pick "
                    "exactly ONE value from the allowed options.\n\n"
                    f"{axes_description}\n\n"
                    "Return ONLY valid JSON with keys: front, opponent, type.\n"
                    "Example: {\"front\": \"Lebanon\", \"opponent\": \"Hezbollah\", \"type\": \"Aerial strike\"}"
                ),
            },
            {"role": "user", "content": content[:4000]},
        ],
    )

    raw = response.choices[0].message.content.strip()
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {"front": "Other", "opponent": "Other", "type": "Other"}

    for axis, opts in axes.items():
        valid_lower = {o.lower(): o for o in opts}
        val = str(result.get(axis, "Other")).lower()
        result[axis] = valid_lower.get(val, "Other")

    cache["categories"][full_key] = result
    save_cache(cache)
    return result


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_scrape(args) -> None:
    validate_env()

    if args.download_videos:
        VIDEOS_DIR.mkdir(exist_ok=True)
        print("=" * 60)
        print("DOWNLOAD MODE: ON — saving MP4s under ./videos/")
        print("=" * 60 + "\n")
    else:
        print("=" * 60)
        print("DOWNLOAD MODE: OFF — no MP4 files (Telegram text only for GPT)")
        print("Add --download-videos if you want files on disk.")
        print("=" * 60 + "\n")

    cache = load_cache()

    with db_connect() as conn:
        triggered_by = os.getenv("SCRAPE_TRIGGERED_BY", "manual")
        run_id = record_run_start(conn, "scrape", triggered_by)
        print(f"[run_id={run_id}] starting scrape...")

        added = updated = 0
        try:
            axes = read_axes_from_db(conn)

            if args.mode == "incremental":
                max_date = read_max_date(conn)
                if max_date:
                    cutoff = max_date[:10]
                    print(f"Incremental mode: stopping when we hit date <= {cutoff}")
                else:
                    cutoff = args.date_from or DEFAULT_DATE_FROM
                    print(f"Incremental mode: DB empty, falling back to {cutoff}")
            else:
                cutoff = args.date_from or DEFAULT_DATE_FROM
                print(f"Full mode: scraping back to {cutoff}")

            already = existing_bitly_urls(conn)
            print(f"Already have {len(already)} Bitly URLs in DB.")

            messages = scrape_channel(args.channel, date_from=cutoff)

            for msg in messages:
                for bitly_url in msg["bitly_urls"]:
                    if bitly_url in already:
                        continue

                    print(f"\nProcessing: {bitly_url}")

                    resolved = resolve_url(bitly_url, cache)
                    if not resolved:
                        continue

                    if not is_video_url(resolved):
                        print(f"  Not a video URL: {resolved[:80]}")
                        continue

                    if args.download_videos:
                        video_path = download_video(resolved)
                        if not video_path:
                            continue
                        video_file = video_path.name
                    else:
                        video_file = video_dest_path(resolved).name

                    cats = categorize(
                        msg["text"],
                        axes,
                        cache,
                        f"{msg['message_id']}_{bitly_url}",
                    )

                    msg_id = msg["message_id"]
                    vid_id = stable_id(str(msg_id), bitly_url)
                    slug = f"v-{vid_id}"

                    row = {
                        "slug": slug,
                        "id": vid_id,
                        "message_id": msg_id,
                        "date": msg["date"],
                        "bitly_url": bitly_url,
                        "resolved_url": resolved,
                        "video_file": video_file,
                        "message_text": msg["text"],
                        "front": cats["front"],
                        "opponent": cats["opponent"],
                        "type": cats["type"],
                        "front_slug": slugify(cats["front"]),
                        "opponent_slug": slugify(cats["opponent"]),
                        "type_slug": slugify(cats["type"]),
                    }
                    status = upsert_video(conn, row)
                    if status == "inserted":
                        added += 1
                    else:
                        updated += 1
                    already.add(bitly_url)
                    print(
                        f"  {status} · Front: {cats['front']} | Opponent: {cats['opponent']} | Type: {cats['type']}"
                    )

            record_run_end(conn, run_id, "success", added=added, updated=updated)
            print(
                f"\nDone. {added} added, {updated} updated. run_id={run_id}"
            )
        except Exception as e:
            record_run_end(
                conn,
                run_id,
                "error",
                added=added,
                updated=updated,
                error=f"{type(e).__name__}: {e}",
            )
            raise


def main():
    parser = argparse.ArgumentParser(description="Telegram Channel Video Scraper")
    parser.add_argument(
        "--channel", default=DEFAULT_CHANNEL,
        help=f"Public channel username (default: {DEFAULT_CHANNEL})",
    )
    parser.add_argument(
        "--mode", choices=["incremental", "full"], default="incremental",
        help="incremental (default): stop at DB max(date). full: rescrape to --date-from",
    )
    parser.add_argument(
        "--date-from", default=None,
        help=f"Earliest date (full mode). Default: {DEFAULT_DATE_FROM}",
    )
    parser.add_argument(
        "--download-videos", action="store_true",
        help="Download each MP4 to ./videos/ (default: off)",
    )
    args = parser.parse_args()
    run_scrape(args)


if __name__ == "__main__":
    _ = datetime.now(timezone.utc)
    main()
