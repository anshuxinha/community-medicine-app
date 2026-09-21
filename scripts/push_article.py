#!/usr/bin/env python3
"""
push_article.py
─────────────────────────────────────────────────────────────────
Pushes a new ARTICLE to Firestore (appContent/articlesFeed) and sends
Expo push notifications to all registered users, matching the behavior
of fetch_updates.py for news items.

Usage:
  python scripts/push_article.py --title "..." --summary "..."
  python scripts/push_article.py --file path/to/article.json
  python scripts/push_article.py --title "..." --summary "..." --no-push
─────────────────────────────────────────────────────────────────
"""

import argparse
import json
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests  # type: ignore

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    from push_notifications import fetch_push_tokens, send_push_notifications, _get_firestore_access_token
except ImportError:
    # Handle direct script execution path
    sys.path.append(str(Path(__file__).resolve().parent))
    from push_notifications import fetch_push_tokens, send_push_notifications, _get_firestore_access_token

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "community-med-app")
FIRESTORE_DOC_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/appContent/articlesFeed"

PUSH_TITLE_MAX = 90
PUSH_BODY_MAX = 320


def _first_sentence(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", (text or "")).strip()
    match = re.search(r"^(.*?[.!?])(?:\s|$)", cleaned)
    return match.group(1).strip() if match else cleaned


def _clip_at_word(text: str, max_chars: int) -> str:
    cleaned = re.sub(r"\s+", " ", (text or "")).strip()
    if len(cleaned) <= max_chars:
        return cleaned
    truncated = cleaned[: max_chars - 3]
    last_space = truncated.rfind(" ")
    if last_space > int(max_chars * 0.4):
        truncated = truncated[:last_space]
    return truncated.rstrip(",;:- ") + "..."


def build_article_push_copy(item: Dict[str, Any]) -> Tuple[str, str]:
    title = _clip_at_word(item.get("title") or "New public health article", PUSH_TITLE_MAX)
    summary = item.get("summary") or item.get("content") or ""
    sentence = _first_sentence(summary)
    if sentence and len(sentence) <= PUSH_BODY_MAX:
        body = sentence
    elif sentence:
        body = _clip_at_word(sentence, PUSH_BODY_MAX)
    else:
        body = "Open the Updates tab to read the full article."
    return title, body


def _python_to_firestore_value(val: Any) -> Dict[str, Any]:
    if val is None:
        return {"nullValue": None}
    elif isinstance(val, bool):
        return {"booleanValue": val}
    elif isinstance(val, int):
        return {"integerValue": str(val)}
    elif isinstance(val, float):
        return {"doubleValue": val}
    elif isinstance(val, str):
        return {"stringValue": val}
    elif isinstance(val, list):
        return {"arrayValue": {"values": [_python_to_firestore_value(v) for v in val]}}
    elif isinstance(val, dict):
        return {"mapValue": {"fields": {k: _python_to_firestore_value(v) for k, v in val.items()}}}
    return {"stringValue": str(val)}


def _firestore_value_to_python(val: Dict[str, Any]) -> Any:
    if "stringValue" in val:
        return val["stringValue"]
    elif "integerValue" in val:
        return int(val["integerValue"])
    elif "doubleValue" in val:
        return float(val["doubleValue"])
    elif "booleanValue" in val:
        return val["booleanValue"]
    elif "nullValue" in val:
        return None
    elif "arrayValue" in val:
        return [_firestore_value_to_python(v) for v in val["arrayValue"].get("values", [])]
    elif "mapValue" in val:
        return {k: _firestore_value_to_python(v) for k, v in val["mapValue"].get("fields", {}).items()}
    return None


def fetch_existing_articles_feed(access_token: str) -> Dict[str, Any]:
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.get(FIRESTORE_DOC_URL, headers=headers, timeout=20)
    if resp.status_code == 200:
        doc = resp.json()
        fields = doc.get("fields", {})
        return {k: _firestore_value_to_python(v) for k, v in fields.items()}
    return {"months": {}, "updatedAt": None}


def save_articles_feed(access_token: str, data: Dict[str, Any]) -> bool:
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    fields = {k: _python_to_firestore_value(v) for k, v in data.items()}
    body = {"fields": fields}
    resp = requests.patch(FIRESTORE_DOC_URL, headers=headers, json=body, timeout=25)
    if resp.status_code in (200, 201):
        print("[OK] Successfully updated appContent/articlesFeed in Firestore.")
        return True
    print(f"[FAIL] Failed to save articlesFeed ({resp.status_code}): {resp.text}")
    return False


def push_article(article: Dict[str, Any], send_push: bool = True) -> bool:
    access_token = _get_firestore_access_token()
    if not access_token:
        print("[FAIL] Could not get Firebase access token. Verify credentials.")
        return False

    # Normalize article fields
    title = str(article.get("title", "")).strip()
    if not title:
        print("[FAIL] Article title is required.")
        return False

    summary = str(article.get("summary") or article.get("content", "")).strip()
    date_str = str(article.get("date") or datetime.now(timezone.utc).strftime("%Y-%m-%d")).strip()
    month_key = date_str[:7]
    article_id = str(article.get("id") or f"article_{uuid.uuid4().hex[:10]}")

    normalized_article = {
        "id": article_id,
        "title": title,
        "summary": summary,
        "date": date_str,
        "tag": "ARTICLE",
        "category": str(article.get("category", "Special Article")),
        "source": str(article.get("source", "Grokbot / STROMA Editorial")),
        "link": str(article.get("link", "")),
        "updatedItems": article.get("updatedItems", []),
    }
    if "content" in article and article["content"]:
        normalized_article["content"] = str(article["content"])

    # Load existing feed
    feed = fetch_existing_articles_feed(access_token)
    months = feed.get("months") or {}
    current_month_list = months.get(month_key) or []

    # Dedupe by id or title
    filtered_list = [it for it in current_month_list if it.get("id") != article_id and it.get("title") != title]
    filtered_list.insert(0, normalized_article)
    months[month_key] = filtered_list
    feed["months"] = months
    feed["updatedAt"] = datetime.now(timezone.utc).isoformat()

    saved = save_articles_feed(access_token, feed)
    if not saved:
        return False

    print(f"[OK] Article saved: '{title}' [{date_str}] (id={article_id})")

    if send_push:
        tokens = fetch_push_tokens()
        if not tokens:
            print("[INFO] No push tokens found in Firestore. Skipping notifications.")
            return True

        push_title, push_body = build_article_push_copy(normalized_article)
        print(f"[INFO] Sending push notifications to {len(tokens)} token(s)...")
        print(f"   Title: {push_title}")
        print(f"   Body:  {push_body}")
        send_push_notifications(tokens, push_title, push_body, "Updates")

    return True


def main():
    parser = argparse.ArgumentParser(description="Push article to STROMA articlesFeed and notify users.")
    parser.add_argument("--file", help="Path to JSON file containing article or list of articles.")
    parser.add_argument("--title", help="Article title.")
    parser.add_argument("--summary", help="Article summary/text.")
    parser.add_argument("--content", help="Optional full article markdown content.")
    parser.add_argument("--date", help="YYYY-MM-DD date. Defaults to today.")
    parser.add_argument("--category", default="Special Article", help="Article category.")
    parser.add_argument("--source", default="STROMA Editorial", help="Article source.")
    parser.add_argument("--link", default="", help="Optional source link.")
    parser.add_argument("--no-push", action="store_true", help="Skip sending push notifications.")

    args = parser.parse_args()

    if args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            for it in data:
                push_article(it, send_push=not args.no_push)
        elif isinstance(data, dict):
            push_article(data, send_push=not args.no_push)
    elif args.title:
        article = {
            "title": args.title,
            "summary": args.summary or args.content or "",
            "content": args.content,
            "date": args.date,
            "category": args.category,
            "source": args.source,
            "link": args.link,
        }
        push_article(article, send_push=not args.no_push)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
