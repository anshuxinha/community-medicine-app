# -*- coding: utf-8 -*-
"""Split Library NCD chapter 6 into sub-IDs and apply first P0 inserts."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOCK = ROOT / "src" / "data" / "mockData.json"

SIX_6 = """OVERVIEW OF THE CHAPTER
This section covers Non-Communicable Disease (NCD) topics added when the National Programme for Prevention and Control of Non-Communicable Diseases (NP-NCD) widened beyond cancer, diabetes, cardiovascular disease, and stroke. It covers Chronic Obstructive Pulmonary Disease (COPD) and asthma, Chronic Kidney Disease (CKD), fatty-liver disease terminology, physical activity, ST-Elevation Myocardial Infarction (STEMI) facility levels, and the 2023-2030 NP-NCD operational frame.

DEFINITIONS
CHRONIC OBSTRUCTIVE PULMONARY DISEASE (COPD): A common, preventable, and treatable disease characterised by persistent respiratory symptoms and airflow limitation due to airway and/or alveolar abnormalities, usually caused by significant exposure to noxious particles or gases (Global Initiative for Chronic Obstructive Lung Disease).
NON-ALCOHOLIC FATTY LIVER DISEASE (NAFLD): Hepatic steatosis in the absence of significant alcohol use, as used in Ministry of Health and Family Welfare (MoHFW) NP-NCD operational documents (including Operational Guidelines for NAFLD Version 2.0, 2024).
METABOLIC DYSFUNCTION-ASSOCIATED STEATOTIC LIVER DISEASE (MASLD): The 2023 multi-society Delphi name for steatotic liver disease with cardiometabolic risk factors. It replaces NAFLD in international hepatology usage. MetALD names the overlap of metabolic dysfunction with higher alcohol intake.
ST-ELEVATION MYOCARDIAL INFARCTION (STEMI): Acute coronary occlusion presenting with persistent ST-segment elevation on electrocardiogram (ECG) and a need for immediate reperfusion.

[SN]COPD and asthma under NP-NCD[/SN]

COPD AND ASTHMA
- Tobacco smoke, household air pollution, occupational dusts, and outdoor air pollution drive COPD in India.
- NP-NCD (2023-2030) added COPD and asthma as priority conditions beyond the original cancer-diabetes-cardiovascular-stroke set.
- Population-based screening under NP-NCD remains for persons aged 30 years and above for hypertension, diabetes, and oral, breast, and cervical cancers. COPD and asthma are screened among Outpatient Department (OPD) attendees and suspected cases at Community Health Centre (CHC) / Sub-District Hospital (SDH) level.
- Primary care actions: brief tobacco cessation, household fuel counselling, influenza and pneumococcal vaccination where indicated, inhaler technique, and referral for spirometry when available.
- Link National Programme on Climate Change and Human Health (NPCCHH) and National Clean Air Programme (NCAP) when the question is environment plus NCD.

> **EXAM TIP:** Define COPD → two India exposures (tobacco and household air pollution) → NP-NCD 2023 expansion list → one line on screening level (OPD/suspected, not the 30+ population-based trio).

[SN]NAFLD, MASLD, and MetALD[/SN]

[LAQ]Fatty liver disease: terminology and NP-NCD integration[/LAQ]

FATTY LIVER DISEASE
- MoHFW programme documents still title the work NAFLD and issued Operational Guidelines for NAFLD under NP-NCD (Version 2.0, 2024).
- International teaching now uses MASLD for metabolic-dysfunction steatosis and MetALD when alcohol intake is also substantial. Write both names in an MD answer: programme name NAFLD; current clinical name MASLD.
- Obesity and diabetes are the main metabolic drivers taught with the NP-NCD NAFLD package.
- There is no drug that fully reverses established disease. Weight reduction, physical activity, glycaemic and blood-pressure control, and alcohol reduction are the operational levers.
- Screening of NAFLD is listed among OPD and suspected-case tasks at CHC/SDH in the NP-NCD medical officer module.

> **EXAM TIP:** Open with NAFLD as the programme name → one sentence on MASLD/MetALD rename → obesity and diabetes as drivers → lifestyle package → NP-NCD operational guidelines 2024. Do not invent a national prevalence.

[SN]WHO physical activity recommendations[/SN]

PHYSICAL ACTIVITY
- The World Health Organization (WHO) 2020 guidelines: adults 18-64 years should do at least 150-300 minutes of moderate-intensity aerobic activity per week, or 75-150 minutes of vigorous-intensity activity, or an equivalent combination, plus muscle-strengthening on 2 or more days.
- Children and adolescents 5-17 years: at least 60 minutes per day of moderate-to-vigorous activity, mostly aerobic.
- Limit sedentary time. Replace sitting with light activity when possible.
- India frame: NP-NCD health promotion, Fit India, and school health. Couch potato syndrome (sedentary leisure) sits with obesity and diabetes in the same answer set.

> **EXAM TIP:** Quote WHO 2020 minutes for adults → add muscle-strengthening 2 days → one India programme link. Do not mix child and adult cut-offs.

[LAQ]NP-NCD 2023-2030: expanded conditions and STEMI levels[/LAQ]

NP-NCD 2023-2030 (EXPANDED FRAME)
- In 2023 the programme name changed from National Programme for Prevention and Control of Cancer, Diabetes, Cardiovascular Diseases and Stroke (NPCDCS) to NP-NCD.
- Operational guidelines cover 2023-2030.
- Added in a phased manner: COPD and asthma, CKD, Pradhan Mantri National Dialysis Programme (PMNDP) linkage, NAFLD, stroke packages, and STEMI.
- Core strategies: health promotion; population-based screening of common NCDs from 30 years; timely management of hypertension, diabetes, common cancers, COPD, CKD, STEMI, stroke, and NAFLD at district/CHC level; NCD clinics; Ayushman Arogya Mandir screening; electronic records and Ayushman Bharat Health Account (ABHA).

STEMI FACILITY LEVELS (NP-NCD TEACHING)
- L1: medical officer present, no ECG, not capable of thrombolysis. Identify chest pain, give loading antiplatelet as per protocol, urgent referral.
- L2: medical officer, ECG available, capable of thrombolysis. Record ECG, thrombolyse eligible patients, refer for Percutaneous Coronary Intervention (PCI) when indicated.
- Higher centres: PCI-capable hospitals and critical care units.

> **EXAM TIP:** NPCDCS → NP-NCD 2023 → list expanded conditions in a table → population-based 30+ screening vs OPD screening for COPD/NAFLD → STEMI L1 vs L2. Close with ABHA/NCD clinic.

INDIAN CONTEXT:
- NP-NCD is implemented through the National Health Mission (NHM). District NCD cells, CHC NCD clinics, and Ayushman Arogya Mandirs are the usual service points.
- STEMI and NAFLD operational documents sit under the same programme. Quote the programme year 2023-2030, not an invented target rate.

[REF]Reference: MoHFW NP-NCD Operational Guidelines 2023-2030; MoHFW Operational Guidelines for NAFLD Version 2.0 (2024); WHO Guidelines on Physical Activity and Sedentary Behaviour (2020); GOLD COPD definition.[/REF]
"""

SNAKEBITE = """
[SN]National Action Plan for Snakebite Envenoming[/SN]

NATIONAL ACTION PLAN FOR PREVENTION AND CONTROL OF SNAKEBITE ENVENOMING (NAP-SE)
- MoHFW launched the National Action Plan for Prevention and Control of Snakebite Envenoming (NAP-SE) in 2024.
- Aim taught for exams: reduce snakebite mortality by half by 2030, aligned with the World Health Organization (WHO) snakebite roadmap.
- Pillars: community awareness and first aid (immobilise, do not cut or suck, rapid transport); availability of quality antisnake venom at public facilities; trained medical officers; surveillance of snakebite as a notifiable condition in implementing states; intersectoral work with forest and panchayat systems.
- Link accidents and injuries, rural occupational risk, and One Health when the question is wide.

> **EXAM TIP:** Name NAP-SE and year 2024 → 50 percent mortality reduction by 2030 → first-aid do-and-do-not → antisnake venom at public facilities. Do not list unlicensed herbal first aid.

"""

TELEMANAS = """
[SN]Tele-MANAS[/SN]

[LAQ]National Tele Mental Health Programme (Tele-MANAS)[/LAQ]

TELE-MANAS (NATIONAL TELE MENTAL HEALTH PROGRAMME)
DEFINITION
Tele Mental Health Assistance and Networking Across States (Tele-MANAS) is the National Tele Mental Health Programme (NTMHP). It is the digital arm of the District Mental Health Programme (DMHP). It was launched on 10 October 2022 (World Mental Health Day) to provide 24×7 tele-mental health counselling.

HIGH-YIELD POINTS
- Toll-free number: 14416 (a second access number 1-800-891-4416 is also used in programme material).
- Nodal technical centre: National Institute of Mental Health and Neuro Sciences (NIMHANS), Bengaluru.
- As on 03 March 2026 (Press Information Bureau): 36 States and Union Territories have set up 53 Tele-MANAS Cells; services in 20 languages as opted by States; more than 34.34 lakh calls handled since inception.
- Tele-MANAS Mobile Application launched on 10 October 2024. By December 2025 it included English, Hindi, and ten additional regional languages (Assamese, Bengali, Gujarati, Kannada, Malayalam, Marathi, Tamil, Telugu, Odia, Punjabi), with a screen-free path for visually challenged users via the helpline.
- Dedicated Tele-MANAS cell at Armed Forces Medical College (AFMC), Pune, for serving personnel and dependents.
- Two-tier idea for answers: trained counsellor on first contact; specialist/psychiatrist on escalation; in-person referral to DMHP, medical officers, or mental health professionals.
- Mental health services are also in the Comprehensive Primary Health Care package at Ayushman Arogya Mandirs.

> **EXAM TIP:** Launch date 10 Oct 2022 → 14416 → NIMHANS nodal → 53 cells / 36 States / 20 languages / 34.34 lakh calls (March 2026 PIB) → app 2024 → link DMHP. Quote the PIB month if you cite the call count.

"""

CENSUS_31_1 = """OVERVIEW OF THE CHAPTER
A population census is the complete count of people and housing in a country at a specified time. In India it is a Union subject under the Ministry of Home Affairs, run by the Office of the Registrar General and Census Commissioner of India (ORGI). This leaf covers the legal frame, Census 2011 headline results, and Census 2027 as the first digital census with caste enumeration.

DEFINITIONS
CENSUS (UNITED NATIONS): The total process of collecting, compiling, evaluating, analysing and publishing or otherwise disseminating demographic, economic and social data pertaining, at a specified time, to all persons in a country or in a well-delimited part of a country.
DE JURE CENSUS: Persons are counted at their usual place of residence.
DE FACTO CENSUS: Persons are counted where they spend the census night.
HOUSELISTING AND HOUSING CENSUS (HLO): First phase. Lists houses and households and records housing condition, amenities, and assets. Creates the frame for population enumeration.
POPULATION ENUMERATION (PE): Second phase. Records demographic, social, and economic particulars of every person.

[SN]Census of India: legal frame and history[/SN]

[LAQ]Census of India 2011 and Census 2027[/LAQ]

LEGAL FRAME AND HISTORY
- Census Act, 1948 and Census Rules, 1990 provide the statutory frame.
- First census in India: 1872 (Lord Mayo). First synchronous census: 1881 (Lord Ripon; W.C. Plowden as Census Commissioner).
- Held every ten years. Census 2021 was deferred because of the coronavirus disease 2019 (COVID-19) pandemic and is being taken as Census 2027.
- Two phases in every modern Indian census: (i) Houselisting and Housing Census; (ii) Population Enumeration.

CENSUS 2011 (15TH CENSUS SINCE 1872; 7TH AFTER INDEPENDENCE)
- Motto: Our Census, Our Future.
- Registrar General and Census Commissioner: C. Chandramouli.
- Final population: 1,210,854,977.
- Males about 51.5 percent, females about 48.5 percent.
- Decadal growth 2001-2011: 17.64 percent (first post-Independence decade with a smaller absolute increase than the previous decade).
- Most populous State: Uttar Pradesh. Least populous State: Sikkim.
- Density: 382 per sq km. Sex ratio: 943 females per 1,000 males. Child sex ratio (0-6 years): 919. Literacy: 74.04 percent (male 82.14, female 65.46).
- Method: de facto count on the census reference night, with a revisional round.

CENSUS 2027 (16TH CENSUS; 8TH AFTER INDEPENDENCE)
- First fully digital Census. Enumerators use mobile applications. Self-enumeration is offered before house-to-house work.
- Cabinet outlay: Rs 11,718.24 crore (PIB).
- Cabinet Committee on Political Affairs (30 April 2025) decided to include caste enumeration. Until 2011, only Scheduled Castes and Scheduled Tribes were listed in the census caste/tribe fields. Census 2027 is the first census in independent India to enumerate caste across communities (last all-caste census: 1931).
- Phase 1, HLO: April-September 2026. Each State or Union Territory notifies a 30-day block. Optional 15-day self-enumeration precedes the house-to-house HLO. Notification for Phase 1: 7 January 2026.
- Phase 2, PE: February 2027 for most of India. Union Territory of Ladakh and snow-bound non-synchronous areas of Jammu and Kashmir, Himachal Pradesh, and Uttarakhand: PE in September 2026.
- Reference date: 00:00 hours of 1 March 2027 for most of India; 00:00 hours of 1 October 2026 for Ladakh and the snow-bound non-synchronous areas.
- PE schedule (notified August 2026): 40 questions, including an open caste field (Scheduled Caste / Scheduled Tribe / Caste as declared). Census 2011 PE had 29 questions.
- Digital tools named in PIB: Census Management and Monitoring System (CMMS); Houselisting Block Creator (HLBC) web-map application using satellite imagery.

INDIAN CONTEXT:
- Census data feed delimitation, Finance Commission, National Food Security Act targeting, and sample frames for the National Family Health Survey (NFHS) and Sample Registration System (SRS) urban-rural classification.
- For MD answers, keep 2011 as the last completed census and 2027 as the current operation. Do not invent a 2027 headcount before ORGI releases it.

> **EXAM TIP:** UN definition → Act 1948 → 1872 vs 1881 → two phases → 2011 table (population, sex ratio, literacy, density) → 2027 digital, self-enumeration, caste, HLO 2026 / PE Feb 2027, reference dates. Draw a two-column 2011 vs 2027 table.

[REF]Reference: Census Act, 1948; Census of India 2011, Office of the Registrar General and Census Commissioner; PIB releases on Census 2027 (HLO notification 7 January 2026; digital platforms; PE question notification August 2026).[/REF]
"""


def leaf(id_: str, title: str, content: str) -> dict:
    return {
        "id": id_,
        "title": title,
        "content": content.strip() + "\n",
        "recentlyUpdated": False,
    }


def find(nid: str, nodes: list):
    for n in nodes:
        if n.get("id") == nid:
            return n
        k = find(nid, n.get("subsections") or [])
        if k:
            return k
    return None


def main() -> None:
    data = json.loads(MOCK.read_text(encoding="utf-8"))
    ch6 = next(x for x in data if x["id"] == "6")
    text = ch6["content"]

    def slice_from(start_marker: str, end_marker: str | None) -> str:
        s = text.find(start_marker)
        if s < 0:
            raise SystemExit(f"missing start {start_marker!r}")
        if end_marker is None:
            return text[s:]
        e = text.find(end_marker, s + 1)
        if e < 0:
            raise SystemExit(f"missing end {end_marker!r}")
        return text[s:e]

    overview = text[: text.find("CORE CONCEPTS")].strip()
    chd = slice_from("1. CORONARY HEART DISEASE (CHD)", "2. RHEUMATIC HEART DISEASE (RHD)")
    rhd = slice_from("2. RHEUMATIC HEART DISEASE (RHD)", "3. HYPERTENSION (HTN)")
    htn = slice_from("3. HYPERTENSION (HTN)", "4. OBESITY")
    obesity = slice_from("4. OBESITY", "5. DIABETES MELLITUS (DM)")
    dm = slice_from("5. DIABETES MELLITUS (DM)", "6. CANCERS")
    cancers = slice_from("6. CANCERS", "7. STROKE")
    stroke = slice_from("7. STROKE", "8. ACCIDENTS AND INJURIES")
    accidents = slice_from("8. ACCIDENTS AND INJURIES", "9. BLINDNESS AND VISUAL IMPAIRMENT")
    blindness = slice_from("9. BLINDNESS AND VISUAL IMPAIRMENT", "10. NP-NCD (ERSTWHILE NPCDCS)")
    npncd = slice_from("10. NP-NCD (ERSTWHILE NPCDCS)", "11. WHO STEPS (NCD RISK FACTOR SURVEY)")
    steps = slice_from("11. WHO STEPS (NCD RISK FACTOR SURVEY)", "13. DEAFNESS AND HEARING IMPAIRMENT")
    deafness = slice_from("13. DEAFNESS AND HEARING IMPAIRMENT", "FORMULAS AND CALCULATIONS")
    formulas = text[text.find("FORMULAS AND CALCULATIONS") :].strip()

    six_1 = (
        overview
        + "\nCORE CONCEPTS\n"
        + chd
        + rhd
        + htn
        + stroke
        + "\n"
        + formulas
    )
    six_2 = obesity + dm + steps
    six_3 = cancers
    six_4 = accidents + SNAKEBITE
    six_5 = blindness + deafness
    six_6 = npncd.strip() + "\n\n" + SIX_6

    ch6.pop("content", None)
    ch6["description"] = (
        "Epidemiology and prevention of major non-communicable diseases in India, "
        "including cardiovascular disease, diabetes, cancers, injuries, sensory loss, "
        "and the expanded NP-NCD 2023-2030 package."
    )
    ch6["subsections"] = [
        leaf("6-1", "Coronary Heart Disease, Rheumatic Heart Disease, Hypertension, and Stroke", six_1),
        leaf("6-2", "Obesity, Diabetes Mellitus, WHO STEPS, and Sedentary Behaviour", six_2),
        leaf("6-3", "Cancers: Epidemiology, Downstaging, and Cervical Cancer Elimination", six_3),
        leaf("6-4", "Accidents, Injuries, Haddon Matrix, and Snakebite Envenoming", six_4),
        leaf("6-5", "Blindness, Deafness, Disability Rights, and Pesticide Genetic Effects", six_5),
        leaf("6-6", "COPD, Fatty Liver Disease, Physical Activity, and NP-NCD 2023-2030", six_6),
    ]

    nmhp = find("7-11", data)
    if nmhp is None:
        raise SystemExit("7-11 missing")
    marker = "THE MENTAL HEALTHCARE ACT, 2017"
    body = nmhp["content"]
    if "TELE-MANAS" not in body:
        if marker not in body:
            raise SystemExit("MHCA marker missing in 7-11")
        nmhp["content"] = body.replace(marker, TELEMANAS + "\n" + marker, 1)

    if not any(x.get("id") == "31" for x in data):
        data.append(
            {
                "id": "31",
                "title": "Current Health Status of India",
                "description": (
                    "Census, Sample Registration System, National Family Health Survey, "
                    "National Health Policy 2017 versus current status, and survey methods "
                    "for MD Community Medicine."
                ),
                "recentlyUpdated": False,
                "subsections": [
                    leaf(
                        "31-1",
                        "Census of India 2011 and Census 2027",
                        CENSUS_31_1,
                    )
                ],
            }
        )

    MOCK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("chapter 6 subsections", [s["id"] for s in ch6["subsections"]])
    for s in ch6["subsections"]:
        print(s["id"], len(s["content"]))
    print("7-11", len(nmhp["content"]), "tele" , "TELE-MANAS" in nmhp["content"])
    print("31 present", any(x.get("id") == "31" for x in data))


if __name__ == "__main__":
    main()
