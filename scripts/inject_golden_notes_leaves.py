# -*- coding: utf-8 -*-
"""Inject Golden Notes gap-fill leaves into mockData.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOCK = ROOT / "src" / "data" / "mockData.json"
SRC = ROOT / "scripts" / "data" / "golden_notes_leaves"

LEAVES = [
    ("31", "31-2", "Sample Registration System: Dual Record and SRS 2024 Indicators"),
    ("31", "31-3", "NFHS-6 versus NFHS-5: Fertility, RCH, Immunization, and Nutrition"),
    ("31", "31-4", "Disease-wise Public Health Indicators: TB, Malaria, HIV, Immunization, NCD"),
    ("31", "31-5", "National Health Policy 2017 Goals versus Current Status"),
    ("31", "31-6", "Survey Methods: Census, SRS, CRS, NFHS, HMIS, and IHIP"),
    ("7", "7-20", "National Viral Hepatitis Control Programme and Rabies Elimination (NAPRE)"),
    ("7", "7-21", "Deafness, Oral Health, Palliative Care, and Fluorosis Programmes"),
    ("7", "7-22", "Climate Health, One Health Mission, and Respiratory Pandemic Preparedness"),
    ("7", "7-23", "SAANS, Sickle Cell Mission, IDCF, and Gestational Diabetes"),
    ("5", "5-9", "Chikungunya, Kala-azar, and Chandipura Virus Disease"),
    ("5", "5-10", "Plague, Leptospirosis, Kyasanur Forest Disease, and Nipah"),
    ("15", "15-8", "Climate Change, Greenhouse Effect, and Heat-Health Action"),
    ("20", "20-3", "Suicide Epidemiology and Prevention"),
    ("26", "26-10", "LQAS, Vaccine Efficacy, Kappa, Survival Analysis, and Statistical Fallacies"),
    ("29", "29-13", "DPDP Act 2023, Animal Birth Control Rules 2023, and E-Waste Rules 2022"),
]

CH32 = [
    ("32-1", "Ayushman Bharat Digital Mission and E-Health"),
    ("32-2", "Artificial Intelligence in Public Health"),
    ("32-3", "Drones in Healthcare Logistics"),
    ("32-4", "Adult Immunization"),
    ("32-5", "Bioterrorism, Biosafety, and Biosecurity"),
]


def leaf(id_: str, title: str, content: str) -> dict:
    return {
        "id": id_,
        "title": title,
        "content": content.strip() + "\n",
        "recentlyUpdated": False,
    }


def read_md(lid: str) -> str:
    p = SRC / f"{lid}.md"
    if not p.exists():
        raise SystemExit(f"missing {p}")
    text = p.read_text(encoding="utf-8")
    if "\u2014" in text or " -- " in text:
        raise SystemExit(f"em-dash or clause dash in {lid}")
    if "Park" in text:
        raise SystemExit(f"Park name-drop in {lid}")
    return text


def find_chapter(data: list, cid: str) -> dict:
    for n in data:
        if n.get("id") == cid:
            return n
    raise SystemExit(f"chapter {cid} missing")


def append_if_absent(ch: dict, id_: str, title: str) -> None:
    subs = ch.setdefault("subsections", [])
    if any(s.get("id") == id_ for s in subs):
        print("skip existing", id_)
        return
    subs.append(leaf(id_, title, read_md(id_)))
    print("added", id_, len(subs[-1]["content"]))


def main() -> None:
    data = json.loads(MOCK.read_text(encoding="utf-8"))
    for cid, lid, title in LEAVES:
        append_if_absent(find_chapter(data, cid), lid, title)

    if not any(x.get("id") == "32" for x in data):
        subs = [leaf(lid, title, read_md(lid)) for lid, title in CH32]
        data.append(
            {
                "id": "32",
                "title": "Recent Advances and Miscellaneous Public Health",
                "description": (
                    "Digital health, adult immunization, artificial intelligence, "
                    "medical drones, bioterrorism and biosafety for MD Paper IV."
                ),
                "recentlyUpdated": False,
                "subsections": subs,
            }
        )
        print("added chapter 32 with", len(subs), "leaves")
    else:
        ch32 = find_chapter(data, "32")
        for lid, title in CH32:
            append_if_absent(ch32, lid, title)

    MOCK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("ok chapters", [c["id"] for c in data])


if __name__ == "__main__":
    main()
