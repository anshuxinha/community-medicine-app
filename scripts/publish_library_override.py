# -*- coding: utf-8 -*-
"""Publish a mockData leaf to Firestore libraryContentOverrides.

Usage:
  python scripts/publish_library_override.py 2
  python scripts/publish_library_override.py 2 --reason "optional summary"
"""
from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

ROOT = Path(__file__).resolve().parents[1]
MOCK = ROOT / "src" / "data" / "mockData.json"
SERVICE_ACCOUNT = Path(
    os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", ROOT / "serviceAccountKey.json")
)


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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("library_id", help="Library leaf id, e.g. 2")
    parser.add_argument("--reason", default="", help="summaryReason for override")
    args = parser.parse_args()
    library_id = str(args.library_id)

    if not SERVICE_ACCOUNT.exists():
        raise SystemExit(f"Missing service account: {SERVICE_ACCOUNT}")

    data = json.loads(MOCK.read_text(encoding="utf-8"))
    node = find_node(data if isinstance(data, list) else next(
        (v for v in data.values() if isinstance(v, list)), []
    ), library_id) if isinstance(data, list) else None
    if node is None and isinstance(data, dict):
        for val in data.values():
            if isinstance(val, list):
                node = find_node(val, library_id)
                if node is not None:
                    break
    if node is None and isinstance(data, list):
        node = find_node(data, library_id)
    if node is None or not node.get("content"):
        raise SystemExit(f"Library id={library_id} content not found in mockData.json")

    content = node["content"]
    if not firebase_admin._apps:
        firebase_admin.initialize_app(credentials.Certificate(str(SERVICE_ACCOUNT)))
    db = firestore.client()

    approved_at = datetime.now(timezone.utc).isoformat()
    reason = args.reason or (
        f"Library content override for id={library_id} from mockData "
        f"({datetime.now(timezone.utc).strftime('%Y-%m-%d')})"
    )
    payload = {
        "libraryId": library_id,
        "libraryTitle": node.get("title") or library_id,
        "proposalId": f"override-{library_id}-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}",
        "proposedContent": content,
        "updatedSegments": [],
        "status": "active",
        "summaryReason": reason,
        "sourceUpdates": [{"title": "publish_library_override.py", "type": "manual_override"}],
        "approvedAt": approved_at,
        "approvedBy": "grok-cli",
    }

    db.collection("libraryContentOverrides").document(library_id).set(payload, merge=True)
    snap = db.collection("libraryContentOverrides").document(library_id).get()
    data_out = snap.to_dict() or {}
    print(
        json.dumps(
            {
                "ok": True,
                "docId": library_id,
                "status": data_out.get("status"),
                "contentLen": len(data_out.get("proposedContent") or ""),
                "approvedAt": data_out.get("approvedAt"),
                "proposalId": data_out.get("proposalId"),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
