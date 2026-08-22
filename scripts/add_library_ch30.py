# -*- coding: utf-8 -*-
"""Write Library chapter 30 (Health Economics) into mockData.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOCK = ROOT / "src" / "data" / "mockData.json"
LEAVES = ROOT / "scripts" / "data" / "health_economics"

LEAF_META = [
    ("30-1", "Introduction, Scarcity, Opportunity Cost, and Health Technology Assessment"),
    ("30-2", "Types of Economic Evaluation"),
    ("30-3", "Costs, Perspectives, Discounting, and Marginal Cost"),
    ("30-4", "Measuring and Valuing Effects: QALY, DALY, and Willingness to Pay"),
    ("30-5", "ICER, Cost-Effectiveness Plane, and Decision Rules"),
    ("30-6", "Models, Uncertainty, and Critical Appraisal"),
    ("30-7", "Health Financing in India, NHA, OOPE, and Insurance"),
    ("30-8", "Resource Allocation, Universal Health Coverage, and Using Evaluation"),
]


def leaf(id_, title, content):
    text = content.strip() + "\n"
    return {
        "id": id_,
        "title": title,
        "content": text,
        "recentlyUpdated": True,
    }


def main() -> None:
    missing = [lid for lid, _ in LEAF_META if not (LEAVES / f"{lid}.md").exists()]
    if missing:
        raise SystemExit(f"missing leaf files: {', '.join(missing)}")

    data = json.loads(MOCK.read_text(encoding="utf-8"))
    data = [ch for ch in data if str(ch.get("id")) != "30"]

    subsections = []
    for lid, title in LEAF_META:
        raw = (LEAVES / f"{lid}.md").read_text(encoding="utf-8")
        subsections.append(leaf(lid, title, raw))

    chapter = {
        "id": "30",
        "title": "Health Economics",
        "description": "Economic evaluation of health programmes, costing, QALY and DALY, ICER and thresholds, and health financing in India for MD Community Medicine.",
        "recentlyUpdated": True,
        "subsections": subsections,
    }
    data.append(chapter)
    MOCK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("wrote chapter 30 with", len(subsections), "leaves")
    for s in subsections:
        print(s["id"], len(s["content"]))


if __name__ == "__main__":
    main()
