# -*- coding: utf-8 -*-
"""Inject batch-4 cases, 32-8, and illustration seed rows."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOCK = ROOT / "src" / "data" / "mockData.json"
PRACTICAL = ROOT / "src" / "data" / "practical.json"
SEED = ROOT / "src" / "data" / "topicIllustrations.seed.json"
SRC = ROOT / "scripts" / "data" / "golden_notes_leaves"

PRAC_SUBS = [
    ("2", "2-4", "Antenatal Case (Worked Family Presentation)", "practical-2-4"),
    ("2", "2-5", "Postnatal Case (Mother and Newborn)", "practical-2-5"),
    ("2", "2-6", "Infant Case: Growth, Feeding, and Immunization", "practical-2-6"),
    ("2", "2-7", "Adolescent and Geriatric Cases", "practical-2-7"),
    ("2", "2-8", "Under-five Case: PEM, Diarrhoea, and Pneumonia", "practical-2-8"),
    ("2", "2-9", "NCD, Tuberculosis, and Fever Cases", "practical-2-9"),
    ("4", "4-3", "Clinico-social Cases with Model Answers", "practical-4-3"),
    ("4", "4-4", "Self-learning Stems and Model Answers", "practical-4-4"),
    ("5", "5-6", "Vaccine Requirement, Horrock's, and Secondary Attack Rate", "practical-5-6"),
    ("5", "5-7", "LQAS, Kappa, and Vaccine Efficacy Exercises", "practical-5-7"),
]

FIGS = [
    ("theory", "32-1", "Ayushman Bharat Digital Mission and E-Health",
     "gn_32_1_abdm_blocks.png", "abdm-blocks",
     "Five ABDM building blocks: ABHA, professional registry, facility registry, personal health record, and unified health interface.",
     "ABDM building blocks.", "BUILDING BLOCKS"),
    ("theory", "32-6", "National Action Plan on Antimicrobial Resistance 2.0",
     "gn_32_6_nap_amr.png", "nap-amr-objectives",
     "Six NAP-AMR 2.0 strategic objectives from awareness to intersectoral governance.",
     "NAP-AMR 2.0 six strategic objectives.", "SIX STRATEGIC OBJECTIVES"),
    ("theory", "32-11", "Traveler's Health and Yellow Fever IHR Certificate",
     "gn_32_11_yf_ihr.png", "yf-ihr-flow",
     "Yellow fever IHR flow: authorised vaccine, 10-day wait, lifelong validity, and 6-day quarantine if the certificate is missing.",
     "IHR yellow fever certificate flow for travel to India.", "YELLOW FEVER (IHR)"),
    ("theory", "5-11", "Trachoma, Yaws, Scabies, and Pediculosis",
     "gn_5_11_safe.png", "safe-trachoma",
     "WHO SAFE strategy for trachoma: surgery, antibiotics, facial cleanliness, environmental improvement.",
     "SAFE strategy for trachoma.", "SAFE strategy"),
    ("theory", "15-8", "Climate Change, Greenhouse Effect, and Heat-Health Action",
     "gn_15_8_climate.png", "climate-pathways",
     "Five health pathways from climate change: heat, extreme weather, water and food, air, and vectors.",
     "Climate change health pathways.", "HEALTH IMPACT MAP"),
    ("theory", "7-24", "Kayakalp, Swachh Swasth Sarvatra, and VISHWAS",
     "gn_7_24_kayakalp.png", "kayakalp-criteria",
     "Eight Kayakalp assessment criteria from hospital upkeep to eco-friendly facility.",
     "Kayakalp eight assessment criteria.", "KAYAKALP"),
    ("practical", "6", "Spots: Pedigree, MCCD, Cold Chain, Growth Chart, Partograph, Entomology",
     "gn_prac_6_pedigree.png", "pedigree-reading",
     "How to read a pedigree: male, female, affected, dominant, recessive, and X-linked patterns.",
     "Pedigree symbols and inheritance patterns.", "PEDIGREE CHART"),
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
    raise SystemExit(f"missing {cid}")


def append_sub(ch: dict, id_: str, title: str, fname: str) -> None:
    subs = ch.setdefault("subsections", [])
    if any(s.get("id") == id_ for s in subs):
        print("skip", id_)
        return
    subs.append(node(id_, title, read_md(fname)))
    print("added", id_, len(subs[-1]["content"]))


def main() -> None:
    mock = json.loads(MOCK.read_text(encoding="utf-8"))
    ch32 = find_ch(mock, "32")
    append_sub(ch32, "32-8", "Evidence-based Public Health, Systematic Review, and ROC", "32-8")
    # keep numeric-ish order: 32-8 before 32-9
    subs = ch32["subsections"]
    subs.sort(key=lambda s: [int(x) if x.isdigit() else x for x in str(s["id"]).replace("-", ".").split(".")])
    MOCK.write_text(json.dumps(mock, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    prac = json.loads(PRACTICAL.read_text(encoding="utf-8"))
    for cid, lid, title, fname in PRAC_SUBS:
        append_sub(find_ch(prac, cid), lid, title, fname)
    PRACTICAL.write_text(json.dumps(prac, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    seed = json.loads(SEED.read_text(encoding="utf-8"))
    have = {(e.get("contentKey"), img.get("fileName")) for e in seed for img in e.get("images") or []}
    for section, tid, title, fname, iid, alt, cap, anchor in FIGS:
        key = f"{section}:{tid}"
        if (key, fname) in have:
            print("skip fig", fname)
            continue
        entry = next((e for e in seed if e.get("contentKey") == key), None)
        image = {
            "id": iid,
            "fileName": fname,
            "alt": alt,
            "caption": cap,
            "purpose": "",
            "anchorText": anchor,
            "placement": "after",
            "aspectRatio": 1,
        }
        if entry is None:
            seed.append({
                "contentKey": key,
                "section": section,
                "topicId": tid,
                "topicTitle": title,
                "images": [image],
            })
        else:
            entry["images"].append(image)
        print("seed", fname)

    SEED.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("done")


if __name__ == "__main__":
    main()
