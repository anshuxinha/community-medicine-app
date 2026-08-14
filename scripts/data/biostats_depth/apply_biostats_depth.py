# -*- coding: utf-8 -*-
"""Inject Mahajan-depth Biostats leaves and solved exercises into mockData.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
MOCK = ROOT / "src" / "data" / "mockData.json"
HERE = Path(__file__).resolve().parent

THEORY = {
    "26-1": HERE / "26-1.md",
    "26-2": HERE / "26-2.md",
    "26-3": HERE / "26-3.md",
    "26-4": HERE / "26-4.md",
    "26-5": HERE / "26-5.md",
    "26-6": HERE / "26-6.md",
    "26-7": HERE / "26-7.md",
    "26-8": HERE / "26-8.md",
    "26-9": HERE / "26-9.md",
}

EXERCISES = {
    "26-1": [HERE / "ex_26-1.md"],
    "26-2": [HERE / "ex_26-2.md"],
    "26-3": [HERE / "ex_26-3.md"],
    "26-4": [HERE / "ex_26-4.md"],
    "26-5": [HERE / "ex_26-5.md"],
    "26-6": [HERE / "ex_26-6a.md", HERE / "ex_26-6b.md"],
    "26-7": [HERE / "ex_26-7.md"],
    "26-8": [HERE / "ex_26-8.md"],
}


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


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8").strip() + "\n"


def parse_offchapter(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    chunks: dict[str, str] = {}
    current = None
    buf: list[str] = []
    for line in text.splitlines():
        if line.startswith("##LEAF##"):
            if current is not None:
                chunks[current] = "\n".join(buf).strip() + "\n"
            current = line.replace("##LEAF##", "").strip()
            buf = []
        else:
            buf.append(line)
    if current is not None:
        chunks[current] = "\n".join(buf).strip() + "\n"
    return chunks


def join_body(theory: str, exercise_paths: list[Path]) -> str:
    parts = [theory.rstrip()]
    for p in exercise_paths:
        parts.append(read_text(p).rstrip())
    return "\n\n".join(parts) + "\n"


def main() -> None:
    data = json.loads(MOCK.read_text(encoding="utf-8"))
    ch26 = find_node(data, "26")
    if ch26 is None:
        raise SystemExit("Chapter 26 not found")

    for leaf_id, path in THEORY.items():
        if leaf_id == "26-9":
            continue
        node = find_node(data, leaf_id)
        if node is None:
            raise SystemExit(f"Missing {leaf_id}")
        node["content"] = join_body(read_text(path), EXERCISES.get(leaf_id, []))

    existing = {str(s.get("id")) for s in ch26.get("subsections") or []}
    if "26-9" not in existing:
        ch26.setdefault("subsections", []).append(
            {
                "id": "26-9",
                "title": "Designing and Methodology of a Study",
                "content": read_text(THEORY["26-9"]),
            }
        )
    else:
        find_node(data, "26-9")["content"] = read_text(THEORY["26-9"])

    off = parse_offchapter(HERE / "ex_offchapter.md")
    for leaf_id, block in off.items():
        node = find_node(data, leaf_id)
        if node is None or not node.get("content"):
            raise SystemExit(f"Off-chapter leaf missing: {leaf_id}")
        content = node["content"].rstrip()
        if "[EX]" in content and f"[EX]{block.split('[EX]')[1][:6]}" in content:
            continue
        # Avoid duplicating if this apply is re-run
        first_q = None
        for line in block.splitlines():
            if line.startswith("[EX]"):
                first_q = line[4:20]
                break
        if first_q and first_q in content:
            continue
        node["content"] = content + "\n\n" + block.lstrip()

    MOCK.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("Updated", MOCK)


if __name__ == "__main__":
    main()
