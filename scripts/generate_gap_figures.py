# -*- coding: utf-8 -*-
"""Square Library figures for Golden Notes gap leaves. Writes reading-illustrations/."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reading-illustrations"
W = H = 1400
PRIMARY = "#9333ea"
SOFT = "#F3E8FF"
INK = "#1F2937"
MUTED = "#6B7280"
WHITE = "#FFFFFF"
GRID = "#E5E7EB"

try:
    FONT = ImageFont.truetype("arial.ttf", 36)
    FONT_SM = ImageFont.truetype("arial.ttf", 28)
    FONT_LG = ImageFont.truetype("arial.ttf", 48)
    FONT_BOLD = ImageFont.truetype("arialbd.ttf", 40)
except OSError:
    FONT = ImageFont.load_default()
    FONT_SM = FONT
    FONT_LG = FONT
    FONT_BOLD = FONT


def new_canvas(title: str):
    im = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 110), fill=SOFT)
    d.rectangle((0, 110, W, 118), fill=PRIMARY)
    d.text((64, 36), title, fill=PRIMARY, font=FONT_BOLD)
    return im, d


def box(d, x, y, w, h, text, fill=SOFT):
    d.rounded_rectangle((x, y, x + w, y + h), radius=18, fill=fill, outline=PRIMARY, width=3)
    # wrap
    words = text.split()
    lines, cur = [], ""
    for word in words:
        trial = (cur + " " + word).strip()
        if FONT_SM.getlength(trial) < w - 36:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    ty = y + (h - 34 * len(lines)) / 2
    for i, line in enumerate(lines[:5]):
        tw = FONT_SM.getlength(line)
        d.text((x + (w - tw) / 2, ty + i * 34), line, fill=INK, font=FONT_SM)


def save(im: Image.Image, name: str) -> None:
    OUT.mkdir(exist_ok=True)
    path = OUT / name
    im.save(path, "PNG")
    print("wrote", path)


def fig_abdm():
    im, d = new_canvas("ABDM building blocks")
    labels = [
        "ABHA number",
        "Healthcare Professionals Registry",
        "Health Facility Registry",
        "Personal Health Record / HIE",
        "Unified Health Interface",
    ]
    for i, lab in enumerate(labels):
        box(d, 120, 180 + i * 220, 1160, 180, f"{i + 1}. {lab}")
    save(im, "gn_32_1_abdm_blocks.png")


def fig_amr():
    im, d = new_canvas("NAP-AMR 2.0 objectives")
    labels = [
        "1 Awareness and training",
        "2 Labs and surveillance",
        "3 Infection prevention",
        "4 Stewardship and access",
        "5 Research and innovation",
        "6 Intersectoral governance",
    ]
    for i, lab in enumerate(labels):
        col = i % 2
        row = i // 2
        box(d, 80 + col * 640, 200 + row * 360, 580, 300, lab)
    save(im, "gn_32_6_nap_amr.png")


def fig_yf():
    im, d = new_canvas("Yellow fever IHR flow")
    box(d, 140, 160, 1120, 140, "Authorised centre + WHO-approved vaccine")
    box(d, 140, 340, 1120, 140, "Wait 10 days: certificate valid for life")
    box(d, 140, 520, 1120, 140, "Arrive in India from a yellow-fever risk country")
    box(d, 80, 780, 560, 280, "Original valid certificate: enter")
    box(d, 760, 780, 560, 280, "Missing or immature certificate: quarantine up to 6 days")
    d.polygon([(700, 300), (680, 320), (720, 320)], fill=PRIMARY)
    d.polygon([(700, 480), (680, 500), (720, 500)], fill=PRIMARY)
    d.line((700, 660, 360, 780), fill=PRIMARY, width=4)
    d.line((700, 660, 1040, 780), fill=PRIMARY, width=4)
    save(im, "gn_32_11_yf_ihr.png")


def fig_safe():
    im, d = new_canvas("SAFE strategy for trachoma")
    labels = [
        "S Surgery for trichiasis",
        "A Antibiotics (azithromycin where indicated)",
        "F Facial cleanliness",
        "E Environmental improvement (water, latrines)",
    ]
    for i, lab in enumerate(labels):
        box(d, 100, 200 + i * 270, 1200, 220, lab)
    save(im, "gn_5_11_safe.png")


def fig_climate():
    im, d = new_canvas("Climate change and health")
    labels = [
        "Heat and cold: stroke, cardiovascular events",
        "Extreme weather: floods, storms, drought, injury",
        "Water and food: cholera, leptospirosis, undernutrition",
        "Air: ozone, particles, asthma, heart disease",
        "Vectors: malaria, dengue, Japanese encephalitis",
    ]
    for i, lab in enumerate(labels):
        box(d, 100, 180 + i * 220, 1200, 180, lab)
    save(im, "gn_15_8_climate.png")


def fig_kaya():
    im, d = new_canvas("Kayakalp assessment criteria")
    labels = [
        "Hospital upkeep",
        "Sanitation and hygiene",
        "Waste management",
        "Infection control",
        "Support services",
        "Hygiene promotion",
        "Cleanliness beyond the wall",
        "Eco-friendly facility",
    ]
    for i, lab in enumerate(labels):
        col = i % 2
        row = i // 2
        box(d, 80 + col * 640, 180 + row * 280, 580, 240, f"{i + 1}. {lab}")
    save(im, "gn_7_24_kayakalp.png")


def fig_pedigree():
    im, d = new_canvas("Reading a pedigree")
    # legend
    d.rectangle((120, 200, 200, 280), outline=INK, width=4)
    d.text((220, 220), "Male", fill=INK, font=FONT)
    d.ellipse((520, 200, 600, 280), outline=INK, width=4)
    d.text((620, 220), "Female", fill=INK, font=FONT)
    d.rectangle((920, 200, 1000, 280), fill=PRIMARY, outline=INK, width=4)
    d.text((1020, 220), "Affected", fill=INK, font=FONT)
    notes = [
        "Autosomal dominant: vertical, both sexes, male-to-male occurs.",
        "Autosomal recessive: skips generations; consanguinity (double bar) helps.",
        "X-linked recessive: affected males, carrier females, no male-to-male.",
        "Arrow: proband. Numbers: generation (I, II) and birth order.",
    ]
    for i, n in enumerate(notes):
        box(d, 80, 360 + i * 240, 1240, 200, n, fill=WHITE)
    save(im, "gn_prac_6_pedigree.png")


def main() -> None:
    fig_abdm()
    fig_amr()
    fig_yf()
    fig_safe()
    fig_climate()
    fig_kaya()
    fig_pedigree()


if __name__ == "__main__":
    main()
