# -*- coding: utf-8 -*-
"""Patch Library leaves with latest official India figures and year/source labels.

Sources (do not invent numbers):
- NFHS-6 India Fact Sheets, IIPS/MoHFW, May 2026
- SRS Bulletin 2023 Vol. 58-1, RGI (CBR, CDR, IMR 2023)
- SRS Statistical Report 2023, RGI (TFR 1.9)
- Parliamentary/RGI SRS 2024 series (IMR 24, NMR 18, U5MR 28)
- SRS Special Bulletin on Maternal Mortality 2022-24 (MMR 87)
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOCK = ROOT / "src" / "data" / "mockData.json"

NFHS6 = "NFHS-6, 2023-24, IIPS/MoHFW"
NFHS5 = "NFHS-5, 2019-21, IIPS/MoHFW"
SRS24 = "SRS 2024, RGI"
SRS23B = "SRS Bulletin 2023, RGI"
SRS23S = "SRS Statistical Report 2023, RGI"
SRS_MMR = "SRS Special Bulletin on Maternal Mortality 2022-24, RGI"
CENSUS11 = "Census 2011, ORGI"

TABLE_DEMOG = f"""CURRENT INDIA FIGURES

Quote the latest official number with year and source. Do not mix National Family Health Survey (NFHS), Sample Registration System (SRS), and Census series.

| Indicator | Latest | Year | Source | Previous |
| --- | --- | --- | --- | --- |
| Total fertility rate (NFHS) | 2.0 children/woman (urban 1.6, rural 2.1) | 2023-24 | {NFHS6} | 2.0 ({NFHS5}) |
| Total fertility rate (SRS) | 1.9 children/woman (urban 1.5, rural 2.1) | 2023 | {SRS23S} | 2.0 (SRS 2022) |
| Crude birth rate | 18.4 per 1,000 population | 2023 | {SRS23B} | 18.7 (SRS 2022 teaching figure) |
| Crude death rate | 6.4 per 1,000 population | 2023 | {SRS23B} | 7.2 (SRS 2022 teaching figure) |
| Infant mortality rate | 24 per 1,000 live births | 2024 | {SRS24} | 25 ({SRS23B}); 32 (SRS 2020) |
| Sex ratio at birth | 917 females per 1,000 males | 2021-23 | {SRS23S} | 907 (SRS 2018-20) |
| Overall sex ratio | 940 females per 1,000 males | 2011 | {CENSUS11} | Census series; NFHS-6 fact sheets do not publish this indicator |
| Effective literacy (age 7+) | 74.04% (male 82.14%, female 65.46%) | 2011 | {CENSUS11} | Still the last completed Census literacy series |

Field Toolbox has an NFHS-5 vs NFHS-6 comparison built from the IIPS India fact sheet.
"""

TABLE_FP = f"""CURRENT INDIA FIGURES (FAMILY PLANNING)

| Indicator | Latest | Year | Source | Previous |
| --- | --- | --- | --- | --- |
| Any contraceptive method (currently married women 15-49) | 69.1% | 2023-24 | {NFHS6} | 66.7% ({NFHS5}) |
| Any modern method | 52.7% | 2023-24 | {NFHS6} | 56.4% ({NFHS5}). Overall use rose; modern-method share fell |
| Any traditional method | 16.4% | 2023-24 | {NFHS6} | 10.3% ({NFHS5}) |
| Female sterilization | 36.5% | 2023-24 | {NFHS6} | 37.9% ({NFHS5}) |
| Total unmet need | 8.5% (spacing 4.5%, limiting 4.0%) | 2023-24 | {NFHS6} | 9.4% ({NFHS5}) |
| Women 20-24 married before age 18 | 20.1% | 2023-24 | {NFHS6} | 23.3% ({NFHS5}) |
"""

TABLE_MCH = f"""CURRENT INDIA FIGURES (MATERNAL AND CHILD HEALTH)

NFHS-6 India fact sheets (May 2026) do not publish infant, neonatal, or under-five mortality. Use SRS for those rates.

| Indicator | Latest | Year | Source | Previous |
| --- | --- | --- | --- | --- |
| Maternal mortality ratio | 87 per 100,000 live births | 2022-24 | {SRS_MMR} | 88 (SRS 2021-23); 93 (SRS 2019-21); 97 (SRS 2018-20) |
| Infant mortality rate | 24 per 1,000 live births (rural 28 / urban 18 in 2023) | 2024 | {SRS24} | 25 ({SRS23B}); 32 (SRS 2020) |
| Neonatal mortality rate | 18 per 1,000 live births | 2024 | {SRS24} | SRS 2020 teaching tables ~20 |
| Under-five mortality rate | 28 per 1,000 live births | 2024 | {SRS24} | 29 (SRS 2023) |
| Institutional births | 90.6% | 2023-24 | {NFHS6} | 88.6% ({NFHS5}) |
| ANC in first trimester | 76.2% | 2023-24 | {NFHS6} | 70.0% ({NFHS5}) |
| At least 4 ANC visits | 65.2% | 2023-24 | {NFHS6} | 58.5% ({NFHS5}) |
| IFA for 180 days or more | 37.8% | 2023-24 | {NFHS6} | 26.0% ({NFHS5}) |
| Caesarean section | 27.2% | 2023-24 | {NFHS6} | 21.5% ({NFHS5}) |
| Exclusive breastfeeding (under 6 months) | 55.8% | 2023-24 | {NFHS6} | 63.7% ({NFHS5}). Coverage fell |
| Breastfed within 1 hour of birth | 50.1% | 2023-24 | {NFHS6} | 41.8% ({NFHS5}) |
| Fully vaccinated (12-23 months, fact-sheet definition) | 82.6% | 2023-24 | {NFHS6} | PIB also quotes 87.1% from vaccination-card information |
"""

TABLE_NUTR = f"""CURRENT INDIA FIGURES (CHILD NUTRITION AND ADULT OVERWEIGHT)

| Indicator | Latest | Year | Source | Previous |
| --- | --- | --- | --- | --- |
| Stunting (under 5, height-for-age) | 29.3% (urban 23.9%, rural 30.9%) | 2023-24 | {NFHS6} | 35.5% ({NFHS5}) |
| Wasting (under 5, weight-for-height) | 19.0% | 2023-24 | {NFHS6} | 19.3% ({NFHS5}) |
| Severe wasting | 5.2% | 2023-24 | {NFHS6} | 7.7% ({NFHS5}) |
| Underweight (under 5) | 31.8% | 2023-24 | {NFHS6} | 32.1% ({NFHS5}) |
| Women 15-49 with BMI 25 or above | 30.7% | 2023-24 | {NFHS6} | 24.0% ({NFHS5}) |
| Men 15-49 with BMI 25 or above | 27.3% | 2023-24 | {NFHS6} | 22.9% ({NFHS5}) |
| Households with health insurance | 60.2% | 2023-24 | {NFHS6} | 41.0% ({NFHS5}) |

Anaemia: NFHS-6 India fact sheets do not publish comparable anaemia estimates (Technical Advisory Committee; ICMR gold-standard series planned separately). Quote anaemia as 57.0% of women 15-49 ({NFHS5}) until that series is released. Do not invent an NFHS-6 anaemia percentage.
"""

TABLE_NHM = f"""CURRENT INDIA FIGURES (AGAINST NHM TARGETS)

National Health Mission (NHM) targets remain the programme goals. Latest official achievement:

| Indicator | NHM target | Latest official | Year | Source |
| --- | --- | --- | --- | --- |
| Infant mortality rate | 25 per 1,000 live births | 24 | 2024 | {SRS24} |
| Maternal mortality ratio | 100 per 100,000 live births (NHM); SDG 3.1 is below 70 | 87 | 2022-24 | {SRS_MMR} |
| Total fertility rate | 2.1 | 2.0 (NFHS); 1.9 (SRS) | 2023-24 / 2023 | {NFHS6}; {SRS23S} |
"""

TABLE_HEALTHCARE = f"""CURRENT INDIA FIGURES

| Indicator | Latest | Year | Source | Note |
| --- | --- | --- | --- | --- |
| Adult literacy (age 7+) | 74.04% | 2011 | {CENSUS11} | Last completed Census; do not present as an NFHS figure |
| Overall sex ratio | 940 females per 1,000 males | 2011 | {CENSUS11} | |
| NFHS-5 household sex ratio | 1020 females per 1,000 males | 2019-21 | {NFHS5} | Different series from Census. NFHS-6 fact sheets omitted this indicator |
| Sex ratio at birth | 917 females per 1,000 males | 2021-23 | {SRS23S} | |
| Total fertility rate | 2.0 | 2023-24 | {NFHS6} | |
| Infant mortality rate | 24 per 1,000 live births | 2024 | {SRS24} | |
"""

TABLE_CH2 = f"""CURRENT INDIA FIGURES (SELECTED HEALTH INDICES)

Infant Mortality Rate (IMR) is the most widely used single health-status indicator. Latest official IMR is 24 per 1,000 live births ({SRS24}). Previous: 25 ({SRS23B}); 32 (SRS 2020).

Human Development Index (HDI) for India: 0.685, rank 130 of 193, medium category (UNDP Human Development Report 2025, data year 2023).
"""


def find_node(nodes, target_id: str):
    for n in nodes:
        if str(n.get("id")) == str(target_id):
            return n
        for key in ("subsections", "children", "items"):
            kids = n.get(key)
            if isinstance(kids, list):
                found = find_node(kids, target_id)
                if found is not None:
                    return found
    return None


def insert_after_overview(content: str, table: str) -> str:
    if "CURRENT INDIA FIGURES" in content:
        return content
    table = table.strip() + "\n"
    for marker in ("\n\nDEFINITIONS\n", "\n\nDEFINITIONS ", "\n\nCORE CONCEPTS\n"):
        if marker in content:
            return content.replace(marker, "\n\n" + table + "\n" + marker.lstrip("\n"), 1)
    # 9-5 opens with the MMR heading after overview
    if "\n\nMATERNAL MORTALITY RATIO" in content:
        return content.replace(
            "\n\nMATERNAL MORTALITY RATIO",
            "\n\n" + table + "\nMATERNAL MORTALITY RATIO",
            1,
        )
    return table + "\n" + content


def apply_repls(text: str, pairs: list[tuple[str, str]]) -> str:
    for old, new in pairs:
        if old not in text:
            continue
        text = text.replace(old, new)
    return text


def strip_park_phrases(text: str) -> str:
    text = text.replace("\u2014", ": ")
    replacements = [
        ("Indian census definition, Park):", "Indian census definition):"),
        (" (Park)", ""),
        ("(Park)", ""),
        ("Park Table 9 trend", "Census trend series"),
        ("Park: fall from", "fall from"),
        ("Park; rural", "rural"),
        ("Park links easy", "Easy"),
        ("Park mid-2023 illustration: ", ""),
        (" (Park mid-2023)", ""),
        (" in recent Park mid-2020s estimates", ""),
        (" (Park mid-2024 illustration: about 71 years for males and 74 for females)", " (about 71 years for males and 74 for females in recent national estimates)"),
        (" (Park).", "."),
        ("Park Table 18 lists 2022 birth rate 18.7 and death rate 7.2", "SRS 2022 listed birth rate 18.7 and death rate 7.2"),
        (" (Park NFHS-5 total ≈ 1.99)", ""),
        ("Park teaching framework", "programme classification"),
        ("classic Park teaching list — residual problems persist unevenly", "classic teaching list; residual problems persist unevenly"),
        ("(Park 2022 illustration: 18.7)", "(SRS 2022: 18.7)"),
        ("(Park / GoI teaching)", "(GoI teaching)"),
        ("(Park NFHS-5 pattern)", "(NFHS-5 pattern)"),
        ("Park demographic narrative cites TFR 2.48 for STs; ", ""),
        ("as taught in standard Indian CM notes/Park exam tradition", "as classically taught: nearly all infections are clinical"),
        (" (Park subsystems)", ""),
        (" (Park often teaches about mean plus or minus 2 SE)", ""),
        (" in classic Park teaching", ""),
        (" (Park teaching pattern)", ""),
    ]
    return apply_repls(text, replacements)


PATCHES: dict[str, dict] = {
    "8-1": {
        "table": TABLE_DEMOG,
        "repls": [
            (
                "- India: national TFR near replacement with state-level dualism (higher-fertility northern states vs low-fertility southern states).",
                "- India: Total Fertility Rate (TFR) 2.0 (NFHS-6, 2023-24, IIPS/MoHFW), unchanged from NFHS-5. SRS Statistical Report 2023 gives TFR 1.9. State dualism remains (higher-fertility northern states vs low-fertility southern states). Always name the series.",
            ),
            (
                "- Total Fertility Rate (TFR) categorization by Government of India (Park teaching framework):",
                "- Total Fertility Rate (TFR) categorization by Government of India (programme classification; refresh against current Mission Parivar Vikas lists):",
            ),
        ],
    },
    "8-2": {
        "table": TABLE_DEMOG,
        "repls": [
            (
                "- Sex ratio is defined as the number of females per 1000 males (Park).",
                "- Sex ratio is defined as the number of females per 1000 males.",
            ),
            (
                "  - Census overall sex ratio: Census 2011 = 940 females per 1000 males (Park Table 9 trend).\n  - Child sex ratio (0–6 years): Census 2011 = 914 females per 1000 males (Park: fall from 927 in 2001).\n  - Sex ratio at birth: about 907 females per 1000 males for 2018–20 (Park; rural–urban and state variation wide — e.g. higher in Kerala, lower in parts of North India).",
                "  - Census overall sex ratio: 940 females per 1,000 males (Census 2011, ORGI). This remains the last completed Census series.\n  - Child sex ratio (0-6 years): 914 females per 1,000 males (Census 2011, ORGI; fall from 927 in 2001).\n  - Sex ratio at birth: 917 females per 1,000 males (SRS Statistical Report 2023, three-year 2021-23). Earlier SRS 2018-20 teaching figure was about 907. NFHS-6 fact sheets do not publish sex ratio.",
            ),
            (
                "Park links easy availability of sex-determination tests and abortion to adverse sex composition (“female deficit”).",
                "Easy availability of sex-determination tests and abortion contributes to adverse sex composition (female deficit).",
            ),
            (
                "- India literacy rate is 74.04 percent. Male literacy is 82.14 percent and Female literacy is 65.46 percent.",
                "- India effective literacy rate is 74.04 percent (male 82.14 percent, female 65.46 percent) (Census 2011, ORGI). This is the last completed Census literacy series, not an NFHS figure.",
            ),
            (
                "- Rounds: NFHS-1 (1992–93), NFHS-2 (1998–99), NFHS-3 (2005–06), NFHS-4 (2015–16), NFHS-5 (2019–21).",
                "- Rounds: NFHS-1 (1992-93), NFHS-2 (1998-99), NFHS-3 (2005-06), NFHS-4 (2015-16), NFHS-5 (2019-21), NFHS-6 (2023-24). Latest published India fact sheets: IIPS, May 2026.",
            ),
            (
                "- Key NFHS-5 (2019–21) fertility/nutrition teaching figures (use year labels):\n  - Total Fertility Rate about 2.0 (Park NFHS-5 total ≈ 1.99).\n  - Undernutrition under-5: stunting, wasting, and underweight remain major problems (always state the NFHS round when quoting percentages; do not mix survey rounds without labels).",
                "- Key NFHS-6 (2023-24) fertility/nutrition figures (IIPS/MoHFW India fact sheet):\n  - Total Fertility Rate 2.0 (urban 1.6, rural 2.1), unchanged from NFHS-5.\n  - Stunting 29.3% (from 35.5% in NFHS-5); wasting 19.0%; severe wasting 5.2%; underweight 31.8%.\n  - Always name the NFHS round. NFHS-6 fact sheets omit IMR, NMR, U5MR, sex ratio, and anaemia.",
            ),
            (
                "  - CBR has declined from around 20 in the mid-2010s toward the high teens (Park Table 18 lists 2022 birth rate 18.7 and death rate 7.2).\n  - IMR and other child mortality indicators have also declined over successive SRS years.",
                "  - Crude birth rate 18.4 and crude death rate 6.4 per 1,000 population (SRS Bulletin 2023, RGI). SRS 2022 teaching figures were birth rate 18.7 and death rate 7.2.\n  - Infant Mortality Rate 24 per 1,000 live births (SRS 2024, RGI); 25 in SRS Bulletin 2023; 32 in SRS 2020. Always year-label SRS figures. NFHS-6 does not publish IMR.",
            ),
        ],
    },
    "8-3": {
        "table": TABLE_FP,
        "repls": [
            (
                "- India TFR is about 2.0 (NFHS-5 / recent SRS series near replacement); always state the source year.",
                "- India TFR is 2.0 (NFHS-6, 2023-24, IIPS/MoHFW), unchanged from NFHS-5. SRS Statistical Report 2023 gives TFR 1.9. Always name the series; do not mix NFHS and SRS in one unnamed figure.",
            ),
            (
                "India’s CBR has declined from around 20 in the mid-2010s toward the high teens (Park 2022 illustration: 18.7) — always year-label SRS figures.",
                "India’s crude birth rate is 18.4 per 1,000 population (SRS Bulletin 2023, RGI). SRS 2022 was 18.7. Always year-label SRS figures.",
            ),
        ],
    },
    "8-7": {
        "table": TABLE_FP,
        "repls": [
            (
                "- NFHS-5 (2019–21): total unmet need about **9.4%** (spacing about **4.0%**, limiting about **5.4%**). The older figure 12.9% is NFHS-4 and should not be quoted as current.",
                "- NFHS-6 (2023-24, IIPS/MoHFW): total unmet need **8.5%** (spacing **4.5%**, limiting **4.0%**). NFHS-5 was 9.4% (spacing 4.0%, limiting 5.4%). NFHS-4 12.9% is historical only.",
            ),
        ],
    },
    "9-5": {
        "table": TABLE_MCH,
        "repls": [
            (
                "- India (Sample Registration System special bulletin 2018-2020): Maternal Mortality Ratio (MMR) 97 per 100,000 live births.\n- India (Sample Registration System special bulletin 2019-2021, as cited by official PIB summary): MMR 93 per 100,000 live births.",
                "- India latest: Maternal Mortality Ratio (MMR) 87 per 100,000 live births (SRS Special Bulletin on Maternal Mortality 2022-24, RGI).\n- Recent series: 88 (SRS 2021-23), 93 (SRS 2019-21), 97 (SRS 2018-20). Always write the bulletin years.",
            ),
            (
                "- High-burden states (SRS 2018-2020 teaching table): Assam 195, Madhya Pradesh 173, Uttar Pradesh 167.\n- Low-burden states (same table): Kerala 19, Maharashtra 33.",
                "- High-burden states (SRS 2022-24): Uttar Pradesh 154, Madhya Pradesh 135, Chhattisgarh 124, Odisha 124.\n- Lower-burden major states (same bulletin): Kerala 24, Tamil Nadu 25, Maharashtra 37. Assam fell from 195 (2018-20) to 84 (2022-24).",
            ),
            (
                "- Incidence in India: 18 per 1000 live births (SRS 2020).",
                "- Latest official perinatal rate is not published as a single headline in the 2023-24 SRS bulletins used here. Do not recycle the SRS 2020 teaching figure of 18 as current. Quote NMR 18 and IMR 24 (SRS 2024, RGI) when a current child-survival number is required.",
            ),
            (
                "- Incidence in India: about 20 per 1000 live births (Sample Registration System 2020 teaching tables; early neonatal mortality about 15 per 1000). Neonatal mortality is higher in boys than in girls. National newborn targets aim for continued reduction toward low double-digit and eventually single-digit rates under Every Newborn Action Plan framing.",
                "- Incidence in India: Neonatal Mortality Rate 18 per 1,000 live births (SRS 2024, RGI). SRS 2020 teaching tables were about 20 (early neonatal about 15). Neonatal mortality is higher in boys than in girls. National newborn targets aim for continued reduction toward low double-digit and eventually single-digit rates under Every Newborn Action Plan framing.",
            ),
            (
                "- Incidence in India: 8 per 1000 live births (SRS 2020).",
                "- Post-neonatal mortality is IMR minus NMR. With IMR 24 and NMR 18 (SRS 2024, RGI) the implied post-neonatal rate is about 6 per 1,000 live births. The older SRS 2020 teaching figure of 8 is not current.",
            ),
            (
                "- Incidence in India: 28 per 1000 live births (Sample Registration System 2020 teaching figure). Later SRS releases show further decline (e.g., official summaries have cited Infant Mortality Rate around 27 for 2021). Always pair the number with the SRS year in answers.\n  - High-burden example (SRS 2020 teaching): Madhya Pradesh among the highest.\n  - Low-burden example: Kerala among the lowest.",
                "- Incidence in India: 24 per 1,000 live births (SRS 2024, RGI). SRS Bulletin 2023: 25 (rural 28, urban 18). SRS 2020 teaching figure was 32; do not quote 28 or 32 as current.\n  - High-burden example (SRS 2023 IMR): Madhya Pradesh, Uttar Pradesh, and Chhattisgarh among the highest (37).\n  - Low-burden example: Kerala (5 in SRS 2023).",
            ),
            (
                "- Incidence in India: 32 per 1000 live births (SRS 2020).",
                "- Incidence in India: Under-five Mortality Rate 28 per 1,000 live births (SRS 2024, RGI). SRS 2023 was 29. The SRS 2020 teaching figure of 32 is not current.",
            ),
        ],
    },
    "9-1": {
        "table": TABLE_MCH,
        "repls": [],
    },
    "9-2": {
        "table": f"""CURRENT INDIA FIGURES (INFANT FEEDING)

| Indicator | Latest | Year | Source | Previous |
| --- | --- | --- | --- | --- |
| Exclusive breastfeeding (under 6 months) | 55.8% | 2023-24 | {NFHS6} | 63.7% ({NFHS5}). Coverage declined |
| Breastfed within 1 hour of birth | 50.1% | 2023-24 | {NFHS6} | 41.8% ({NFHS5}) |
| Children 6-8 months receiving solid/semi-solid food and breastmilk | 59.5% | 2023-24 | {NFHS6} | 45.9% ({NFHS5}) |
""",
        "repls": [],
    },
    "11-12": {
        "table": TABLE_NUTR,
        "repls": [],
    },
    "11-13": {
        "table": TABLE_NUTR,
        "repls": [],
    },
    "11-18": {
        "table": TABLE_NUTR,
        "repls": [
            (
                "Large service footprint; stunting and wasting decline is slower th",
                "Large service footprint; NFHS-6 stunting is 29.3% (from 35.5% in NFHS-5) while wasting is nearly unchanged at 19.0%",
            ),
        ],
    },
    "13": {
        "table": f"""CURRENT INDIA FIGURES (TRIBAL vs NATIONAL)

Scheduled Tribe (ST) rows below remain NFHS-5 (2019-21) because the NFHS-6 India fact sheet does not publish a full ST-specific indicator set. National comparators are updated to NFHS-6.

| Indicator | ST (NFHS-5, 2019-21) | National latest | National source |
| --- | --- | --- | --- |
| Total fertility rate | 2.09 | 2.0 | {NFHS6} |
| Institutional delivery | 68.0% | 90.6% | {NFHS6} |
| Stunting under 5 | 40.9% | 29.3% | {NFHS6} |
""",
        "repls": [
            (
                "- Institutional Delivery: 68.0 percent (much lower than the national average of 88.6 percent).",
                "- Institutional Delivery: 68.0 percent (NFHS-5, 2019-21, ST). National latest is 90.6 percent (NFHS-6, 2023-24, IIPS/MoHFW). The 88.6 percent comparator was NFHS-5 national.",
            ),
            (
                "- Stunted: 40.9 percent (vs 35.5 percent general).",
                "- Stunted: 40.9 percent (NFHS-5, ST) versus 29.3 percent national (NFHS-6, 2023-24). The 35.5 percent comparator was NFHS-5 national.",
            ),
        ],
    },
    "10-1": {
        "table": TABLE_HEALTHCARE,
        "repls": [
            (
                "- Adult literacy rate % (2011): 74.04",
                "- Adult literacy rate % (Census 2011, ORGI): 74.04. Last completed Census series.",
            ),
            (
                "- Sex ratio: 1020 females per 1000 males (NFHS-5, 2019-21) / 943 (Census 2011) / 907 (SRS 2018-20)",
                "- Sex ratio: 1020 females per 1,000 males (NFHS-5 household series, 2019-21; NFHS-6 fact sheets omitted this). Census 2011 overall 940 (often taught as 943 in older notes). Sex ratio at birth 917 (SRS 2021-23). Keep series separate.",
            ),
        ],
    },
    "7-1": {
        "table": TABLE_NHM,
        "repls": [
            (
                "- Reduce Infant Mortality Rate (IMR) to 25 / 1000 live births.",
                "- Reduce Infant Mortality Rate (IMR) to 25 / 1000 live births. Latest official IMR is 24 (SRS 2024, RGI), so the numerical NHM IMR target has been reached at national level; state gaps remain.",
            ),
        ],
    },
    "2": {
        "table": TABLE_CH2,
        "repls": [
            (
                "- India's PQLI is often quoted around ~65 in older notes (verify current figure if asked for a precise national value).",
                "- India's PQLI is often quoted around 65 in older teaching notes. Treat that as a historical classroom figure; prefer HDI (UNDP HDR 2025: 0.685) when a dated composite index is required.",
            ),
            (
                "- Rabies, tetanus, and measles (as taught in standard Indian CM notes/Park exam tradition).",
                "- Rabies, tetanus, and measles (classically taught as having little hidden portion: nearly all infections are clinical).",
            ),
        ],
    },
}

# Leaves that only need a table if they quote rates
OPTIONAL_TABLES = {
    "9-10": TABLE_MCH,
    "7-2": TABLE_MCH,
    "14": TABLE_NUTR,
    "27-1": TABLE_NHM,
}


def main() -> None:
    data = json.loads(MOCK.read_text(encoding="utf-8"))
    changed = []
    missing = []
    for lid, spec in PATCHES.items():
        node = find_node(data, lid)
        if node is None or not node.get("content"):
            missing.append(lid)
            continue
        original = node["content"]
        text = original
        text = insert_after_overview(text, spec["table"])
        text = apply_repls(text, spec.get("repls") or [])
        text = strip_park_phrases(text)
        if text != original:
            node["content"] = text
            node["recentlyUpdated"] = True
            changed.append(lid)
    for lid, table in OPTIONAL_TABLES.items():
        node = find_node(data, lid)
        if node is None or not node.get("content"):
            continue
        if "CURRENT INDIA FIGURES" in node["content"]:
            continue
        original = node["content"]
        text = insert_after_overview(original, table)
        text = strip_park_phrases(text)
        if text != original:
            node["content"] = text
            node["recentlyUpdated"] = True
            changed.append(lid)

    MOCK.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print("changed", changed)
    print("missing", missing)


if __name__ == "__main__":
    main()
