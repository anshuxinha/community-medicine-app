# -*- coding: utf-8 -*-
"""Add missing named Library topics, remove Practical Spots, strip exam-instruction voice."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOCK = ROOT / "src" / "data" / "mockData.json"
PRAC = ROOT / "src" / "data" / "practical.json"
NMC = ROOT / "src" / "data" / "nmcCurriculum.js"
SEED = ROOT / "src" / "data" / "topicIllustrations.seed.json"
LEAVES = ROOT / "scripts" / "data" / "golden_notes_leaves"

GN_IDS = {
    "5-9", "5-10", "5-11",
    "6-1", "6-2", "6-3", "6-4", "6-5", "6-6",
    "7-20", "7-21", "7-22", "7-23", "7-24", "7-25", "7-26",
    "15-8", "20-3", "26-10", "29-13",
    "31-1", "31-2", "31-3", "31-4", "31-5", "31-6",
    "32-1", "32-2", "32-3", "32-4", "32-5", "32-6", "32-7", "32-8", "32-9", "32-10", "32-11",
    "27-4", "27-13", "27-14", "12-7",
}

PRAC_IDS = {"2-4", "2-5", "2-6", "2-7", "2-8", "2-9", "4-3", "4-4", "5-6", "5-7", "7", "8"}

def strip_exam_tip_lines(text: str) -> str:
    """Remove only exam-tip lines. Do not delete following textbook paragraphs."""
    out = []
    for line in text.splitlines(True):
        if line.lstrip().startswith("> **EXAM TIP:**"):
            continue
        out.append(line)
    t = "".join(out)
    while "\n\n\n" in t:
        t = t.replace("\n\n\n", "\n\n")
    return t


def read_md(name: str) -> str:
    return (LEAVES / f"{name}.md").read_text(encoding="utf-8").strip() + "\n"


def clean_voice(text: str) -> str:
    return strip_exam_tip_lines(text).strip() + "\n"


def walk_clean(nodes, ids):
    n = 0
    for item in nodes:
        iid = str(item.get("id"))
        if iid in ids and isinstance(item.get("content"), str):
            new = clean_voice(item["content"])
            if new != item["content"]:
                item["content"] = new
                n += 1
        kids = item.get("subsections")
        if isinstance(kids, list):
            n += walk_clean(kids, ids)
    return n


def find(nodes, nid):
    for n in nodes:
        if str(n.get("id")) == str(nid):
            return n
        k = find(n.get("subsections") or [], nid)
        if k:
            return k
    return None


def node(id_: str, title: str, content: str) -> dict:
    return {
        "id": id_,
        "title": title,
        "content": content if content.endswith("\n") else content + "\n",
        "recentlyUpdated": False,
    }


def main() -> None:
    data = json.loads(MOCK.read_text(encoding="utf-8"))
    ch27 = next(c for c in data if str(c.get("id")) == "27")
    ch12 = next(c for c in data if str(c.get("id")) == "12")

    n27_4 = find(ch27["subsections"], "27-4")
    n27_4["title"] = "Leadership, Motivation, Community Diagnosis, and Behaviour Change"
    n27_4["content"] = clean_voice(n27_4["content"])

    leader_block = """
LEADER AND MANAGER
A leader sets direction and builds the team around a change. A manager plans, organises, and controls work within the present structure. The same officer often does both. Distinctions commonly listed:

| Leader | Manager |
| --- | --- |
| Visionary | Planner |
| Strategist | Controller |
| Advocate | Supervisor |
| Team builder | Monitor of resources |
| Change agent | Guardian of the present order |

Qualities of a good leader in a health team include integrity, technical competence, the ability to listen, fairness in posting and leave, and willingness to take responsibility for failure as well as credit.
"""
    marker = "GROUP DYNAMICS & CONFLICT RESOLUTION"
    if "LEADER AND MANAGER" not in n27_4["content"] and marker in n27_4["content"]:
        n27_4["content"] = n27_4["content"].replace(
            marker, leader_block.strip() + "\n\n" + marker, 1
        )

    ids27 = {s["id"] for s in ch27["subsections"]}
    if "27-13" not in ids27:
        ch27["subsections"].append(
            node(
                "27-13",
                "Johari Window, Sociometry, Tanahashi Model, and Social Audit",
                read_md("27-13"),
            )
        )
    if "27-14" not in ids27:
        ch27["subsections"].append(
            node(
                "27-14",
                "Public-Private Partnership for Health",
                read_md("27-14"),
            )
        )

    ids12 = {s["id"] for s in ch12["subsections"]}
    if "12-7" not in ids12:
        ch12["subsections"].append(
            node(
                "12-7",
                "Anthropology, Social Marketing, Child Abuse, and Community-based Rehabilitation",
                read_md("12-7"),
            )
        )

    cleaned = walk_clean(data, GN_IDS)
    MOCK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("library cleaned nodes", cleaned)
    print("27-4 title", n27_4["title"])
    print("27 ids", [s["id"] for s in ch27["subsections"]])
    print("12 ids", [s["id"] for s in ch12["subsections"]])

    prac = json.loads(PRAC.read_text(encoding="utf-8"))
    before = len(prac)
    prac = [p for p in prac if str(p.get("id")) != "6"]
    p_clean = walk_clean(prac, PRAC_IDS)
    PRAC.write_text(json.dumps(prac, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("practical chapters", before, "->", len(prac), "cleaned", p_clean)

    nmc = NMC.read_text(encoding="utf-8")
    nmc2 = re.sub(
        r'\n  "6": \{\s*skillTags: \["spots"\],\s*paperAffinity: null,\s*label: "Spots",\s*\},',
        "",
        nmc,
    )
    if nmc2 == nmc:
        raise SystemExit("nmc spots block not found")
    NMC.write_text(nmc2, encoding="utf-8")
    print("nmc spots map removed")

    seed = json.loads(SEED.read_text(encoding="utf-8"))
    seed2 = [row for row in seed if row.get("contentKey") != "practical:6"]
    SEED.write_text(json.dumps(seed2, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("illustration seed", len(seed), "->", len(seed2))

    # live Park name-drop in communication heading
    data = json.loads(MOCK.read_text(encoding="utf-8"))
    ch22 = next(c for c in data if str(c.get("id")) == "22")
    if "COMMUNICATION (Park concept)" in ch22.get("content", ""):
        ch22["content"] = ch22["content"].replace(
            "COMMUNICATION (Park concept)", "COMMUNICATION", 1
        )
        MOCK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print("removed Park concept heading in 22")


if __name__ == "__main__":
    main()
