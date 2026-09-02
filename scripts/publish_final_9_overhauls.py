# -*- coding: utf-8 -*-
"""Publish overhauled leaves for chapters 14, 15, 16, 17, 18, 19, 20, 24, 25 to Firestore."""
import json
import os
from pathlib import Path
from datetime import datetime, timezone
import firebase_admin
from firebase_admin import credentials, firestore

ROOT = Path(__file__).resolve().parents[1]
MOCK = ROOT / "src" / "data" / "mockData.json"
SERVICE_ACCOUNT = Path(
    os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", ROOT / "serviceAccountKey.json")
)

LEAF_IDS = [
    "14",
    "15-1", "15-2", "15-3", "15-4", "15-5", "15-6", "15-7", "15-8",
    "16",
    "17",
    "18-1", "18-2", "18-3", "18-4",
    "19-1", "19-2", "19-3",
    "20-1", "20-2", "20-3",
    "24-1", "24-2", "24-3", "24-4",
    "25",
]

def find_node(nodes, target_id: str):
    for n in nodes:
        if str(n.get("id")) == str(target_id):
            return n
        for key in ("children", "subsections", "items"):
            kids = n.get(key)
            if isinstance(kids, list):
                found = find_node(kids, target_id)
                if found is not None:
                    return found
    return None

def main():
    if not SERVICE_ACCOUNT.exists():
        raise SystemExit(f"Missing service account: {SERVICE_ACCOUNT}")

    if not firebase_admin._apps:
        cred = credentials.Certificate(str(SERVICE_ACCOUNT))
        firebase_admin.initialize_app(cred)

    db = firestore.client()
    data = json.loads(MOCK.read_text(encoding="utf-8"))

    print(f"Publishing {len(LEAF_IDS)} leaves to Firestore libraryContentOverrides...")
    success = 0
    for leaf_id in LEAF_IDS:
        node = find_node(data, leaf_id)
        if not node:
            print(f"ERROR: Node {leaf_id} not found in mockData.json")
            continue
        
        content = node.get("content", "")
        title = node.get("title", "")
        if not content:
            print(f"WARNING: Node {leaf_id} has empty content")
            continue

        doc_ref = db.collection("libraryContentOverrides").document(leaf_id)
        now_iso = datetime.now(timezone.utc).isoformat()
        payload = {
            "libraryId": leaf_id,
            "libraryTitle": title,
            "title": title,
            "proposalId": f"override-{leaf_id}-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}",
            "proposedContent": content,
            "content": content,
            "status": "active",
            "summaryReason": "Lead Directorate overhaul: formal textbook register, exam tips, and mobile UX",
            "recentlyUpdated": False,
            "markAsNew": False,
            "updatedSegments": [],
            "sourceUpdates": [{"title": "publish_final_9_overhauls.py", "type": "manual_override"}],
            "approvedAt": now_iso,
            "approvedBy": "grok-cli",
            "updatedAt": now_iso,
            "publishedAt": now_iso,
        }
        doc_ref.set(payload, merge=True)
        print(f"  [OK] Leaf {leaf_id}: {title} ({len(content):,} chars)")
        success += 1

    print(f"\nSuccessfully published {success}/{len(LEAF_IDS)} overrides to Firestore.")

if __name__ == "__main__":
    main()
