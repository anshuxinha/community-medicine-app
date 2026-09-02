# -*- coding: utf-8 -*-
"""Publish all 18 overhauled chapters (133 leaves) to Firestore libraryContentOverrides.

Ensures that live app instances fetch the authoritative textbook prose,
newly enriched overviews, and standardized exam tips from Firestore.
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

ROOT = Path(__file__).resolve().parents[1]
MOCK_FILE = ROOT / "src" / "data" / "mockData.json"
SERVICE_ACCOUNT = Path(
    os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", ROOT / "serviceAccountKey.json")
)

TARGET_CHAPTER_IDS = {
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "21", "22", "23", "27", "29"
}


def main():
    if not SERVICE_ACCOUNT.exists():
        print(f"Error: Missing service account key at {SERVICE_ACCOUNT}")
        sys.exit(1)

    with open(MOCK_FILE, "r", encoding="utf-8") as f:
        mock_data = json.load(f)

    if not firebase_admin._apps:
        firebase_admin.initialize_app(credentials.Certificate(str(SERVICE_ACCOUNT)))
    db = firestore.client()

    collection_ref = db.collection("libraryContentOverrides")

    # Collect all target leaves
    leaves_to_publish = []
    for ch in mock_data:
        cid = str(ch.get("id"))
        if cid not in TARGET_CHAPTER_IDS:
            continue

        if "subsections" in ch and isinstance(ch["subsections"], list) and len(ch["subsections"]) > 0:
            for sub in ch["subsections"]:
                leaves_to_publish.append({
                    "id": str(sub["id"]),
                    "title": sub.get("title", ""),
                    "content": sub.get("content", ""),
                    "chapter_id": cid
                })
        else:
            leaves_to_publish.append({
                "id": cid,
                "title": ch.get("title", ""),
                "content": ch.get("content", ""),
                "chapter_id": cid
            })

    print(f"Found {len(leaves_to_publish)} leaves to publish across {len(TARGET_CHAPTER_IDS)} chapters.")

    now_iso = datetime.now(timezone.utc).isoformat()
    now_tag = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')

    # Use batches of 100 for Firestore safety
    batch_size = 100
    total_published = 0

    for i in range(0, len(leaves_to_publish), batch_size):
        chunk = leaves_to_publish[i:i + batch_size]
        batch = db.batch()

        for leaf in chunk:
            leaf_id = leaf["id"]
            doc_ref = collection_ref.document(leaf_id)

            payload = {
                "libraryId": leaf_id,
                "libraryTitle": leaf["title"] or leaf_id,
                "proposalId": f"override-{leaf_id}-{now_tag}",
                "proposedContent": leaf["content"],
                "updatedSegments": [],
                "markAsNew": False,
                "status": "active",
                "summaryReason": (
                    f"Library overhaul to Park textbook standard, tailored overview, "
                    f"and exam tip segregation for leaf {leaf_id}"
                ),
                "sourceUpdates": [
                    {
                        "title": "publish_all_overhauled_overrides.py",
                        "type": "library_overhaul_standardization"
                    }
                ],
                "approvedAt": now_iso,
                "approvedBy": "orchestrator-leads",
            }
            batch.set(doc_ref, payload, merge=True)

        batch.commit()
        total_published += len(chunk)
        print(f"Committed batch: {total_published}/{len(leaves_to_publish)} leaves written to Firestore.")

    print(f"\nSUCCESS: All {total_published} leaves successfully published to Firestore libraryContentOverrides!")


if __name__ == "__main__":
    main()
