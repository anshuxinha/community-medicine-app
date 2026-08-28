# -*- coding: utf-8 -*-
"""Dedupe topicIllustrations.seed.json, textbook captions, add new figures."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "src" / "data" / "topicIllustrations.seed.json"

CAPTION_BY_ID = {
    "medicine-evolution-timeline": "Timeline of medicine from early beliefs to the Sustainable Development Goals era.",
    "iceberg-phenomenon": "Iceberg of disease: clinical cases above the waterline and subclinical disease below.",
    "levels-of-prevention": "Levels of prevention and modes of intervention mapped against stages of disease.",
    "evidence-based-pyramid": "Hierarchy of epidemiological evidence, from weakest designs at the base to strongest at the top.",
    "vvm-stages": "Vaccine vial monitor stages from usable inner square to the discard point.",
    "shifting-cutoffs": "Overlapping distributions of well and diseased people, showing how a shifting cut-off trades sensitivity for specificity.",
    "he-30-1-comparative": "Programme A compared with comparator B on costs and consequences.",
    "he-30-2-types": "Six types of economic evaluation, distinguished by how consequences are measured and valued.",
    "he-30-3-cost-taxonomy": "Provider costs and purchaser costs in a health programme.",
    "he-30-3-discounting": "Present-value formula converting a future cost or effect to today's value.",
    "he-30-3-eoq": "Ordering cost, holding cost, and total cost against order quantity, with economic order quantity at the lowest point of total cost.",
    "he-30-3-eoq-inventory": "Inventory falling with use, a reorder point, lead time, and arrival of the new order.",
    "he-30-4-qaly-area": "Quality-adjusted life-years gained as the area between with-intervention and without-intervention health paths.",
    "he-30-5-icer": "Incremental cost-effectiveness ratio, with net monetary benefit and net health benefit.",
    "he-30-5-ce-plane": "Cost-effectiveness plane: extra effect on the x-axis, extra cost on the y-axis, and a threshold line through the origin.",
    "he-30-6-decision-tree": "Decision tree with a choice node, chance nodes, and terminal payoffs.",
    "he-30-7-financing": "Four sources of health finance in India, with National Health Accounts shares.",
    "he-30-8-uhc-cube": "Universal health coverage cube: population covered, services covered, and share of cost covered.",
    "he-30-8-building-blocks": "World Health Organization health system building blocks, with community participation.",
    "hp-23-planning-cycle": "Health planning cycle: eight steps from situation analysis around to evaluation and replan.",
    "hp-23-gantt": "Gantt chart of a six-month facility project, with overlapping activity bars and an inauguration milestone.",
    "he-22-communication-process": "Communication process: sender, message, channel, receiver, and feedback returning to the sender.",
    "abc-ved-inventory-control": "ABC-VED matrix combining annual consumption value with clinical criticality.",
    "healthcare-infrastructure-pyramid": "Three-tier rural health infrastructure and population coverage norms.",
}

NEW_IMAGES = {
    "theory:30-3": [
        {
            "id": "he-30-3-eoq",
            "fileName": "he_30_3_eoq.png",
            "alt": "Ordering cost, holding cost, and total cost against order quantity, with economic order quantity at the minimum of total cost",
            "caption": CAPTION_BY_ID["he-30-3-eoq"],
            "purpose": "",
            "anchorText": "ECONOMIC ORDER QUANTITY (EOQ)",
            "placement": "after",
            "aspectRatio": 1,
        },
        {
            "id": "he-30-3-eoq-inventory",
            "fileName": "he_30_3_eoq_inventory.png",
            "alt": "Inventory cycle showing stock falling with use, a reorder point, lead time, and receipt of the new order",
            "caption": CAPTION_BY_ID["he-30-3-eoq-inventory"],
            "purpose": "",
            "anchorText": "ECONOMIC ORDER QUANTITY (EOQ)",
            "placement": "after",
            "aspectRatio": 1,
        },
    ],
}

NEW_ENTRIES = [
    {
        "contentKey": "theory:22",
        "section": "theory",
        "topicId": "22",
        "topicTitle": "Communication for Health Education",
        "images": [
            {
                "id": "he-22-communication-process",
                "fileName": "he_22_communication_process.png",
                "alt": "Communication process from sender through message, channel, and receiver, with feedback returning to the sender",
                "caption": CAPTION_BY_ID["he-22-communication-process"],
                "purpose": "",
                "anchorText": "COMMUNICATION PROCESS (components)",
                "placement": "after",
                "aspectRatio": 1,
            }
        ],
    },
    {
        "contentKey": "theory:23",
        "section": "theory",
        "topicId": "23",
        "topicTitle": "Health Planning and Management",
        "images": [
            {
                "id": "hp-23-planning-cycle",
                "fileName": "hp_23_planning_cycle.png",
                "alt": "Eight-step health planning cycle from situation analysis to evaluation and replan",
                "caption": CAPTION_BY_ID["hp-23-planning-cycle"],
                "purpose": "",
                "anchorText": "THE HEALTH PLANNING CYCLE",
                "placement": "after",
                "aspectRatio": 1,
            },
            {
                "id": "hp-23-gantt",
                "fileName": "hp_23_gantt.png",
                "alt": "Gantt chart of a six-month urban primary health centre project with overlapping bars and a milestone",
                "caption": CAPTION_BY_ID["hp-23-gantt"],
                "purpose": "",
                "anchorText": "GANTT CHART",
                "placement": "after",
                "aspectRatio": 1,
            },
        ],
    },
]


def caption_from_image(image: dict) -> str:
    existing = str(image.get("caption") or "").strip()
    if existing and not existing.lower().startswith(("to ", "helps ", "makes ", "enables ", "turns ", "gives ", "adds ", "places ", "introduces ", "reinforces ", "provides ", "compresses ", "stops ", "shows why", "visual cue", "practical guide", "quick-reference")):
        # Keep captions that already describe the picture, unless they are purpose-voice.
        if not existing.lower().startswith(("helps students", "visual")):
            return existing
    by_id = CAPTION_BY_ID.get(image.get("id") or "")
    if by_id:
        return by_id
    alt = str(image.get("alt") or "").strip()
    if alt:
        if alt.endswith("."):
            return alt
        return f"{alt}."
    purpose = str(image.get("purpose") or "").strip()
    if purpose and not purpose.lower().startswith(("to ", "helps ", "makes ")):
        return purpose if purpose.endswith(".") else f"{purpose}."
    return existing


def main() -> None:
    raw = json.loads(SEED.read_text(encoding="utf-8"))
    by_key = {}
    skipped = 0
    for entry in raw:
        key = entry.get("contentKey")
        if not key:
            skipped += 1
            continue
        by_key[key] = entry

    for key, extras in NEW_IMAGES.items():
        entry = by_key.get(key)
        if not entry:
            raise SystemExit(f"missing seed entry {key}")
        have = {img.get("id") for img in entry.get("images") or []}
        images = list(entry.get("images") or [])
        for img in extras:
            if img["id"] in have:
                images = [img if i.get("id") == img["id"] else i for i in images]
            else:
                images.append(img)
        entry["images"] = images

    for extra in NEW_ENTRIES:
        by_key[extra["contentKey"]] = extra

    out = []
    for entry in by_key.values():
        images = []
        for image in entry.get("images") or []:
            cleaned = dict(image)
            cleaned["caption"] = caption_from_image(cleaned)
            cleaned["purpose"] = ""
            images.append(cleaned)
        entry = dict(entry)
        entry["images"] = images
        out.append(entry)

    SEED.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    n_img = sum(len(e.get("images") or []) for e in out)
    empty = sum(1 for e in out for i in e.get("images") or [] if not i.get("caption"))
    purpose_left = sum(1 for e in out for i in e.get("images") or [] if i.get("purpose"))
    print(
        f"wrote {len(out)} entries, {n_img} images; skipped_orphan={skipped}; "
        f"empty_captions={empty}; purpose_left={purpose_left}"
    )


if __name__ == "__main__":
    main()
