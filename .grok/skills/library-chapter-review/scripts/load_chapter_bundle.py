#!/usr/bin/env python3
"""
Load the effective Library chapter content (mockData + active Firebase overrides),
match the Park textbook PDF, and extract PYQs for that chapter.

Usage:
  python .grok/skills/library-chapter-review/scripts/load_chapter_bundle.py "2"
  python .grok/skills/library-chapter-review/scripts/load_chapter_bundle.py "Concept of Health"
  python .grok/skills/library-chapter-review/scripts/load_chapter_bundle.py 5 --no-firebase
  python .grok/skills/library-chapter-review/scripts/load_chapter_bundle.py 7 --out dist/library_chapter_reviews
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Windows console safety
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# .../The App/.grok/skills/library-chapter-review/scripts/this_file.py → parents[4] = app root
ROOT = Path(__file__).resolve().parents[4]  # D:\The App
MOCK_DATA_PATH = ROOT / "src" / "data" / "mockData.json"
SERVICE_ACCOUNT_PATH = ROOT / "serviceAccountKey.json"
PARK_SPLIT_DIR = Path(r"D:\Study Related\Books\Park Split")
PYQ_REPORT_PATH = Path(
    r"D:\IGIMS\Major Tests & Question Papers\categorized_questions_report.md"
)
PROJECT_ID = "community-med-app"
DEFAULT_OUT = ROOT / "dist" / "library_chapter_reviews"

# App chapter id (1-27) -> Park chapter number used in PYQ report / Park PDFs.
# Chapters 26–27 are app-only extras; Park mapping falls back to closest titles.
APP_TO_PARK = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,  # NCD
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    11: 11,
    12: 12,  # Medicine and Social Sciences
    13: 13,
    14: 14,
    15: 15,
    16: 16,
    17: 17,
    18: 18,
    19: 19,
    20: 20,
    21: 21,
    22: 22,
    23: 23,
    24: 24,
    25: 25,
    26: 21,  # Biostatistics overlaps Park Ch.21
    27: 23,  # Public Health Management overlaps Park Ch.23
}


def load_mock_data() -> list[dict[str, Any]]:
    with MOCK_DATA_PATH.open(encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise SystemExit("mockData.json root must be a list of chapters")
    return data


def find_item_by_id(items: list[dict[str, Any]], target_id: str) -> dict[str, Any] | None:
    for item in items:
        if str(item.get("id")) == str(target_id):
            return item
        subsections = item.get("subsections") or []
        if subsections:
            match = find_item_by_id(subsections, target_id)
            if match:
                return match
    return None


def normalize(s: str) -> str:
    s = (s or "").lower()
    s = re.sub(r"[^a-z0-9\s&+]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def resolve_chapter(mock: list[dict[str, Any]], query: str) -> dict[str, Any]:
    q = (query or "").strip()
    if not q:
        raise SystemExit("Chapter query is empty")

    # Exact id match (chapter or subsection)
    by_id = find_item_by_id(mock, q)
    if by_id and (by_id.get("content") is not None or by_id.get("subsections")):
        # Prefer top-level chapter if id is top-level
        top = next((c for c in mock if str(c.get("id")) == str(q)), None)
        if top:
            return top
        # Subsection query: return parent chapter
        parent_id = str(q).split("-")[0]
        parent = next((c for c in mock if str(c.get("id")) == parent_id), None)
        if parent:
            return parent

    # Numeric chapter number
    if re.fullmatch(r"\d{1,2}", q):
        top = next((c for c in mock if str(c.get("id")) == q.lstrip("0") or str(c.get("id")) == q), None)
        if top:
            return top
        raise SystemExit(f"No chapter with id={q}")

    # Title / fuzzy name match on top-level chapters
    nq = normalize(q)
    scored: list[tuple[int, dict[str, Any]]] = []
    for ch in mock:
        title = normalize(ch.get("title") or "")
        if not title:
            continue
        score = 0
        if nq == title:
            score = 100
        elif nq in title or title in nq:
            score = 80
        else:
            # token overlap
            tq = set(nq.split())
            tt = set(title.split())
            if tq and tt:
                overlap = len(tq & tt) / max(len(tq), 1)
                if overlap >= 0.5:
                    score = int(60 * overlap)
        if score:
            scored.append((score, ch))
    if not scored:
        raise SystemExit(f"Could not match chapter from query: {query!r}")
    scored.sort(key=lambda x: (-x[0], str(x[1].get("id"))))
    return scored[0][1]


def fetch_active_overrides(use_firebase: bool) -> dict[str, dict[str, Any]]:
    if not use_firebase:
        return {}
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        print("WARN: firebase-admin not installed; using mockData only", file=sys.stderr)
        return {}

    cred = None
    env_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if env_json:
        try:
            cred = credentials.Certificate(json.loads(env_json))
        except Exception as e:
            print(f"WARN: FIREBASE_SERVICE_ACCOUNT_JSON invalid: {e}", file=sys.stderr)
    if cred is None:
        if SERVICE_ACCOUNT_PATH.exists():
            cred = credentials.Certificate(str(SERVICE_ACCOUNT_PATH))
        else:
            print("WARN: no service account; using mockData only", file=sys.stderr)
            return {}

    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred, {"projectId": PROJECT_ID})
    db = firestore.client()
    overrides: dict[str, dict[str, Any]] = {}
    for doc in db.collection("libraryContentOverrides").stream():
        data = doc.to_dict() or {}
        status = data.get("status")
        content = data.get("proposedContent")
        if status not in ("active", "approved"):
            continue
        if not isinstance(content, str) or not content.strip():
            continue
        lid = str(data.get("libraryId") or doc.id)
        overrides[lid] = data
    return overrides


def apply_overrides_to_tree(
    node: dict[str, Any], overrides: dict[str, dict[str, Any]]
) -> dict[str, Any]:
    """Deep-copy node and apply override content where libraryId matches."""
    out = dict(node)
    lid = str(out.get("id"))
    ov = overrides.get(lid)
    if ov and isinstance(ov.get("proposedContent"), str):
        out["content"] = ov["proposedContent"]
        out["_override"] = {
            "libraryId": lid,
            "libraryTitle": ov.get("libraryTitle"),
            "approvedAt": str(ov.get("approvedAt") or ""),
            "approvedBy": ov.get("approvedBy"),
            "proposalId": ov.get("proposalId"),
            "contentLength": len(ov["proposedContent"]),
        }
    subs = out.get("subsections")
    if isinstance(subs, list) and subs:
        out["subsections"] = [apply_overrides_to_tree(s, overrides) for s in subs]
    return out


def collect_leaf_contents(node: dict[str, Any], path: list[str] | None = None) -> list[dict[str, Any]]:
    path = path or []
    title = node.get("title") or ""
    cur = path + [title]
    leaves: list[dict[str, Any]] = []
    subs = node.get("subsections") or []
    content = node.get("content")
    if isinstance(subs, list) and subs:
        for s in subs:
            leaves.extend(collect_leaf_contents(s, cur))
    elif isinstance(content, str):
        leaves.append(
            {
                "id": str(node.get("id")),
                "title": title,
                "path": " > ".join(cur),
                "content": content,
                "contentLength": len(content),
                "override": node.get("_override"),
            }
        )
    return leaves


def match_park_pdf(park_chapter_num: int, chapter_title: str) -> dict[str, Any]:
    if not PARK_SPLIT_DIR.exists():
        return {"path": None, "matchMethod": None, "error": f"Missing dir: {PARK_SPLIT_DIR}"}

    files = list(PARK_SPLIT_DIR.glob("*.pdf"))
    if not files:
        return {"path": None, "matchMethod": None, "error": "No PDFs in Park Split"}

    # 1) Chapter N_Park.pdf or Chapter N
    num_patterns = [
        re.compile(rf"^Chapter\s*{park_chapter_num}[_\s]", re.I),
        re.compile(rf"^Chapter\s*{park_chapter_num}\b", re.I),
        re.compile(rf"^{park_chapter_num}[\.\s]"),
        re.compile(rf"^0?{park_chapter_num}[\.\s_-]"),
    ]
    for f in files:
        for pat in num_patterns:
            if pat.search(f.name):
                return {
                    "path": str(f),
                    "matchMethod": "chapter_number",
                    "fileName": f.name,
                    "parkChapter": park_chapter_num,
                }

    # 2) Title token match
    title_n = normalize(chapter_title)
    # drop common stop words
    stop = {"and", "of", "the", "in", "for", "to", "a", "an", "health", "medicine"}
    tokens = [t for t in title_n.split() if t not in stop and len(t) > 2]
    best = None
    best_score = 0.0
    for f in files:
        fn = normalize(f.stem)
        if not tokens:
            continue
        hits = sum(1 for t in tokens if t in fn)
        score = hits / len(tokens)
        if score > best_score:
            best_score = score
            best = f
    if best and best_score >= 0.4:
        return {
            "path": str(best),
            "matchMethod": "title_fuzzy",
            "fileName": best.name,
            "score": round(best_score, 3),
            "parkChapter": park_chapter_num,
        }

    return {
        "path": None,
        "matchMethod": None,
        "error": f"No Park PDF matched for ch {park_chapter_num} / {chapter_title!r}",
        "available": [f.name for f in files],
    }


def extract_pdf_text(pdf_path: str, max_chars: int = 200_000) -> dict[str, Any]:
    path = Path(pdf_path)
    if not path.exists():
        return {"text": "", "error": "file missing"}
    try:
        import pdfplumber
    except ImportError:
        try:
            from pypdf import PdfReader
        except ImportError:
            return {"text": "", "error": "install pdfplumber or pypdf"}
        reader = PdfReader(str(path))
        parts = []
        for page in reader.pages:
            parts.append(page.extract_text() or "")
            if sum(len(p) for p in parts) >= max_chars:
                break
        text = "\n".join(parts)
        return {"text": text[:max_chars], "pages": len(reader.pages), "truncated": len(text) > max_chars}

    parts: list[str] = []
    pages = 0
    with pdfplumber.open(str(path)) as pdf:
        pages = len(pdf.pages)
        for page in pdf.pages:
            parts.append(page.extract_text() or "")
            if sum(len(p) for p in parts) >= max_chars:
                break
    text = "\n".join(parts)
    return {"text": text[:max_chars], "pages": pages, "truncated": len(text) > max_chars}


def parse_pyqs_for_chapter(park_chapter_num: int) -> dict[str, Any]:
    if not PYQ_REPORT_PATH.exists():
        return {"error": f"Missing PYQ report: {PYQ_REPORT_PATH}", "lq": [], "sn": [], "mcq": []}

    text = PYQ_REPORT_PATH.read_text(encoding="utf-8")
    # Match ### Chapter N: Title ... until next ### Chapter or end
    pat = re.compile(
        rf"^### Chapter\s+{park_chapter_num}:\s*(.+?)\s*$",
        re.M,
    )
    m = pat.search(text)
    if not m:
        return {
            "error": f"No ### Chapter {park_chapter_num} section in PYQ report",
            "lq": [],
            "sn": [],
            "mcq": [],
        }
    start = m.start()
    title = m.group(1).strip()
    next_m = re.search(r"^### Chapter\s+\d+:", text[m.end() :], re.M)
    end = m.end() + next_m.start() if next_m else len(text)
    section = text[start:end]

    def parse_list(header: str) -> list[str]:
        hm = re.search(
            rf"^####\s+{re.escape(header)}\s*$",
            section,
            re.M | re.I,
        )
        if not hm:
            # alternate headers
            alt = {
                "Long Answer Questions (LQ)": [
                    r"Long Answer Questions\s*\(LQ\)",
                    r"Long Answer Questions\s*\(LAQ\)",
                    r"Long Answer Questions",
                ],
                "Short Notes (SN)": [r"Short Notes\s*\(SN\)", r"Short Notes"],
                "Multiple Choice Questions (MCQ)": [
                    r"Multiple Choice Questions\s*\(MCQ\)",
                    r"Multiple Choice Questions",
                ],
            }.get(header, [re.escape(header)])
            hm = None
            for a in alt:
                hm = re.search(rf"^####\s+{a}\s*$", section, re.M | re.I)
                if hm:
                    break
        if not hm:
            return []
        rest = section[hm.end() :]
        # cut at next ####
        cut = re.search(r"^####\s+", rest, re.M)
        body = rest[: cut.start()] if cut else rest
        items = []
        for line in body.splitlines():
            line = line.strip()
            mitem = re.match(r"^(\d+)\.\s+(.+)$", line)
            if mitem:
                items.append(mitem.group(2).strip())
        return items

    lq = parse_list("Long Answer Questions (LQ)")
    sn = parse_list("Short Notes (SN)")
    mcq = parse_list("Multiple Choice Questions (MCQ)")
    return {
        "parkChapter": park_chapter_num,
        "sectionTitle": title,
        "lq": lq,
        "sn": sn,
        "mcq": mcq,
        "counts": {"lq": len(lq), "sn": len(sn), "mcq": len(mcq)},
    }


def write_leaf_files(out_dir: Path, leaves: list[dict[str, Any]]) -> list[str]:
    content_dir = out_dir / "content"
    content_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    for leaf in leaves:
        safe = re.sub(r"[^\w\-]+", "_", leaf["id"])
        p = content_dir / f"{safe}.txt"
        header = (
            f"ID: {leaf['id']}\nTITLE: {leaf['title']}\nPATH: {leaf['path']}\n"
            f"OVERRIDE: {bool(leaf.get('override'))}\n"
            f"{'=' * 60}\n\n"
        )
        p.write_text(header + leaf["content"], encoding="utf-8")
        paths.append(str(p))
    return paths


def main() -> None:
    parser = argparse.ArgumentParser(description="Load Library chapter review bundle")
    parser.add_argument("chapter", help="Chapter number, id, or title fragment")
    parser.add_argument(
        "--out",
        default=str(DEFAULT_OUT),
        help="Output directory (default: dist/library_chapter_reviews)",
    )
    parser.add_argument(
        "--no-firebase",
        action="store_true",
        help="Skip Firebase overrides (mockData only)",
    )
    parser.add_argument(
        "--no-pdf-text",
        action="store_true",
        help="Do not extract Park PDF text (path only)",
    )
    parser.add_argument(
        "--max-pdf-chars",
        type=int,
        default=200_000,
        help="Max chars of Park PDF text to extract",
    )
    args = parser.parse_args()

    mock = load_mock_data()
    chapter = resolve_chapter(mock, args.chapter)
    chapter_id = str(chapter.get("id"))
    try:
        chapter_num = int(re.match(r"^(\d+)", chapter_id).group(1))  # type: ignore[union-attr]
    except Exception:
        chapter_num = 0

    park_num = APP_TO_PARK.get(chapter_num, chapter_num)
    overrides = fetch_active_overrides(use_firebase=not args.no_firebase)
    effective = apply_overrides_to_tree(chapter, overrides)
    leaves = collect_leaf_contents(effective)
    overridden = [L for L in leaves if L.get("override")]

    park = match_park_pdf(park_num, chapter.get("title") or "")
    park_text_meta: dict[str, Any] = {}
    if park.get("path") and not args.no_pdf_text:
        park_text_meta = extract_pdf_text(park["path"], max_chars=args.max_pdf_chars)
    pyqs = parse_pyqs_for_chapter(park_num)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_dir = Path(args.out) / f"ch{chapter_id}_{stamp}"
    out_dir.mkdir(parents=True, exist_ok=True)

    leaf_paths = write_leaf_files(out_dir, leaves)

    if park_text_meta.get("text"):
        (out_dir / "park_reference.txt").write_text(park_text_meta["text"], encoding="utf-8")

    (out_dir / "pyqs.json").write_text(
        json.dumps(pyqs, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "query": args.chapter,
        "chapter": {
            "id": chapter_id,
            "title": chapter.get("title"),
            "appChapterNumber": chapter_num,
            "parkChapterNumber": park_num,
            "leafCount": len(leaves),
            "overriddenLeafCount": len(overridden),
        },
        "firebase": {
            "used": not args.no_firebase,
            "activeOverrideCountTotal": len(overrides),
            "overridesAppliedToThisChapter": [
                {
                    "id": L["id"],
                    "title": L["title"],
                    "approvedBy": (L.get("override") or {}).get("approvedBy"),
                    "contentLength": L["contentLength"],
                }
                for L in overridden
            ],
        },
        "park": {
            **{k: v for k, v in park.items() if k != "available"},
            "textExtracted": bool(park_text_meta.get("text")),
            "pdfPages": park_text_meta.get("pages"),
            "textTruncated": park_text_meta.get("truncated"),
            "pdfExtractError": park_text_meta.get("error"),
        },
        "pyqs": {
            "source": str(PYQ_REPORT_PATH),
            "counts": pyqs.get("counts"),
            "error": pyqs.get("error"),
            "sectionTitle": pyqs.get("sectionTitle"),
        },
        "paths": {
            "bundleDir": str(out_dir),
            "manifest": str(out_dir / "manifest.json"),
            "leaves": leaf_paths,
            "parkReferenceText": str(out_dir / "park_reference.txt")
            if park_text_meta.get("text")
            else None,
            "pyqs": str(out_dir / "pyqs.json"),
            "mockData": str(MOCK_DATA_PATH),
            "parkSplitDir": str(PARK_SPLIT_DIR),
        },
        "tagFormat": {
            "sn": "[SN]Topic title for short note[/SN]",
            "laq": "[LAQ]Topic title for long answer[/LAQ]",
            "colors": {
                "SN": {"border": "#0F766E", "background": "#CCFBF1", "label": "#115E59"},
                "LAQ": {"border": "#B45309", "background": "#FEF3C7", "label": "#92400E"},
            },
        },
    }

    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # Human-readable index
    lines = [
        f"# Chapter review bundle — {chapter.get('title')} (id={chapter_id})",
        "",
        f"- Generated: {manifest['generatedAt']}",
        f"- Park chapter: {park_num}",
        f"- Leaves: {len(leaves)} (Firebase overrides applied: {len(overridden)})",
        f"- Park PDF: {park.get('fileName') or park.get('error')}",
        f"- PYQs: LQ={pyqs.get('counts', {}).get('lq', 0)} SN={pyqs.get('counts', {}).get('sn', 0)} MCQ={pyqs.get('counts', {}).get('mcq', 0)}",
        "",
        "## Leaves",
    ]
    for L in leaves:
        flag = " [OVERRIDE]" if L.get("override") else ""
        lines.append(f"- `{L['id']}` {L['title']}{flag} ({L['contentLength']} chars)")
    lines.extend(
        [
            "",
            "## Next steps for the agent",
            "1. Read each leaf under `content/`.",
            "2. Read `park_reference.txt` (or open the PDF path in manifest).",
            "3. Read `pyqs.json` and map coverage for SN/LAQ.",
            "4. Follow `.grok/skills/library-chapter-review/SKILL.md` review workflow.",
            "5. Write report to `review_report.md` in this bundle dir when done.",
        ]
    )
    (out_dir / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({"ok": True, "bundleDir": str(out_dir), "manifest": manifest}, indent=2, default=str))


if __name__ == "__main__":
    main()
