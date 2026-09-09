# -*- coding: utf-8 -*-
"""Merge ChatGPT clinical diagrams into topicIllustrations.seed.json."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED_PATH = ROOT / "src" / "data" / "topicIllustrations.seed.json"
DEFAULT_JOBS_PATH = ROOT / "scripts" / "clinical_diagram_jobs.json"


def image_entry(job: dict) -> dict:
    return {
        "id": job["id"],
        "fileName": job["fileName"],
        "alt": job["alt"],
        "caption": job["caption"],
        "purpose": "",
        "anchorText": job["anchorText"],
        "placement": job.get("placement", "after"),
        "aspectRatio": 1,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--jobs", default=str(DEFAULT_JOBS_PATH))
    args = parser.parse_args()
    seed = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    jobs = json.loads(Path(args.jobs).read_text(encoding="utf-8"))
    by_key = {entry["contentKey"]: entry for entry in seed}
    added = 0
    for job in jobs:
        key = job["contentKey"]
        img = image_entry(job)
        if key not in by_key:
            entry = {
                "contentKey": key,
                "section": job["section"],
                "topicId": job["topicId"],
                "topicTitle": job["topicTitle"],
                "images": [img],
            }
            seed.append(entry)
            by_key[key] = entry
            added += 1
            print(f"[+] new entry {key} -> {job['id']}")
            continue
        existing_ids = {im.get("id") for im in by_key[key].get("images") or []}
        if job["id"] in existing_ids:
            # replace in place so caption/anchor stay current
            images = by_key[key]["images"]
            for i, im in enumerate(images):
                if im.get("id") == job["id"]:
                    images[i] = img
                    print(f"[=] updated {key} / {job['id']}")
                    break
        else:
            by_key[key]["images"].append(img)
            added += 1
            print(f"[+] appended {key} / {job['id']}")
    SEED_PATH.write_text(json.dumps(seed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"seed saved ({len(seed)} entries)")


if __name__ == "__main__":
    main()
