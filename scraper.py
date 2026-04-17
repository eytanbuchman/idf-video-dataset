#!/usr/bin/env python3
"""
Telegram Channel Video Scraper
Scrapes a public Telegram channel for Bitly video links, resolves video URLs,
and categorizes with GPT from the Telegram message text.

By default does not download MP4s (classification needs only the post text).
Use --download-videos to save files under ./videos/.
"""

import argparse
import csv
import hashlib
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

BITLY_PATTERN = re.compile(r"https?://bit\.ly/[A-Za-z0-9]+")
VIDEO_EXTENSIONS = (".mp4", ".mov", ".avi", ".mkv", ".webm")
VIDEO_DOMAINS = ("videoidf.azureedge.net",)

VIDEOS_DIR = Path("videos")
CACHE_FILE = Path("cache.json")

CLASSIFICATION_AXES = {
    "front": ["Lebanon", "Gaza", "Iran", "Homefront", "Other"],
    "opponent": ["Hezbollah", "Iran", "Houthi", "Palestinian", "Other"],
    "type": [
        "Combat footage", "Aerial strike", "Naval operation",
        "Ground operation", "Surveillance footage", "Press conference",
        "Humanitarian", "Intelligence briefing", "Military technology",
        "Other",
    ],
}


def validate_env():
    if not OPENAI_API_KEY:
        print("Missing OPENAI_API_KEY. Copy .env.example to .env and fill in your credentials.")
        sys.exit(1)


def load_cache() -> dict:
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text())
    return {"resolved_urls": {}, "categories": {}}


def save_cache(cache: dict):
    CACHE_FILE.write_text(json.dumps(cache, indent=2, ensure_ascii=False))


# ---------------------------------------------------------------------------
# Step 1: Scrape Telegram channel via public web preview
# ---------------------------------------------------------------------------

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}


def _get_with_retries(client: httpx.Client, url: str, max_attempts: int = 5) -> httpx.Response:
    """Fetch URL with retries on timeouts / transient network errors."""
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
    """Scrape a public Telegram channel via t.me/s/ web preview, paginating
    backward with ?before= until we reach the cutoff date."""
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
# Step 2: Resolve Bitly links and download videos
# ---------------------------------------------------------------------------

def resolve_url(bitly_url: str, cache: dict) -> str | None:
    """Follow redirects to get the final destination URL."""
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
    """Check if a URL is a video by extension, known domain, or Content-Type probe."""
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
    """Local path we would use for this resolved video URL (same as download naming)."""
    url_hash = hashlib.md5(url.encode()).hexdigest()[:10]
    filename = url.split("?")[0].split("/")[-1]
    if not any(filename.lower().endswith(ext) for ext in VIDEO_EXTENSIONS):
        filename = f"{url_hash}.mp4"
    return VIDEOS_DIR / f"{url_hash}_{filename}"


def download_video(url: str) -> Path | None:
    """Download a video file, skipping if already present."""
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
# Step 3: Categorize with GPT (from message text)
# ---------------------------------------------------------------------------

def categorize(message_text: str, cache: dict, cache_key: str) -> dict:
    """Classify a video along three axes (front, opponent, type) using the
    Telegram message text."""
    if cache_key in cache["categories"]:
        return cache["categories"][cache_key]

    client = OpenAI(api_key=OPENAI_API_KEY)

    content = message_text.strip() if message_text.strip() else "(no usable text)"

    axes_description = "\n".join(
        f'  "{axis}": one of [{", ".join(opts)}]'
        for axis, opts in CLASSIFICATION_AXES.items()
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

    for axis, opts in CLASSIFICATION_AXES.items():
        valid = [o.lower() for o in opts]
        val = result.get(axis, "Other")
        if val.lower() not in valid:
            result[axis] = "Other"
        else:
            result[axis] = next(o for o in opts if o.lower() == val.lower())

    cache["categories"][cache_key] = result
    save_cache(cache)
    return result


# ---------------------------------------------------------------------------
# Step 4: CSV output
# ---------------------------------------------------------------------------

def write_csv_row(row: dict, output_path: Path):
    """Append a single row to the CSV output file."""
    fieldnames = [
        "message_id", "date", "bitly_url", "resolved_url",
        "video_file", "message_text",
        "front", "opponent", "type",
    ]
    file_exists = output_path.exists()

    with open(output_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Telegram Channel Video Scraper")
    parser.add_argument("--channel", required=True, help="Public channel username (e.g. @channelname)")
    parser.add_argument("--date-from", default=None, help="Earliest date to scrape (YYYY-MM-DD)")
    parser.add_argument(
        "--download-videos",
        action="store_true",
        help="Download each MP4 to ./videos/ (default: off; only resolve URL + classify)",
    )
    parser.add_argument("--output", default="output.csv", help="Output CSV path")
    args = parser.parse_args()

    validate_env()

    output_path = Path(args.output)
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

    already_processed = set()
    if output_path.exists():
        with open(output_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                already_processed.add(row.get("bitly_url"))
        print(f"Loaded {len(already_processed)} already-processed entries from {output_path}")

    messages = scrape_channel(args.channel, date_from=args.date_from)

    total_videos = 0
    for msg in messages:
        for bitly_url in msg["bitly_urls"]:
            if bitly_url in already_processed:
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
                msg["text"], cache, f"{msg['message_id']}_{bitly_url}"
            )

            write_csv_row(
                {
                    "message_id": msg["message_id"],
                    "date": msg["date"],
                    "bitly_url": bitly_url,
                    "resolved_url": resolved,
                    "video_file": video_file,
                    "message_text": msg["text"],
                    "front": cats["front"],
                    "opponent": cats["opponent"],
                    "type": cats["type"],
                },
                output_path,
            )

            total_videos += 1
            print(f"  Front: {cats['front']} | Opponent: {cats['opponent']} | Type: {cats['type']}")

    print(f"\nDone! Processed {total_videos} videos. Results in {output_path}")


if __name__ == "__main__":
    main()
