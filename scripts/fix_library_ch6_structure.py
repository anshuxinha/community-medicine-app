# -*- coding: utf-8 -*-
"""Fix Library chapter 6 sequence, overviews, and leftover numbered headings."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOCK = ROOT / "src" / "data" / "mockData.json"

HEADING_NUM = re.compile(r"^(\d+\.\s+)(.+)$")


def unnumber_topic_headings(text: str) -> str:
    """Strip 1. 2. 4. prefixes from ALL-CAPS topic headings only, not exam lists."""
    out = []
    for line in text.splitlines(True):
        raw = line[:-1] if line.endswith("\n") else line
        m = HEADING_NUM.match(raw)
        if m:
            rest = m.group(2)
            letters = re.sub(r"[^A-Za-z]", "", rest)
            if letters and letters == letters.upper() and len(rest) <= 90:
                raw = rest
        out.append(raw + ("\n" if line.endswith("\n") else ""))
    return "".join(out)


def between(text: str, start: str, end: str | None = None) -> str:
    i = text.find(start)
    if i < 0:
        raise SystemExit(f"missing start {start!r}")
    if end is None:
        return text[i:]
    j = text.find(end, i + len(start))
    if j < 0:
        raise SystemExit(f"missing end {end!r} after {start!r}")
    return text[i:j]


def strip_heading_line(block: str, old: str, new: str) -> str:
    return block.replace(old, new, 1)


SIX_1_OVERVIEW = """OVERVIEW OF THE CHAPTER
This section opens Non-Communicable Diseases (NCDs) with the cardiovascular cluster, in textbook order: coronary heart disease, hypertension, stroke, and rheumatic heart disease. NCDs are a large share of adult death and disability in India. Cancers, diabetes, obesity, blindness, accidents, and the National Programme for Prevention and Control of Non-Communicable Diseases (NP-NCD) follow in later sections of this chapter.

DEFINITIONS
Non-Communicable Diseases (NCDs): Impairment of bodily structure and/or function that necessitates a modification of the patient's normal life, and has persisted over an extended period of time. Caused by non-reversible pathological alterations.
Epidemiological Transition Ratio: Ratio of Disability-Adjusted Life Years (DALYs) from Communicable, Maternal, Neonatal, and Nutritional Diseases (CMNNDs) to DALYs from NCDs and injuries. A ratio less than one indicates a higher burden of NCDs and injuries.
Coronary Heart Disease (CHD): Impairment of heart function due to inadequate blood flow to the heart compared to its needs, caused by obstructive changes in the coronary circulation.
Hypertension (HTN): A chronic condition of raised blood pressure, distributed continuously in populations, and a major risk for cardiovascular death and disability.
Stroke (apoplexy): Rapidly developed clinical signs of focal disturbance of cerebral function lasting more than 24 hours or leading to death, of presumed vascular origin.
Rheumatic Heart Disease (RHD): Chronic valvular heart disease that follows Acute Rheumatic Fever (ARF), itself a non-suppurative sequela of pharyngitis due to Group A β-haemolytic Streptococcus (GAS).

"""

SIX_1_KEY = """KEY POINTS
- Epidemiological Transition Ratio falls as NCD and injury burden rises relative to CMNNDs.
- Case Fatality Rate (CFR) measures killing power among cases of a disease.
- Filter cigarettes are not protective against CHD risk in classic teaching; risk tracks exposure intensity.
- Rule of halves highlights under-diagnosis and under-treatment of hypertension.
- Cerebral thrombosis/ischaemia is the most common stroke type in many series.

FORMULAS AND CALCULATIONS
Mortality metrics:
- Proportional Mortality Rate = (deaths from a specific cause / total deaths) × 100
- Case Fatality Rate = (deaths from a disease / cases of that disease) × 100

[REF]Reference: Standard Community Medicine NCD chapter (cardiovascular cluster); WHO stroke definition; Revised Jones criteria teaching; NP-NCD screening of adults for hypertension.[/REF]
"""

SIX_2_OVERVIEW = """OVERVIEW OF THE CHAPTER
This section covers diabetes mellitus and obesity (the metabolic pair in the NCD chapter), then physical activity, sedentary behaviour, and the World Health Organization (WHO) STEPwise approach to NCD risk factor surveillance (STEPS).

DEFINITIONS
Diabetes Mellitus (DM): A group of metabolic disorders characterised by hyperglycaemia due to defective insulin production and/or action.
Obesity: Abnormal growth of adipose tissue due to an increase in fat-cell number (hyperplastic obesity) or enlargement of fat-cell size (hypertrophic obesity).

"""

SIX_2_FORMULAS = """
FORMULAS AND CALCULATIONS
Obesity indicators:
- BMI = weight (kg) / height² (m²)
- Ponderal Index = height (cm) / cube root of weight (kg)
- Broca Index = height (cm) − 100
- Lorentz formula = height (cm) − 100 − [(height (cm) − 150) / 2 for women or / 4 for men]
- Corpulence Index = actual weight / desirable weight

KEY POINTS
- Obesity strongly raises relative risk of type 2 diabetes.
- STEPS has three layers: behavioural interview, physical measures, then biochemistry.

[REF]Reference: WHO diagnostic bands for diabetes; WHO 2020 Guidelines on Physical Activity and Sedentary Behaviour; WHO STEPwise approach to NCD risk factor surveillance; NP-NCD diabetes and obesity pathways.[/REF]
"""

SIX_3_OVERVIEW = """OVERVIEW OF THE CHAPTER
This section covers the epidemiology of cancers, levels of prevention, downstaging, cervical cancer elimination (World Health Organization 90-70-90), and a case-control scaffold for oral leukoplakia.

DEFINITIONS
Cancer: A group of diseases characterised by abnormal cell growth with ability to invade adjacent tissues and distant organs.

"""

SIX_4_OVERVIEW = """OVERVIEW OF THE CHAPTER
This section covers accidents and injuries, including road traffic accidents, the Haddon matrix, burns first aid, and the National Action Plan for Prevention and Control of Snakebite Envenoming (NAP-SE).

DEFINITIONS
Accident: An unexpected, unplanned occurrence which may involve injury.

"""

SIX_5_OVERVIEW = """OVERVIEW OF THE CHAPTER
This section covers visual impairment and blindness, deafness and hearing impairment, disability rights under Indian law, and pesticide-related genetic effects as they appear in the NCD and injury teaching set.

DEFINITIONS
Blindness (WHO and National Programme for Control of Blindness and Visual Impairment, NPCBVI): Visual acuity less than 3/60 in the better eye with best possible correction (unable to count fingers at 3 metres).

"""

SIX_6_OVERVIEW = """OVERVIEW OF THE CHAPTER
This section covers conditions added when the National Programme for Prevention and Control of Non-Communicable Diseases (NP-NCD) widened beyond cancer, diabetes, cardiovascular disease, and stroke: Chronic Obstructive Pulmonary Disease (COPD) and asthma, fatty-liver disease, Chronic Kidney Disease (CKD), ST-Elevation Myocardial Infarction (STEMI) facility levels, and the 2023-2030 NP-NCD operational frame.

DEFINITIONS
CHRONIC OBSTRUCTIVE PULMONARY DISEASE (COPD): A common, preventable, and treatable disease characterised by persistent respiratory symptoms and airflow limitation due to airway and/or alveolar abnormalities, usually caused by significant exposure to noxious particles or gases (Global Initiative for Chronic Obstructive Lung Disease).
NON-ALCOHOLIC FATTY LIVER DISEASE (NAFLD): Hepatic steatosis in the absence of significant alcohol use, as used in Ministry of Health and Family Welfare (MoHFW) NP-NCD operational documents (including Operational Guidelines for NAFLD Version 2.0, 2024).
METABOLIC DYSFUNCTION-ASSOCIATED STEATOTIC LIVER DISEASE (MASLD): The 2023 multi-society Delphi name for steatotic liver disease with cardiometabolic risk factors. It replaces NAFLD in international hepatology usage. MetALD names the overlap of metabolic dysfunction with higher alcohol intake.
ST-ELEVATION MYOCARDIAL INFARCTION (STEMI): Acute coronary occlusion presenting with persistent ST-segment elevation on electrocardiogram (ECG) and a need for immediate reperfusion.

"""


def main() -> None:
    data = json.loads(MOCK.read_text(encoding="utf-8"))
    chapters = data if isinstance(data, list) else next(v for v in data.values() if isinstance(v, list))
    ch6 = next(c for c in chapters if str(c.get("id")) == "6")
    by_id = {s["id"]: s for s in ch6["subsections"]}

    c1 = by_id["6-1"]["content"]
    c2 = by_id["6-2"]["content"]
    c3 = by_id["6-3"]["content"]
    c4 = by_id["6-4"]["content"]
    c5 = by_id["6-5"]["content"]
    c6 = by_id["6-6"]["content"]

    chd = between(c1, "1. CORONARY HEART DISEASE (CHD)", "2. RHEUMATIC HEART DISEASE (RHD)")
    rhd = between(c1, "2. RHEUMATIC HEART DISEASE (RHD)", "3. HYPERTENSION (HTN)")
    htn = between(c1, "3. HYPERTENSION (HTN)", "7. STROKE")
    stroke = between(c1, "7. STROKE", "FORMULAS AND CALCULATIONS")
    stroke = stroke.replace("7. STROKE", "STROKE (CEREBROVASCULAR ACCIDENT)", 1)

    obesity = between(c2, "4. OBESITY", "5. DIABETES MELLITUS (DM)")
    obesity = obesity.replace("4. OBESITY", "OBESITY", 1)
    dm = between(c2, "5. DIABETES MELLITUS (DM)", "11. WHO STEPS (NCD RISK FACTOR SURVEY)")
    steps = between(c2, "11. WHO STEPS (NCD RISK FACTOR SURVEY)", "12. COUCH POTATO SYNDROME")
    couch = between(c2, "12. COUCH POTATO SYNDROME", None)
    pa = between(
        c6,
        "[SN]WHO physical activity recommendations[/SN]",
        "[LAQ]NP-NCD 2023-2030: expanded conditions and STEMI levels[/LAQ]",
    )

    cancers = c3.replace("6. CANCERS\n\n", "CANCERS\n\n", 1)
    cancers = cancers.replace("India hooks:", "Indian context:")

    accidents = c4.replace("8. ACCIDENTS AND INJURIES\n\n", "ACCIDENTS AND INJURIES\n\n", 1)

    blindness = between(c5, "9. BLINDNESS AND VISUAL IMPAIRMENT", "13. DEAFNESS AND HEARING IMPAIRMENT")
    deafness = between(c5, "13. DEAFNESS AND HEARING IMPAIRMENT", "14. DISABILITY RIGHTS AND GOVERNMENT PROVISIONS")
    disability = between(c5, "14. DISABILITY RIGHTS AND GOVERNMENT PROVISIONS", "15. PESTICIDES AND GENETIC EFFECTS")
    pesticides = between(c5, "15. PESTICIDES AND GENETIC EFFECTS", "KEY POINTS")

    npncd_old = between(c6, "[LAQ]NPCDCS / NP-NCD: goals, objectives and strategies[/LAQ]", "OVERVIEW OF THE CHAPTER")
    copd = between(c6, "[SN]COPD and asthma under NP-NCD[/SN]", "[SN]NAFLD, MASLD, and MetALD[/SN]")
    nafld = between(
        c6,
        "[SN]NAFLD, MASLD, and MetALD[/SN]",
        "[SN]WHO physical activity recommendations[/SN]",
    )
    expanded = between(c6, "[LAQ]NP-NCD 2023-2030: expanded conditions and STEMI levels[/LAQ]", None)
    # drop the old WHO PA line from 6-6 REF
    expanded = expanded.replace(
        "WHO Guidelines on Physical Activity and Sedentary Behaviour (2020); GOLD COPD definition.",
        "GOLD COPD definition.",
    )

    six_1 = unnumber_topic_headings(
        SIX_1_OVERVIEW + chd + htn + stroke + rhd + "\n" + SIX_1_KEY
    )
    six_2 = unnumber_topic_headings(
        SIX_2_OVERVIEW + dm + obesity + couch + "\n" + pa + "\n" + steps + SIX_2_FORMULAS
    )
    six_3 = unnumber_topic_headings(
        SIX_3_OVERVIEW
        + cancers.rstrip()
        + "\n\n[REF]Reference: WHO cervical cancer elimination 90-70-90; COTPA 2003; NP-NCD cancer screening pathways.[/REF]\n"
    )
    six_4 = unnumber_topic_headings(
        SIX_4_OVERVIEW
        + accidents.rstrip()
        + "\n\nKEY POINTS\n- Haddon matrix is the standard injury-prevention framework.\n\n"
        "[REF]Reference: Haddon matrix teaching; MoHFW National Action Plan for Snakebite Envenoming (NAP-SE) 2024.[/REF]\n"
    )
    six_5 = unnumber_topic_headings(
        SIX_5_OVERVIEW
        + blindness
        + deafness
        + disability
        + pesticides.rstrip()
        + "\n\nKEY POINTS\n- Vision 2020 lists differ slightly for global versus India teaching sets.\n\n"
        "[REF]Reference: WHO/NPCBVI blindness definition; NPPCD; Rights of Persons with Disabilities Act, 2016.[/REF]\n"
    )
    six_6 = unnumber_topic_headings(
        SIX_6_OVERVIEW + copd + nafld + npncd_old + expanded
    )

    by_id["6-1"]["title"] = (
        "Coronary Heart Disease, Hypertension, Stroke, and Rheumatic Heart Disease"
    )
    by_id["6-1"]["content"] = six_1 if six_1.endswith("\n") else six_1 + "\n"
    by_id["6-2"]["title"] = (
        "Diabetes Mellitus, Obesity, Physical Activity, and WHO STEPS"
    )
    by_id["6-2"]["content"] = six_2 if six_2.endswith("\n") else six_2 + "\n"
    by_id["6-3"]["title"] = (
        "Cancers: Epidemiology, Downstaging, and Cervical Cancer Elimination"
    )
    by_id["6-3"]["content"] = six_3 if six_3.endswith("\n") else six_3 + "\n"
    by_id["6-4"]["title"] = (
        "Accidents, Injuries, Haddon Matrix, and Snakebite Envenoming"
    )
    by_id["6-4"]["content"] = six_4 if six_4.endswith("\n") else six_4 + "\n"
    by_id["6-5"]["title"] = (
        "Blindness, Deafness, Disability Rights, and Pesticide Genetic Effects"
    )
    by_id["6-5"]["content"] = six_5 if six_5.endswith("\n") else six_5 + "\n"
    by_id["6-6"]["title"] = "COPD, Fatty Liver Disease, and NP-NCD 2023-2030"
    by_id["6-6"]["content"] = six_6 if six_6.endswith("\n") else six_6 + "\n"

    # Textbook sequence: CVD, cancers, diabetes/obesity, blindness, accidents, programme.
    ch6["subsections"] = [by_id[i] for i in ("6-1", "6-3", "6-2", "6-5", "6-4", "6-6")]
    ch6["description"] = (
        "Epidemiology and prevention of major non-communicable diseases in India, "
        "in textbook order: cardiovascular diseases, cancers, diabetes and obesity, "
        "blindness, accidents, then the expanded NP-NCD 2023-2030 package."
    )

    payload = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    tmp = MOCK.with_suffix(".json.tmp")
    tmp.write_text(payload, encoding="utf-8")
    tmp.replace(MOCK)

    heading_re = re.compile(r"^\d+\.\s+[A-Z][A-Z0-9 /(),.&'’+:\-–]{6,}$")
    print("order", [s["id"] for s in ch6["subsections"]])
    for s in ch6["subsections"]:
        numbered = [
            ln.strip()
            for ln in s["content"].splitlines()
            if heading_re.match(ln.strip())
        ]
        print(s["id"], s["title"][:60], "chars", len(s["content"]), "numbered_headings", numbered[:6])
        first = next(ln for ln in s["content"].splitlines() if ln.strip())
        print("  starts:", first)


if __name__ == "__main__":
    main()
