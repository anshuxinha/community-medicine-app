#!/usr/bin/env python3
"""Bulk-scan Library chapters for large gaps vs Park textbook.

Report-only: never edits mockData or Firebase.

Usage (prefer Windows Python 3.13):
  py -3 scripts/scan_park_library_gaps.py
  py -3 scripts/scan_park_library_gaps.py --chapters 6,16,22,23
  py -3 scripts/scan_park_library_gaps.py --no-firebase
  py -3 scripts/scan_park_library_gaps.py --min-gap-score 40
  py -3 scripts/scan_park_library_gaps.py --refresh-park-cache

Deps: pymupdf (fitz) or pdfplumber (py -3 -m pip install pymupdf)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parents[1]
MOCK_DATA_PATH = ROOT / "src" / "data" / "mockData.json"
SERVICE_ACCOUNT_PATH = ROOT / "serviceAccountKey.json"
PARK_SPLIT_DIR = Path(r"D:\Study Related\Books\Park Split")
DEFAULT_OUT = ROOT / "dist" / "park_gap_scans"
SEED_PATH = ROOT / "scripts" / "data" / "park_chapter_topic_seeds.json"
ALIAS_PATH = ROOT / "scripts" / "data" / "park_topic_aliases.json"
PROJECT_ID = "community-med-app"

# App chapter id -> Park chapter number (same as library-chapter-review)
APP_TO_PARK = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    11: 11,
    12: 12,
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
    26: 21,  # Biostatistics overlaps Park 21
    27: 23,  # PH management overlaps Park 23
    # 29 Public Health Legislation is compiled from Park 12, 18, 8, 11, 15, 16, 20, 24, 25.
    # No single Park PDF; omit from APP_TO_PARK so the gap scan skips it.
}

# Domain keyword sets for asymmetric half-chapter detection (Park ch -> domains)
DOMAIN_SETS: dict[int, dict[str, list[str]]] = {
    21: {
        "health_information": [
            "health information system",
            "sources of health information",
            "census",
            "sample registration system",
            "record linkage",
            "vital registration",
            "registration of vital events",
            "notification of diseases",
        ],
        "biostatistics": [
            "measures of central tendency",
            "normal distribution",
            "sampling methods",
            "standard error",
            "tests of significance",
            "chi square",
            "chi-square",
            "mean",
            "median",
        ],
    },
    3: {
        "descriptive_analytic": [
            "descriptive epidemiology",
            "case control",
            "cohort study",
            "incidence",
            "prevalence",
        ],
        "experimental_misc": [
            "randomized controlled trial",
            "bias",
            "confounding",
            "surveillance",
            "epidemic investigation",
        ],
    },
    15: {
        "water_waste": [
            "water purification",
            "water quality",
            "solid waste",
            "excreta disposal",
            "sewage",
        ],
        "other_environment": [
            "air pollution",
            "housing",
            "mosquito control",
            "noise pollution",
            "climate change",
        ],
    },
}

# Optional topic filters for dual-mapped app chapters (score only relevant Park slice)
TOPIC_FILTERS: dict[int, list[str]] = {
    # App 26: biostat half of Park 21
    26: [
        "presentation of data",
        "measures of central tendency",
        "measures of dispersion",
        "normal distribution",
        "sampling methods",
        "standard error",
        "tests of significance",
        "chi square test",
        "correlation and regression",
        "health surveys",
    ],
    # App 27: planning/management; still use full Park 23 seeds
}


def normalize(s: str) -> str:
    s = (s or "").lower()
    s = s.replace("χ", "chi").replace("×", "x")
    s = re.sub(r"[^a-z0-9\s&+]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def load_mock_data() -> list[dict[str, Any]]:
    with MOCK_DATA_PATH.open(encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise SystemExit("mockData.json root must be a list of chapters")
    return data


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


def apply_overrides(node: dict[str, Any], overrides: dict[str, dict[str, Any]]) -> dict[str, Any]:
    out = dict(node)
    lid = str(out.get("id"))
    ov = overrides.get(lid)
    if ov and isinstance(ov.get("proposedContent"), str):
        out["content"] = ov["proposedContent"]
        out["_override"] = True
    subs = out.get("subsections")
    if isinstance(subs, list) and subs:
        out["subsections"] = [apply_overrides(s, overrides) for s in subs]
    return out


def flatten_library_chapter(node: dict[str, Any]) -> dict[str, Any]:
    """Return combined text, char count, leaf count, headings for one top-level chapter."""
    blobs: list[str] = []
    headings: list[str] = []
    leaf_count = 0
    override_count = 0

    def walk(n: dict[str, Any], path: list[str]) -> None:
        nonlocal leaf_count, override_count
        title = n.get("title") or ""
        cur = path + [title]
        if n.get("_override"):
            override_count += 1
        subs = n.get("subsections") or []
        content = n.get("content")
        if isinstance(subs, list) and subs:
            for s in subs:
                if isinstance(s, dict):
                    walk(s, cur)
            # parent may also hold content
            if isinstance(content, str) and content.strip():
                blobs.append(content)
                headings.append(title)
        elif isinstance(content, str):
            leaf_count += 1
            blobs.append(content)
            headings.append(title)
            # ALL-CAPS section lines as pseudo-headings
            for line in content.splitlines():
                t = line.strip()
                if 4 <= len(t) <= 80 and t.isupper() and re.search(r"[A-Z]", t):
                    headings.append(t)

    walk(node, [])
    text = "\n".join(blobs)
    return {
        "libraryChars": len(text),
        "leafCount": leaf_count or (1 if text else 0),
        "overrideLeafCount": override_count,
        "headings": headings,
        "blob": text,
        "blobNorm": normalize(text),
    }


def match_park_pdf(park_chapter_num: int) -> dict[str, Any]:
    if not PARK_SPLIT_DIR.exists():
        return {"path": None, "error": f"Missing dir: {PARK_SPLIT_DIR}"}
    files = list(PARK_SPLIT_DIR.glob("*.pdf"))
    patterns = [
        re.compile(rf"^Chapter\s*{park_chapter_num}[_\s]", re.I),
        re.compile(rf"^{park_chapter_num}[\.\s]"),
        re.compile(rf"^0?{park_chapter_num}[\.\s_-]"),
    ]
    for f in files:
        for pat in patterns:
            if pat.search(f.name):
                return {"path": str(f), "fileName": f.name, "parkChapter": park_chapter_num}
    return {
        "path": None,
        "error": f"No Park PDF for chapter {park_chapter_num}",
        "available": [f.name for f in files],
    }


def extract_pdf_text(pdf_path: str, max_chars: int = 400_000) -> dict[str, Any]:
    path = Path(pdf_path)
    if not path.exists():
        return {"text": "", "pages": 0, "error": "file missing"}
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(str(path))
        pages = len(doc)
        parts: list[str] = []
        for page in doc:
            parts.append(page.get_text() or "")
            if sum(len(p) for p in parts) >= max_chars:
                break
        doc.close()
        text = "\n".join(parts)
        return {
            "text": text[:max_chars],
            "pages": pages,
            "truncated": len(text) > max_chars,
            "engine": "pymupdf",
        }
    except ImportError:
        pass

    try:
        import pdfplumber

        parts: list[str] = []
        pages = 0
        with pdfplumber.open(str(path)) as pdf:
            pages = len(pdf.pages)
            for page in pdf.pages:
                parts.append(page.extract_text() or "")
                if sum(len(p) for p in parts) >= max_chars:
                    break
        text = "\n".join(parts)
        return {
            "text": text[:max_chars],
            "pages": pages,
            "truncated": len(text) > max_chars,
            "engine": "pdfplumber",
        }
    except ImportError:
        return {"text": "", "pages": 0, "error": "install pymupdf (fitz) or pdfplumber"}


def extract_heading_candidates(text: str, max_topics: int = 40) -> list[str]:
    """Heuristic section heads from noisy Park OCR text."""
    if not text or len(text) < 200:
        return []
    candidates: list[tuple[int, str]] = []
    seen: set[str] = set()
    stop_line = re.compile(
        r"^(table|fig\.|figure|source:|chapter|\d+$|page\s+\d+)",
        re.I,
    )
    for raw in text.splitlines():
        line = re.sub(r"\s+", " ", raw).strip()
        if not line or len(line) < 6 or len(line) > 70:
            continue
        if stop_line.search(line):
            continue
        if re.fullmatch(r"[\d\s\.\,\;\:\-]+", line):
            continue
        letters = sum(c.isalpha() for c in line)
        if letters < 5:
            continue
        # Prefer ALL-CAPS-ish or short title-like lines
        upper_ratio = sum(c.isupper() for c in line if c.isalpha()) / max(letters, 1)
        words = line.split()
        title_case = sum(1 for w in words if w[:1].isupper()) / max(len(words), 1)
        score = 0
        if upper_ratio >= 0.7:
            score += 3
        if title_case >= 0.6 and len(words) <= 8:
            score += 2
        if 2 <= len(words) <= 8:
            score += 1
        if score < 3:
            continue
        norm = normalize(line)
        if len(norm) < 6 or norm in seen:
            continue
        # drop very generic fragments
        if norm in {"and", "the", "of health", "medical statistics"}:
            continue
        seen.add(norm)
        candidates.append((score, norm))

    candidates.sort(key=lambda x: (-x[0], x[1]))
    out: list[str] = []
    for _, label in candidates:
        # avoid near-duplicates
        if any(label in o or o in label for o in out):
            continue
        out.append(label)
        if len(out) >= max_topics:
            break
    return out


def cache_key_for_pdf(path: Path) -> str:
    st = path.stat()
    raw = f"{path.resolve()}|{st.st_mtime_ns}|{st.st_size}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def load_or_build_park_cache(
    park_chapter: int,
    pdf_info: dict[str, Any],
    cache_dir: Path,
    refresh: bool,
    max_chars: int,
) -> dict[str, Any]:
    pdf_path = pdf_info.get("path")
    if not pdf_path:
        return {
            "parkChapter": park_chapter,
            "error": pdf_info.get("error"),
            "charCount": 0,
            "pages": 0,
            "extractQuality": "none",
            "heuristicTopics": [],
            "textNorm": "",
        }

    path = Path(pdf_path)
    key = cache_key_for_pdf(path)
    cache_file = cache_dir / f"park_ch{park_chapter}_{key}.json"
    # also a stable latest pointer name
    stable = cache_dir / f"park_ch{park_chapter}_latest.json"

    if not refresh and stable.exists():
        try:
            cached = json.loads(stable.read_text(encoding="utf-8"))
            if cached.get("cacheKey") == key and cached.get("charCount", 0) > 0:
                return cached
        except Exception:
            pass

    extracted = extract_pdf_text(str(path), max_chars=max_chars)
    text = extracted.get("text") or ""
    err = extracted.get("error")
    char_count = len(text)
    # quality: OCR often has weird spacing; still usable if long enough
    if err:
        quality = "none"
    elif char_count < 3000:
        quality = "low"
    elif char_count < 20000:
        quality = "medium"
    else:
        quality = "high"

    heuristics = extract_heading_candidates(text)
    payload = {
        "parkChapter": park_chapter,
        "fileName": path.name,
        "path": str(path),
        "cacheKey": key,
        "pages": extracted.get("pages") or 0,
        "charCount": char_count,
        "truncated": bool(extracted.get("truncated")),
        "engine": extracted.get("engine"),
        "error": err,
        "extractQuality": quality,
        "heuristicTopics": heuristics,
        "textNorm": normalize(text),
    }
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_file.write_text(json.dumps({**payload, "textNorm": ""}, ensure_ascii=False, indent=2), encoding="utf-8")
    # store full with textNorm in latest (needed for optional future); keep textNorm for matching
    stable.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return payload


def build_topic_list(
    park_chapter: int,
    park_cache: dict[str, Any],
    seeds: dict[str, list[str]],
    aliases: dict[str, dict[str, list[str]]],
    app_id: int,
) -> list[dict[str, Any]]:
    topics: list[dict[str, Any]] = []
    seen: set[str] = set()

    seed_list = seeds.get(str(park_chapter), [])
    # Dual-map filter for app 26
    filt = TOPIC_FILTERS.get(app_id)
    if filt:
        filt_norm = [normalize(x) for x in filt]
        seed_list = [s for s in seed_list if normalize(s) in filt_norm or any(normalize(s) in f or f in normalize(s) for f in filt_norm)]

    ch_aliases = aliases.get(str(park_chapter), {})

    for i, label in enumerate(seed_list):
        n = normalize(label)
        if not n or n in seen:
            continue
        seen.add(n)
        al = [normalize(a) for a in ch_aliases.get(label, [])]
        topics.append(
            {
                "id": f"seed_{i+1:02d}",
                "label": label,
                "source": "seed",
                "aliases": al,
            }
        )

    # Add cleaner heuristic heads only (OCR is noisy; cap contribution)
    heur_added = 0
    for j, h in enumerate(park_cache.get("heuristicTopics") or []):
        n = normalize(h)
        if not n or n in seen:
            continue
        if len(n) < 12 or len(n.split()) < 2:
            continue
        # drop OCR garbage (no spaces / digit-heavy)
        if " " not in n or sum(c.isdigit() for c in n) > 3:
            continue
        if any(n in normalize(t["label"]) or normalize(t["label"]) in n for t in topics):
            continue
        seen.add(n)
        topics.append(
            {
                "id": f"heur_{j+1:02d}",
                "label": h,
                "source": "heuristic",
                "aliases": [],
            }
        )
        heur_added += 1
        if heur_added >= 12 or len(topics) >= 40:
            break

    return topics


def match_topic_in_library(topic: dict[str, Any], blob_norm: str) -> str:
    """Return covered | partial | missing."""
    labels = [normalize(topic["label"])] + [normalize(a) for a in topic.get("aliases") or []]
    labels = [x for x in labels if x]

    best = "missing"
    for lab in labels:
        if not lab:
            continue
        tokens = [t for t in lab.split() if len(t) > 2]
        # Strong: full phrase
        if len(lab) >= 8 and lab in blob_norm:
            return "covered"
        # Multi-token: all important tokens present near each other is hard; require all tokens present
        if len(tokens) >= 2:
            hits = sum(1 for t in tokens if re.search(rf"\b{re.escape(t)}\b", blob_norm))
            ratio = hits / len(tokens)
            if ratio >= 0.8:
                return "covered"
            if ratio >= 0.5:
                best = "partial" if best == "missing" else best
        elif len(tokens) == 1:
            t = tokens[0]
            if len(t) >= 6 and re.search(rf"\b{re.escape(t)}\b", blob_norm):
                # single long token: partial unless also in seeds as distinctive
                if best == "missing":
                    best = "partial"
            elif len(t) >= 4 and re.search(rf"\b{re.escape(t)}\b", blob_norm):
                if best == "missing":
                    best = "partial"
    return best


def thinness_penalty(library_chars: int, park_chars: int, extract_quality: str) -> float:
    # Image-only / failed PDF extract must not invent a tiny Park size (false "small gap").
    if extract_quality in ("none", "low") or park_chars < 2000:
        # Absolute thinness of Library only (rough UG sketch detector)
        if library_chars < 3000:
            return 90.0
        if library_chars < 8000:
            return 50.0
        if library_chars < 15000:
            return 25.0
        return 0.0
    ratio = library_chars / max(park_chars, 1)
    if ratio < 0.02:
        return 100.0
    if ratio < 0.05:
        return 70.0
    if ratio < 0.10:
        return 40.0
    if ratio < 0.20:
        return 15.0
    return 0.0


def severity_band(score: float) -> str:
    # Tuned so ~2k-char sketches (Ch22/23) land large when seeds also miss.
    if score >= 55:
        return "critical"
    if score >= 30:
        return "large"
    if score >= 18:
        return "moderate"
    return "small"


def domain_coverage(blob_norm: str, keywords: list[str]) -> float:
    if not keywords:
        return 0.0
    hits = 0
    for kw in keywords:
        n = normalize(kw)
        tokens = [t for t in n.split() if len(t) > 2]
        if len(tokens) >= 2:
            if sum(1 for t in tokens if re.search(rf"\b{re.escape(t)}\b", blob_norm)) >= max(2, int(0.7 * len(tokens))):
                hits += 1
        elif tokens and re.search(rf"\b{re.escape(tokens[0])}\b", blob_norm):
            hits += 1
    return hits / len(keywords)


def detect_asymmetric(park_chapter: int, blob_norm: str) -> dict[str, Any] | None:
    domains = DOMAIN_SETS.get(park_chapter)
    if not domains or len(domains) < 2:
        return None
    scores = {name: domain_coverage(blob_norm, kws) for name, kws in domains.items()}
    items = sorted(scores.items(), key=lambda x: x[1])
    low_name, low = items[0]
    high_name, high = items[-1]
    if high >= 0.70 and low <= 0.20:
        return {
            "asymmetric": True,
            "strongDomain": high_name,
            "weakDomain": low_name,
            "domainScores": scores,
        }
    return {
        "asymmetric": False,
        "domainScores": scores,
    }


def score_chapter(
    app_id: int,
    title: str,
    lib: dict[str, Any],
    park_cache: dict[str, Any],
    topics: list[dict[str, Any]],
) -> dict[str, Any]:
    blob_norm = lib.get("blobNorm") or ""
    results = []
    missing = partial = covered = 0
    for t in topics:
        status = match_topic_in_library(t, blob_norm)
        if status == "covered":
            covered += 1
        elif status == "partial":
            partial += 1
        else:
            missing += 1
        results.append({**t, "status": status})

    total = max(len(topics), 1)
    park_chars = int(park_cache.get("charCount") or 0)
    lib_chars = int(lib.get("libraryChars") or 0)
    quality = park_cache.get("extractQuality") or "none"
    thin = thinness_penalty(lib_chars, park_chars, quality)

    # Prefer seed topics for miss rate when heuristics are noisy
    seed_topics = [r for r in results if r.get("source") == "seed"]
    if seed_topics:
        s_miss = sum(1 for r in seed_topics if r["status"] == "missing")
        s_part = sum(1 for r in seed_topics if r["status"] == "partial")
        s_tot = len(seed_topics)
        miss_rate = s_miss / s_tot
        part_rate = s_part / s_tot
    else:
        miss_rate = missing / total
        part_rate = partial / total

    # If no topics extracted at all, rely on thinness
    if not topics:
        gap = thin
    else:
        gap = 0.45 * miss_rate * 100 + 0.20 * part_rate * 100 + 0.35 * thin

    # Absolute boost: ultra-thin Library leaves are always high-priority gaps
    if lib_chars < 4000:
        gap = min(100.0, gap + 15.0)
    elif lib_chars < 10000:
        gap = min(100.0, gap + 8.0)

    if quality in ("none", "low") or park_chars < 2000:
        note = "park_extract_weak_use_seeds_and_lib_size"
    else:
        note = None

    asym = detect_asymmetric(APP_TO_PARK.get(app_id, app_id), blob_norm)

    # Boost gap slightly for asymmetric half-chapter (classic large gap pattern)
    if asym and asym.get("asymmetric"):
        gap = min(100.0, gap + 10.0)

    return {
        "appId": str(app_id),
        "title": title,
        "parkChapter": APP_TO_PARK.get(app_id),
        "parkFile": park_cache.get("fileName"),
        "parkPath": park_cache.get("path"),
        "libraryChars": lib_chars,
        "parkChars": park_chars,
        "charRatio": round(lib_chars / max(park_chars, 1), 4),
        "leafCount": lib.get("leafCount"),
        "overrideLeafCount": lib.get("overrideLeafCount"),
        "extractQuality": quality,
        "topicCounts": {
            "missing": missing,
            "partial": partial,
            "covered": covered,
            "total": len(topics),
        },
        "thinnessPenalty": thin,
        "gapScore": round(gap, 1),
        "band": severity_band(gap),
        "asymmetric": bool(asym and asym.get("asymmetric")),
        "asymmetricDetail": asym,
        "note": note,
        "missingTopics": [r["label"] for r in results if r["status"] == "missing"],
        "partialTopics": [r["label"] for r in results if r["status"] == "partial"],
        "topics": results,
    }


def write_reports(out_dir: Path, results: list[dict[str, Any]], meta: dict[str, Any]) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    ranked = sorted(results, key=lambda r: (-r["gapScore"], r["appId"]))
    payload = {"meta": meta, "chapters": ranked}
    json_path = out_dir / "scan.json"
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    lines: list[str] = []
    lines.append("# Park vs Library gap scan")
    lines.append("")
    lines.append(f"- Generated: {meta.get('generatedAt')}")
    lines.append(f"- Firebase overrides: {meta.get('firebase')}")
    lines.append(f"- Park dir: `{meta.get('parkDir')}`")
    lines.append(f"- Chapters scanned: {len(ranked)}")
    lines.append("")
    lines.append("## Top gaps (act first)")
    lines.append("")
    top = [r for r in ranked if r["band"] in ("critical", "large")][:8]
    if not top:
        lines.append("_No critical/large gaps at current thresholds._")
    else:
        for i, r in enumerate(top, 1):
            flag = " yes" if r.get("asymmetric") else ""
            title = r.get("title") or ""
            score = r["gapScore"]
            band = r["band"]
            miss = r["topicCounts"]["missing"]
            tot = r["topicCounts"]["total"]
            lc = r["libraryChars"]
            pc = r["parkChars"]
            app = r["appId"]
            lines.append(
                "%s. **Ch %s** %s - gap **%s** (%s) missing %s/%s topics; "
                "lib %s / park %s chars%s"
                % (i, app, title, score, band, miss, tot, lc, pc, flag)
            )
    lines.append("")
    lines.append("## Ranked table")
    lines.append("")
    lines.append(
        "| App | Title | Park | Lib chars | Park chars | Miss/Part/Tot | Score | Band | Asym |"
    )
    lines.append("|-----|-------|------|-----------|------------|---------------|-------|------|------|")
    for r in ranked:
        title = (r["title"] or "")[:40].replace("|", "/")
        lines.append(
            f"| {r['appId']} | {title} | {r.get('parkChapter')} | {r['libraryChars']} | "
            f"{r['parkChars']} | {r['topicCounts']['missing']}/{r['topicCounts']['partial']}/"
            f"{r['topicCounts']['total']} | {r['gapScore']} | {r['band']} | "
            f"{'Y' if r.get('asymmetric') else ''} |"
        )
    lines.append("")
    lines.append("## Critical / large detail")
    lines.append("")
    for r in ranked:
        if r["band"] not in ("critical", "large"):
            continue
        lines.append(f"### Ch {r['appId']}: {r['title']} (score {r['gapScore']})")
        lines.append(f"- Park file: `{r.get('parkFile')}`")
        lines.append(f"- Extract quality: {r.get('extractQuality')}")
        if r.get("asymmetric") and r.get("asymmetricDetail"):
            d = r["asymmetricDetail"]
            lines.append(
                f"- **Asymmetric half-chapter:** strong `{d.get('strongDomain')}`, "
                f"weak `{d.get('weakDomain')}` scores={d.get('domainScores')}"
            )
        miss = r.get("missingTopics") or []
        if miss:
            lines.append("- Missing topics (up to 15):")
            for t in miss[:15]:
                lines.append(f"  - {t}")
        part = r.get("partialTopics") or []
        if part:
            lines.append("- Partial topics (up to 10):")
            for t in part[:10]:
                lines.append(f"  - {t}")
        lines.append("- Next:")
        lines.append("```")
        lines.append(
            f'py -3 .grok/skills/library-chapter-review/scripts/load_chapter_bundle.py "{r["appId"]}"'
        )
        lines.append(f"# then /library-chapter-review {r['appId']}")
        lines.append("```")
        lines.append("")

    lines.append("## How to read this")
    lines.append("")
    lines.append("- **gapScore** higher = worse (0–100).")
    lines.append("- **critical** ≥60, **large** 40–59, **moderate** 25–39, **small** <25.")
    lines.append("- Combines topic miss rate + library thinness vs Park text size.")
    lines.append("- Seeds = curated high-yield Park topics; heuristics = OCR headings.")
    lines.append("- This is **not** a full accuracy/PYQ review.")
    lines.append("")

    md_path = out_dir / "scan.md"
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    # latest copies
    latest_dir = DEFAULT_OUT
    latest_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(json_path, latest_dir / "latest.json")
    shutil.copy2(md_path, latest_dir / "latest.md")


def parse_chapters_arg(raw: str | None) -> set[int] | None:
    if not raw:
        return None
    out: set[int] = set()
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        out.add(int(part))
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Scan Library chapters for large Park gaps")
    parser.add_argument("--chapters", help="Comma-separated app chapter ids (default: all 1-27)")
    parser.add_argument("--no-firebase", action="store_true")
    parser.add_argument("--min-gap-score", type=float, default=0.0, help="Only include chapters >= score in detail")
    parser.add_argument("--refresh-park-cache", action="store_true")
    parser.add_argument("--max-pdf-chars", type=int, default=400_000)
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    args = parser.parse_args()

    only = parse_chapters_arg(args.chapters)
    mock = load_mock_data()
    overrides = fetch_active_overrides(use_firebase=not args.no_firebase)
    seeds = load_json(SEED_PATH, {})
    aliases = load_json(ALIAS_PATH, {})

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_root = Path(args.out)
    run_dir = out_root / stamp
    cache_dir = out_root / "cache"

    # Park cache by park chapter number
    park_cache_by_num: dict[int, dict[str, Any]] = {}
    results: list[dict[str, Any]] = []

    top_chapters = [c for c in mock if isinstance(c, dict) and str(c.get("id", "")).isdigit()]
    top_chapters.sort(key=lambda c: int(c["id"]))

    for ch in top_chapters:
        app_id = int(ch["id"])
        if only is not None and app_id not in only:
            continue
        if app_id not in APP_TO_PARK:
            continue

        park_num = APP_TO_PARK[app_id]
        if park_num not in park_cache_by_num:
            pdf_info = match_park_pdf(park_num)
            park_cache_by_num[park_num] = load_or_build_park_cache(
                park_num,
                pdf_info,
                cache_dir,
                refresh=args.refresh_park_cache,
                max_chars=args.max_pdf_chars,
            )
            pq = park_cache_by_num[park_num]
            print(
                f"Park {park_num}: chars={pq.get('charCount')} quality={pq.get('extractQuality')} "
                f"file={pq.get('fileName') or pq.get('error')}",
                file=sys.stderr,
            )

        park_cache = park_cache_by_num[park_num]
        tree = apply_overrides(ch, overrides)
        lib = flatten_library_chapter(tree)
        topics = build_topic_list(park_num, park_cache, seeds, aliases, app_id)
        scored = score_chapter(app_id, ch.get("title") or "", lib, park_cache, topics)
        if scored["gapScore"] >= args.min_gap_score or args.min_gap_score <= 0:
            results.append(scored)
        print(
            f"App {app_id}: score={scored['gapScore']} band={scored['band']} "
            f"miss={scored['topicCounts']['missing']}/{scored['topicCounts']['total']} "
            f"lib={scored['libraryChars']}",
            file=sys.stderr,
        )

    meta = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "firebase": "skipped" if args.no_firebase else f"overrides={len(overrides)}",
        "parkDir": str(PARK_SPLIT_DIR),
        "seedPath": str(SEED_PATH),
        "runDir": str(run_dir),
    }
    write_reports(run_dir, results, meta)

    ranked = sorted(results, key=lambda r: (-r["gapScore"], r["appId"]))
    summary = {
        "ok": True,
        "runDir": str(run_dir),
        "latestMd": str(DEFAULT_OUT / "latest.md"),
        "latestJson": str(DEFAULT_OUT / "latest.json"),
        "scanned": len(results),
        "critical": sum(1 for r in results if r["band"] == "critical"),
        "large": sum(1 for r in results if r["band"] == "large"),
        "top5": [
            {
                "appId": r["appId"],
                "title": r["title"],
                "gapScore": r["gapScore"],
                "band": r["band"],
                "missing": r["topicCounts"]["missing"],
                "total": r["topicCounts"]["total"],
            }
            for r in ranked[:5]
        ],
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
