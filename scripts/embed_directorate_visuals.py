#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
embed_directorate_visuals.py
Carefully embeds Marcus Director visual assets into cleaned_ch_31.json and cleaned_ch_32.json
adhering strictly to ReadingView.js and verify_directorate_gate.py rules:
- Format: ![Descriptive Caption](https://...)
- Preceded by blank line (\n\n) and followed by blank line (\n\n)
- Never inside blockquote (>) or Exam Tip
- Placed under relevant conceptual heading
"""

import json
import os
import sys

CH31_PATH = r"C:\Users\Anshuman Sinha\.gemini\antigravity-cli\brain\db170b8d-46c5-4f68-8676-00564355e341\scratch\cleaned_ch_31.json"
CH32_PATH = r"C:\Users\Anshuman Sinha\.gemini\antigravity-cli\brain\db170b8d-46c5-4f68-8676-00564355e341\scratch\cleaned_ch_32.json"

BASE_URL = "https://storage.googleapis.com/community-med-app.firebasestorage.app/reading-illustrations"

CH31_INJECTIONS = {
    "31-1": {
        "anchor": "CENSUS 2001 VERSUS CENSUS 2011 KEY INDICATORS",
        "position": "before",
        "markdown": f"![Demographic Transition Model stages and India's Age-Sex Population Pyramid transition from expansive base to working-age demographic dividend]({BASE_URL}/ch31_1_demographic_transition_pyramid.png)"
    },
    "31-2": {
        "anchor": "ARCHITECTURAL FRAMEWORK OF THE DUAL RECORD SYSTEM\n",
        "position": "after",
        "markdown": f"![Sample Registration System dual record flowchart showing System A continuous enumeration, System B retrospective survey, matching cell, and Chandrasekaran-Deming estimator]({BASE_URL}/ch31_2_srs_dual_record_flowchart.png)"
    },
    "31-3": {
        "anchor": "KEY SECTORAL TRENDS AND PROGRAMMATIC CRITIQUE",
        "position": "before",
        "markdown": f"![NFHS-5 versus NFHS-6 comparative progress dashboard illustrating changes across reproductive health, maternal care, child immunization, stunting, and health insurance]({BASE_URL}/ch31_3_nfhs_indicators_dashboard.png)"
    },
    "31-4": {
        "anchor": "MASTER DISEASE SCORECARD: PUBLIC HEALTH BENCHMARKS",
        "position": "before",
        "markdown": f"![National disease care cascades showing NTEP Tuberculosis notification to cure trajectory alongside NACP-V HIV 95-95-95 fast-track progress]({BASE_URL}/ch31_4_disease_care_cascades.png)"
    },
    "31-5": {
        "anchor": "CORE OBJECTIVES AND STRATEGIC PILLARS OF NHP 2017\n",
        "position": "after",
        "markdown": f"![National Health Policy 2017 Comprehensive Primary Health Care continuum showing Ayushman Arogya Mandir primary hub linked to secondary and tertiary hospital care]({BASE_URL}/ch31_5_nhp_continuum_aam_architecture.png)"
    },
    "31-6": {
        "anchor": "COMPREHENSIVE COMPARISON MATRIX OF THE SIX HEALTH INFORMATION SYSTEMS\n",
        "position": "after",
        "markdown": f"![Continuum of India's six key health information systems comparing Census, SRS, CRS, NFHS, facility HMIS, and real-time IHIP outbreak surveillance]({BASE_URL}/ch31_6_health_information_systems_continuum.png)"
    },
}

CH32_INJECTIONS = {
    "32-1": {
        "anchor": "CORE BUILDING BLOCKS OF ABDM\n",
        "position": "after",
        "markdown": f"![Ayushman Bharat Digital Mission architecture showing four core building blocks of ABHA, HPR, HFR, and UHI converging through the federated consent manager]({BASE_URL}/ch32_1_abdm_architecture.png)"
    },
    "32-2": {
        "anchor": "ALGORITHMIC VALIDATION AND CLINICAL WORKFLOW\n",
        "position": "after",
        "markdown": f"![Artificial intelligence computer-aided detection triage workflow illustrating portable chest radiograph acquisition, qXR inference, molecular confirmation, and CDSS ethics]({BASE_URL}/ch32_2_ai_cad_screening_workflow.png)"
    },
    "32-3": {
        "anchor": "AERIAL PLATFORM ARCHITECTURE AND PAYLOAD SPECIFICATIONS\n",
        "position": "after",
        "markdown": f"![ICMR i-DRONE hub-and-spoke logistics corridor showing BVLOS flight path, cold-chain payload dispatch, and reverse diagnostic sample return]({BASE_URL}/ch32_3_idrone_logistics_model.png)"
    },
    "32-4": {
        "anchor": "CLINICAL RISK GROUP STRATIFICATION\n",
        "position": "before",
        "markdown": f"![Adult immunization life-course schedule priorities alongside the sequential pneumococcal conjugate and polysaccharide vaccination algorithm]({BASE_URL}/ch32_4_adult_immunization_framework.png)"
    },
    "32-5": {
        "anchor": "PUBLIC HEALTH RESPONSE TO SUSPECTED BIOLOGICAL ATTACK\n",
        "position": "before",
        "markdown": f"![Biosafety containment levels BSL-1 through BSL-4 hierarchy paired with CDC Category A, B, and C bioterrorism threat agents]({BASE_URL}/ch32_5_biosafety_levels_bioterrorism.png)"
    },
    "32-6": {
        "anchor": "KEY REGULATORY INITIATIVES IN INDIA",
        "position": "before",
        "markdown": f"![One Health framework for NAP-AMR 2.0 integrating human, animal, and environmental sectors with the WHO AWaRe antibiotic classification]({BASE_URL}/ch32_6_nap_amr_aware_one_health.png)"
    },
    "32-7": {
        "anchor": "REMOTE SENSING ENVIRONMENTAL INDICATORS\n",
        "position": "before",
        "markdown": f"![Geographic Information Systems spatial thematic layers from satellite remote sensing base through vector hydrology, facility assets, and geocoded disease clusters]({BASE_URL}/ch32_7_gis_thematic_layers_buffering.png)"
    },
    "32-8": {
        "anchor": "RECEIVER OPERATING CHARACTERISTIC (ROC) CURVE ANALYSIS\n",
        "position": "after",
        "markdown": f"![PRISMA 2020 four-stage systematic review flow diagram alongside Receiver Operating Characteristic curve geometry and Youden's Index]({BASE_URL}/ch32_8_prisma_roc_geometry.png)"
    },
    "32-9": {
        "anchor": "FAMILY ADOPTION PROGRAMME (FAP): NMC OPERATIONAL FRAMEWORK",
        "position": "before",
        "markdown": f"![Miller's pyramid of clinical competence from knowledge to authentic action alongside the NMC Family Adoption Programme three-year longitudinal timeline]({BASE_URL}/ch32_9_millers_pyramid_fap_timeline.png)"
    },
    "32-10": {
        "anchor": "HEALTHCARE CARBON FOOTPRINT AND GREEN HOSPITALS\n",
        "position": "after",
        "markdown": f"![Healthcare decarbonization greenhouse gas protocol Scopes 1, 2, and 3 emission sources in green hospitals and national Kayakalp mitigations]({BASE_URL}/ch32_10_healthcare_ghg_scopes_green_hospital.png)"
    },
    "32-11": {
        "anchor": "YELLOW FEVER EPIDEMIOLOGY AND IHR REGULATORY ARCHITECTURE\n",
        "position": "after",
        "markdown": f"![International Health Regulations 2005 Yellow Fever vaccination document audit and mandatory six-day quarantine decision tree for arrival in India]({BASE_URL}/ch32_11_yellow_fever_ihr_decision_tree.png)"
    },
}

def inject_visuals(filepath, injections):
    print(f"[*] Processing {filepath}...")
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    subs = data.get("subsections", [])
    injected_count = 0

    for sub in subs:
        sid = sub.get("id")
        if sid in injections:
            cfg = injections[sid]
            anchor = cfg["anchor"]
            pos = cfg["position"]
            md = cfg["markdown"]
            content = sub.get("content", "")

            # Check if already injected
            if md in content:
                print(f"  [-] Already present in {sid}")
                continue

            if anchor not in content:
                print(f"  [!] Anchor '{anchor[:30]}...' not found in {sid}!")
                # Fallback: search case-insensitive or partial
                alt_anchor = anchor.strip()
                if alt_anchor in content:
                    anchor = alt_anchor
                else:
                    print(f"  [!] CRITICAL: Could not find anchor in {sid}")
                    continue

            # Ensure safe spacing: blank line before and blank line after
            formatted_md = f"\n\n{md}\n\n"

            if pos == "before":
                # Put before the anchor
                sub["content"] = content.replace(anchor, f"{formatted_md}{anchor}", 1)
            else:
                # Put after the anchor
                sub["content"] = content.replace(anchor, f"{anchor}{formatted_md}", 1)

            injected_count += 1
            print(f"  [+] Injected visual into Subsection {sid}")

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"[*] Saved {filepath} with {injected_count} new injections.")

def main():
    inject_visuals(CH31_PATH, CH31_INJECTIONS)
    inject_visuals(CH32_PATH, CH32_INJECTIONS)

if __name__ == "__main__":
    main()
