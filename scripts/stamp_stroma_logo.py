# -*- coding: utf-8 -*-
"""Force 1:1 canvas and stamp a fixed-size STROMA logo at the top-right."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "reading-illustrations" / "raw"
OUT_DIR = ROOT / "reading-illustrations"
LOGO_PATH = Path(r"D:\Stroma Files\Logos and Banners\stroma_logo small.png")
DEFAULT_JOBS_PATH = ROOT / "scripts" / "clinical_diagram_jobs.json"
CANVAS = 1400
LOGO_SIZE = 96
MARGIN = 28


def to_square(im: Image.Image, size: int = CANVAS) -> Image.Image:
    im = im.convert("RGB")
    w, h = im.size
    side = max(w, h)
    canvas = Image.new("RGB", (side, side), (255, 255, 255))
    canvas.paste(im, ((side - w) // 2, (side - h) // 2))
    if side != size:
        canvas = canvas.resize((size, size), Image.Resampling.LANCZOS)
    return canvas


def stamp(src: Path, dest: Path, logo: Image.Image) -> None:
    im = Image.open(src)
    sq = to_square(im)
    x = sq.width - LOGO_SIZE - MARGIN
    y = MARGIN
    sq.paste(logo, (x, y), logo if logo.mode == "RGBA" else None)
    dest.parent.mkdir(parents=True, exist_ok=True)
    sq.save(dest, "PNG", optimize=True)
    print(f"[+] {dest.name} {sq.size}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", action="append", dest="ids")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--jobs", default=str(DEFAULT_JOBS_PATH))
    args = parser.parse_args()
    jobs = json.loads(Path(args.jobs).read_text(encoding="utf-8"))
    if args.ids:
        wanted = set(args.ids)
        jobs = [j for j in jobs if j["id"] in wanted]
    logo = Image.open(LOGO_PATH).convert("RGBA")
    logo = logo.resize((LOGO_SIZE, LOGO_SIZE), Image.Resampling.LANCZOS)
    for job in jobs:
        src = RAW_DIR / job["fileName"]
        dest = OUT_DIR / job["fileName"]
        if not src.exists():
            print(f"[!] missing raw {src}")
            continue
        stamp(src, dest, logo)


if __name__ == "__main__":
    main()
