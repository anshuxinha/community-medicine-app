# -*- coding: utf-8 -*-
"""Write Library chapter 29 (Public Health Legislation) into mockData.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOCK = ROOT / "src" / "data" / "mockData.json"
LEAVES = ROOT / "scripts" / "data" / "ph_legislation"

LEAF_META = [
    ("29-0", "Framework and How to Answer a Legislation Paper"),
    ("29-1", "Reproductive, Maternal, and Sex-Selection Law"),
    ("29-2", "Child Protection, Feeding, and Education Law"),
    ("29-3", "Women: Maternity, Violence, Traffic, and Dowry"),
    ("29-4", "Mental Health, Disability, HIV, and Transgender Persons"),
    ("29-5", "Food, Drugs, Tobacco, and Narcotics"),
    ("29-6", "Epidemics, Disasters, and International Health Regulations"),
    ("29-7", "Occupational Health and Labour Law"),
    ("29-8", "Environment and Waste Law"),
    ("29-9", "Professional Regulation, Clinical Establishments, and Consumer Law"),
    ("29-10", "Vital Statistics and Census"),
    ("29-11", "Transplantation, Blood, Older Persons, and Manual Scavenging"),
]


def leaf(id_, title, content):
    text = content.strip() + "\n"
    return {
        "id": id_,
        "title": title,
        "content": text,
        "recentlyUpdated": False,
    }


def main() -> None:
    missing = [lid for lid, _ in LEAF_META if not (LEAVES / f"{lid}.md").exists()]
    if missing:
        raise SystemExit(f"missing leaf files: {', '.join(missing)}")

    data = json.loads(MOCK.read_text(encoding="utf-8"))
    data = [ch for ch in data if str(ch.get("id")) != "29"]

    subsections = []
    for lid, title in LEAF_META:
        raw = (LEAVES / f"{lid}.md").read_text(encoding="utf-8")
        subsections.append(leaf(lid, title, raw))

    chapter = {
        "id": "29",
        "title": "Public Health Legislation",
        "description": "Compiled Indian public health and social legislation for MD Community Medicine: Constitution, classification, and exam-depth notes on the statutes residents must write.",
        "recentlyUpdated": False,
        "subsections": subsections,
    }
    data.append(chapter)
    MOCK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("wrote chapter 29 with", len(subsections), "leaves")
    for s in subsections:
        print(s["id"], len(s["content"]))


if __name__ == "__main__":
    main()
