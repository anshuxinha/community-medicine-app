# -*- coding: utf-8 -*-
"""Inject batch-3 Golden Notes leaves into mockData.json and practical.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOCK = ROOT / "src" / "data" / "mockData.json"
PRACTICAL = ROOT / "src" / "data" / "practical.json"
SRC = ROOT / "scripts" / "data" / "golden_notes_leaves"

LIB = [
    ("5", "5-11", "Trachoma, Yaws, Scabies, and Pediculosis"),
    ("7", "7-24", "Kayakalp, Swachh Swasth Sarvatra, and VISHWAS"),
    ("7", "7-25", "Janaushadhi, PMSSY, Dialysis, PM-ABHIM, PM-JANMAN, and AYUSH Mission"),
    ("7", "7-26", "Nasha Mukt Bharat Abhiyaan"),
    ("32", "32-6", "National Action Plan on Antimicrobial Resistance 2.0"),
    ("32", "32-7", "GIS and Remote Sensing in Public Health"),
    ("32", "32-9", "CBME, AETCOM, and Family Adoption Programme"),
    ("32", "32-10", "Medical Tourism, Carbon Footprint, and Genetically Modified Foods"),
    ("32", "32-11", "Traveler's Health and Yellow Fever IHR Certificate"),
]

PRAC = [
    ("6", "Spots: Pedigree, MCCD, Cold Chain, Growth Chart, Partograph, Entomology", "practical-6"),
    ("7", "Viva Pack: Days, Helplines, Vectors, Incubation Periods, Eliminated Diseases", "practical-7"),
    ("8", "High-yield Contrasts", "practical-8"),
]


def node(id_: str, title: str, content: str) -> dict:
    return {
        "id": id_,
        "title": title,
        "content": content.strip() + "\n",
        "recentlyUpdated": False,
    }


def read_md(name: str) -> str:
    p = SRC / f"{name}.md"
    text = p.read_text(encoding="utf-8")
    if "\u2014" in text or " -- " in text:
        raise SystemExit(f"em-dash in {name}")
    if "Park" in text:
        raise SystemExit(f"Park in {name}")
    return text


def find_ch(data: list, cid: str) -> dict:
    for n in data:
        if n.get("id") == cid:
            return n
    raise SystemExit(f"missing chapter {cid}")


def append_lib(ch: dict, id_: str, title: str) -> None:
    subs = ch.setdefault("subsections", [])
    if any(s.get("id") == id_ for s in subs):
        print("skip", id_)
        return
    subs.append(node(id_, title, read_md(id_)))
    print("lib", id_, len(subs[-1]["content"]))


def main() -> None:
    data = json.loads(MOCK.read_text(encoding="utf-8"))
    for cid, lid, title in LIB:
        append_lib(find_ch(data, cid), lid, title)
    MOCK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    prac = json.loads(PRACTICAL.read_text(encoding="utf-8"))
    existing = {str(n.get("id")) for n in prac}
    for pid, title, fname in PRAC:
        if pid in existing:
            print("skip practical", pid)
            continue
        prac.append(node(pid, title, read_md(fname)))
        print("practical", pid, len(prac[-1]["content"]))
    PRACTICAL.write_text(json.dumps(prac, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("done")


if __name__ == "__main__":
    main()
