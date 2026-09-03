#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_directorate_visuals.py
Marcus Visual Architecture: High-Yield Medical & Public Health Visuals
for Chapters 31 and 32 (17 Subsections).
"""

import os
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "reading-illustrations"
OUT_DIR.mkdir(exist_ok=True)

# Aesthetic Palette (Marcus Directorate Guidelines)
C_PRIMARY = "#1E3A8A"    # Deep Navy
C_SECONDARY = "#0D9488"  # Teal
C_ACCENT = "#D97706"     # Warm Amber
C_DANGER = "#DC2626"     # Medical Crimson / Red
C_SUCCESS = "#16A34A"    # Forest Green
C_PURPLE = "#7C3AED"     # Deep Violet
C_BG = "#F8FAFC"         # Clean Off-White
C_CARD = "#FFFFFF"       # White Card
C_BORDER = "#CBD5E1"     # Light Slate Border
C_TEXT = "#0F172A"       # Slate 900
C_MUTED = "#64748B"      # Slate 500

plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

def save_fig(fig, filename):
    out_path = OUT_DIR / filename
    fig.savefig(out_path, dpi=180, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    print(f"[+] Saved: {out_path} ({os.path.getsize(out_path):,} bytes)")

# ----------------------------------------------------------------------
# 31-1: Demographic Transition Model & India Population Pyramid
# ----------------------------------------------------------------------
def draw_31_1():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7), facecolor=C_BG)
    fig.suptitle("Demographic Transition Model & India's Age-Sex Pyramid Dynamics", 
                 fontsize=17, fontweight='bold', color=C_PRIMARY, y=0.98)

    # Left: DTM Model
    ax1.set_facecolor(C_CARD)
    stage_labels = ["Stage 1\nHigh\nStationary", "Stage 2\nEarly\nExpanding", 
                    "Stage 3\nLate\nExpanding\n(India)", "Stage 4\nLow\nStationary", "Stage 5\nDeclining"]
    x = np.linspace(0.5, 5.5, 500)
    
    # Birth Rate curve
    cbr = 40 / (1 + np.exp(1.5 * (x - 3.2))) + 10
    # Death Rate curve
    cdr = 40 / (1 + np.exp(2.0 * (x - 2.0))) + 8
    
    ax1.plot(x, cbr, label="Crude Birth Rate (CBR)", color=C_PRIMARY, lw=3)
    ax1.plot(x, cdr, label="Crude Death Rate (CDR)", color=C_DANGER, lw=3, ls="--")
    ax1.fill_between(x, cbr, cdr, where=(cbr > cdr), color=C_SECONDARY, alpha=0.15, label="Natural Population Increase")
    
    for i in range(1, 6):
        ax1.axvline(i + 0.5, color=C_BORDER, ls=":", lw=1.2)
        ax1.text(i, 47, stage_labels[i-1], ha='center', va='top', fontsize=9, fontweight='bold', 
                 color=C_SUCCESS if i == 3 else C_TEXT,
                 bbox=dict(boxstyle="round,pad=0.3", fc="#DCFCE7" if i == 3 else "#F1F5F9", ec=C_SUCCESS if i == 3 else C_BORDER, lw=1.5 if i == 3 else 1))

    ax1.annotate("India Position (SRS 2024):\nCBR: 18.3, CDR: 6.4\nTFR: 1.9 (Replacement Met)", 
                 xy=(3.2, 19), xytext=(3.4, 28),
                 arrowprops=dict(facecolor=C_SUCCESS, shrink=0.08, width=2, headwidth=8),
                 fontsize=9.5, fontweight='bold', color=C_SUCCESS,
                 bbox=dict(boxstyle="round,pad=0.4", fc="#F0FDF4", ec=C_SUCCESS, lw=1.5))

    ax1.set_xlim(0.5, 5.5)
    ax1.set_ylim(0, 50)
    ax1.set_xticks([])
    ax1.set_ylabel("Vital Rates per 1,000 Population", fontsize=11, fontweight='bold', color=C_TEXT)
    ax1.set_title("5 Stages of Demographic Transition", fontsize=13, fontweight='bold', color=C_PRIMARY, pad=12)
    ax1.legend(loc='lower left', fontsize=9, framealpha=0.95)
    ax1.grid(True, ls='--', alpha=0.3)

    # Right: Population Pyramid Transition
    ax2.set_facecolor(C_CARD)
    age_groups = ['0-4', '5-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65-74', '75+']
    y_pos = np.arange(len(age_groups))
    
    pyr_1971_m = [-14.5, -24.0, -17.0, -13.0, -11.0, -8.5, -6.0, -3.5, -1.5]
    pyr_1971_f = [ 14.0,  23.0,  16.5,  12.5,  10.5,  8.0,  5.8,  3.2,  1.5]
    
    pyr_2024_m = [-8.2, -16.5, -18.8, -17.5, -14.8, -11.5, -7.5, -4.5, -2.2]
    pyr_2024_f = [ 7.6,  15.5,  17.9,  16.8,  14.2,  11.2,  7.6,  4.8,  2.5]

    ax2.barh(y_pos, pyr_2024_m, height=0.55, color="#3B82F6", label="Male (Current Bulge)", alpha=0.85)
    ax2.barh(y_pos, pyr_2024_f, height=0.55, color="#EC4899", label="Female (Current Bulge)", alpha=0.85)
    ax2.plot(pyr_1971_m, y_pos, color=C_MUTED, ls="--", lw=2, label="1971 Base Baseline")
    ax2.plot(pyr_1971_f, y_pos, color=C_MUTED, ls="--", lw=2)

    ax2.set_yticks(y_pos)
    ax2.set_yticklabels(age_groups, fontsize=10, fontweight='bold')
    ax2.set_ylabel("Age Bracket (Years)", fontsize=11, fontweight='bold', color=C_TEXT)
    ax2.set_xlabel("Percentage of Total Population (%)", fontsize=11, fontweight='bold', color=C_TEXT)
    ax2.set_title("India Age-Sex Pyramid: Expansive to Stationary Transition", fontsize=13, fontweight='bold', color=C_PRIMARY, pad=12)
    
    ax2.axvline(0, color=C_TEXT, lw=1.2)
    ax2.set_xlim(-26, 26)
    ticks = np.array([-20, -10, 0, 10, 20])
    ax2.set_xticks(ticks)
    ax2.set_xticklabels([f"{abs(v)}%" for v in ticks])
    
    ax2.text(0, 3.5, "DEMOGRAPHIC DIVIDEND BULGE\n(Ages 15-59: >65% of Population)", 
             ha='center', va='center', fontsize=9.5, fontweight='bold', color=C_PRIMARY,
             bbox=dict(boxstyle="round,pad=0.3", fc="#EFF6FF", ec=C_PRIMARY, lw=1.2))
    ax2.text(0, 0.4, "Narrowed Pediatric Base (TFR 1.9-2.0)", ha='center', va='center',
             fontsize=8.5, fontweight='bold', color=C_SECONDARY)

    ax2.legend(loc='upper right', fontsize=8.5, framealpha=0.95)
    ax2.grid(True, ls='--', alpha=0.3)

    plt.tight_layout()
    save_fig(fig, "ch31_1_demographic_transition_pyramid.png")

# ----------------------------------------------------------------------
# 31-2: SRS Dual Record Flowchart (Chandrasekaran-Deming Model)
# ----------------------------------------------------------------------
def draw_31_2():
    fig, ax = plt.subplots(figsize=(15, 8.5), facecolor=C_BG)
    ax.set_facecolor(C_BG)
    ax.axis('off')
    
    fig.suptitle("Sample Registration System (SRS): Dual Record Capture-Recapture Architecture", 
                 fontsize=17, fontweight='bold', color=C_PRIMARY, y=0.97)

    def draw_box(x, y, w, h, title, body="", fill=C_CARD, border=C_BORDER, text_color=C_TEXT, title_color=C_PRIMARY):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.03,rounding_size=0.03", 
                                     facecolor=fill, edgecolor=border, lw=2)
        ax.add_patch(rect)
        if title:
            ax.text(x + w/2, y + h - 0.04, title, ha='center', va='top', fontsize=11, fontweight='bold', color=title_color)
        if body:
            ax.text(x + w/2, y + (h - 0.08)/2, body, ha='center', va='center', fontsize=9, color=text_color, linespacing=1.3)

    def draw_arrow(x1, y1, x2, y2, label=""):
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="-|>", lw=2, color=C_PRIMARY, mutation_scale=15))
        if label:
            ax.text((x1+x2)/2, (y1+y2)/2 + 0.02, label, ha='center', va='bottom', fontsize=8.5, fontweight='bold', color=C_PRIMARY)

    draw_box(0.28, 0.84, 0.44, 0.10, "True Total Vital Events (N)", 
             "Live Births and Deaths occurring in designated Probability Sample Units", 
             fill="#EFF6FF", border=C_PRIMARY, title_color=C_PRIMARY)

    draw_arrow(0.38, 0.84, 0.22, 0.74)
    draw_arrow(0.62, 0.84, 0.78, 0.74)

    draw_box(0.04, 0.54, 0.36, 0.20, "SYSTEM A: Continuous Enumeration",
             "• Resident Part-time Enumerator (Anganwadi / Teacher)\n• Form 2 (Births) & Form 3 (Deaths) continuously logged\n• Continuous surveillance within defined sample unit\n• Total vital count captured: N₁ events",
             fill="#F0FDF4", border=C_SUCCESS, title_color=C_SUCCESS)

    draw_box(0.60, 0.54, 0.36, 0.20, "SYSTEM B: Retrospective Half-Yearly Survey",
             "• Independent Full-time Supervisor (Census Directorate)\n• Door-to-door canvas every 6 months (Jan-Jun, Jul-Dec)\n• Conducted without prior access to System A records\n• Total vital count captured: N₂ events",
             fill="#FEF3C7", border=C_ACCENT, title_color=C_ACCENT)

    draw_arrow(0.22, 0.54, 0.38, 0.44)
    draw_arrow(0.78, 0.54, 0.62, 0.44)

    draw_box(0.25, 0.30, 0.50, 0.14, "MATCHING CELL & 2x2 CONCORDANCE MATRIX",
             "Events cross-tabulated at District/State Office:\n"
             "• Concordant Matched (M): Recorded by BOTH A & B\n"
             "• Unmatched in A only (N₁ - M)  |  Unmatched in B only (N₂ - M)",
             fill="#F5F3FF", border=C_PURPLE, title_color=C_PURPLE)

    draw_arrow(0.50, 0.30, 0.50, 0.22)

    draw_box(0.12, 0.08, 0.36, 0.14, "Third-Party Field Reconciliation",
             "• Joint field inspection for all unmatched events\n• Conducted by Supervisor + Inspecting Officer\n• Eliminates duplicate records, establishes veracity\n• Standardized Verbal Autopsy (RH-1 to RH-4)",
             fill="#F1F5F9", border=C_MUTED, title_color=C_TEXT)

    draw_box(0.52, 0.06, 0.44, 0.16, "CHANDRASEKARAN-DEMING ESTIMATOR",
             r"$\hat{N} = \frac{N_1 \times N_2}{M}$" + "\n\n"
             r"Missed by both systems: $x = \frac{(N_1 - M)(N_2 - M)}{M}$" + "\n"
             "SRS produces official annual vital rates:\nCBR, CDR, IMR (24), NMR (18), U5MR (28), TFR (1.9), MMR (87)",
             fill="#FFFBEB", border=C_ACCENT, title_color=C_ACCENT)

    draw_arrow(0.48, 0.15, 0.52, 0.15)

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    save_fig(fig, "ch31_2_srs_dual_record_flowchart.png")

# ----------------------------------------------------------------------
# 31-3: NFHS-5 vs NFHS-6 Key Indicators Progress Dashboard
# ----------------------------------------------------------------------
def draw_31_3():
    fig, ax = plt.subplots(figsize=(15, 8.5), facecolor=C_BG)
    ax.set_facecolor(C_CARD)
    
    fig.suptitle("NFHS-5 (2019-21) versus NFHS-6 (2023-24): National RCH & Nutrition Trajectory", 
                 fontsize=17, fontweight='bold', color=C_PRIMARY, y=0.98)

    indicators = [
        "Modern Contraceptive (mCPR %)",
        "First Trimester ANC (%)",
        "4+ Antenatal Visits (%)",
        "Institutional Deliveries (%)",
        "C-Section Rate (All %)",
        "Full Immunization (12-23m %)",
        "Rotavirus 3rd Dose (%)",
        "Under-5 Stunting (< -2SD %)",
        "Under-5 Wasting (< -2SD %)",
        "Under-5 Underweight (%)",
        "Health Insurance Cover (%)",
        "Female Overweight/Obese (%)"
    ]
    
    nfhs5_vals = [56.5, 70.0, 58.5, 88.6, 21.5, 76.6, 36.4, 35.5, 19.3, 32.1, 41.0, 24.0]
    nfhs6_vals = [61.2, 76.2, 65.2, 90.6, 27.2, 82.6, 85.4, 29.3, 16.1, 26.4, 60.2, 30.7]
    
    y = np.arange(len(indicators))
    h = 0.36
    
    ax.barh(y + h/2, nfhs5_vals, height=h, label="NFHS-5 (2019-21)", color="#94A3B8", alpha=0.9)
    # Color bar based on favorable vs concerning
    colors_nfhs6 = []
    for i, (n5, n6) in enumerate(zip(nfhs5_vals, nfhs6_vals)):
        if "C-Section" in indicators[i] or "Overweight" in indicators[i]:
            colors_nfhs6.append(C_DANGER if n6 > n5 else C_SUCCESS)
        elif "Stunting" in indicators[i] or "Wasting" in indicators[i] or "Underweight" in indicators[i]:
            colors_nfhs6.append(C_SUCCESS if n6 < n5 else C_DANGER)
        else:
            colors_nfhs6.append(C_SUCCESS if n6 > n5 else C_DANGER)

    ax.barh(y - h/2, nfhs6_vals, height=h, label="NFHS-6 (2023-24)", color=colors_nfhs6, alpha=0.95)
    
    for i in range(len(indicators)):
        diff = nfhs6_vals[i] - nfhs5_vals[i]
        sign = "+" if diff > 0 else ""
        ax.text(max(nfhs5_vals[i], nfhs6_vals[i]) + 1.5, y[i] - h/2, 
                f"{nfhs6_vals[i]:.1f}% ({sign}{diff:.1f})", 
                va='center', fontsize=9, fontweight='bold', color=colors_nfhs6[i])
        ax.text(nfhs5_vals[i] - 1.2, y[i] + h/2, f"{nfhs5_vals[i]:.1f}%", 
                va='center', ha='right', fontsize=8.5, color="#FFFFFF", fontweight='bold')

    ax.set_yticks(y)
    ax.set_yticklabels(indicators, fontsize=10.5, fontweight='bold', color=C_TEXT)
    ax.invert_yaxis()
    ax.set_xlim(0, 105)
    ax.set_xlabel("Percentage (%)", fontsize=11, fontweight='bold', color=C_TEXT)
    ax.legend(loc='lower right', fontsize=10, framealpha=0.95)
    ax.grid(True, ls='--', alpha=0.3)
    
    # Explanatory badges
    ax.text(68, 6.2, "MAJOR SUCCESSES:\n• Rotavirus 3-dose: +49.0% jump\n• Insurance Cover: 41% → 60.2%\n• Stunting: 35.5% → 29.3%", 
            fontsize=9.5, color=C_SUCCESS, fontweight='bold',
            bbox=dict(boxstyle="round,pad=0.4", fc="#F0FDF4", ec=C_SUCCESS, lw=1.5))
    ax.text(68, 10.8, "EMERGING CONCERNS:\n• C-Section escalation: 27.2% (Private >52%)\n• Female Overweight/Obese: 30.7%", 
            fontsize=9.5, color=C_DANGER, fontweight='bold',
            bbox=dict(boxstyle="round,pad=0.4", fc="#FEF2F2", ec=C_DANGER, lw=1.5))

    plt.tight_layout()
    save_fig(fig, "ch31_3_nfhs_indicators_dashboard.png")

# ----------------------------------------------------------------------
# 31-4: Public Health Care Cascades (NTEP TB & HIV 95-95-95)
# ----------------------------------------------------------------------
def draw_31_4():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7.5), facecolor=C_BG)
    fig.suptitle("National Disease Control Care Cascades: NTEP (Tuberculosis) & NACP-V (HIV)", 
                 fontsize=17, fontweight='bold', color=C_PRIMARY, y=0.98)

    # Left: NTEP TB Care Cascade
    ax1.set_facecolor(C_CARD)
    tb_stages = [
        "1. Total Incident TB\n(100% | 2.8 Million)",
        "2. Case Notifications\n(91.1% | 2.55 Million)",
        "3. Treatment Initiated\n(87.5% | 2.45 Million)",
        "4. Treatment Success\n(88.0% DS-TB Cohort)"
    ]
    tb_vals = [100.0, 91.1, 87.5, 77.0]
    tb_colors = [C_PRIMARY, "#2563EB", C_SECONDARY, C_SUCCESS]
    
    bars1 = ax1.bar(range(4), tb_vals, color=tb_colors, width=0.55, edgecolor=C_BORDER, lw=1.5)
    for bar, val in zip(bars1, tb_vals):
        ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1.8, 
                 f"{val:.1f}%", ha='center', va='bottom', fontsize=11, fontweight='bold', color=C_PRIMARY)
        
    ax1.set_xticks(range(4))
    ax1.set_xticklabels(tb_stages, fontsize=9.5, fontweight='bold', color=C_TEXT)
    ax1.set_ylim(0, 115)
    ax1.set_ylabel("% of Estimated Incident Cases", fontsize=11, fontweight='bold', color=C_TEXT)
    ax1.set_title("NTEP Tuberculosis Care Cascade (India TB Report)", fontsize=12.5, fontweight='bold', color=C_PRIMARY, pad=12)
    ax1.grid(True, ls='--', alpha=0.3, axis='y')

    # Annotations on TB gap
    ax1.annotate("Private Sector Share:\n~32% (8.4 Lakhs via Ni-kshay)", xy=(1, 91.1), xytext=(1.2, 102),
                 arrowprops=dict(facecolor=C_ACCENT, shrink=0.08, width=1.5, headwidth=6),
                 fontsize=8.5, fontweight='bold', color=C_ACCENT,
                 bbox=dict(boxstyle="round,pad=0.3", fc="#FFFBEB", ec=C_ACCENT, lw=1.2))

    # Right: HIV 95-95-95 Cascade
    ax2.set_facecolor(C_CARD)
    hiv_stages = [
        "1. Diagnosed PLHIV\n(Know Status)",
        "2. On ART\n(Linked to Care)",
        "3. Virally Suppressed\n(Viral Load <1000)"
    ]
    hiv_targets = [95.0, 95.0, 95.0]
    hiv_actual = [83.9, 86.6, 97.6]  # NACO Sankalak
    
    x = np.arange(3)
    w = 0.35
    ax2.bar(x - w/2, hiv_targets, width=w, label="UNAIDS 95-95-95 Target", color="#CBD5E1", edgecolor=C_BORDER)
    bars2 = ax2.bar(x + w/2, hiv_actual, width=w, label="India Current (NACO Sankalak)", color=[C_ACCENT, C_ACCENT, C_SUCCESS], edgecolor=C_BORDER)
    
    for bar, val in zip(bars2, hiv_actual):
        ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1.8, 
                 f"{val:.1f}%", ha='center', va='bottom', fontsize=11, fontweight='bold', 
                 color=C_SUCCESS if val >= 95 else C_ACCENT)

    ax2.axhline(95, color=C_SUCCESS, ls="--", lw=2, label="95% Target Line")
    ax2.set_xticks(x)
    ax2.set_xticklabels(hiv_stages, fontsize=10, fontweight='bold', color=C_TEXT)
    ax2.set_ylim(0, 115)
    ax2.set_ylabel("Conditional Percentage (%)", fontsize=11, fontweight='bold', color=C_TEXT)
    ax2.set_title("NACP-V: HIV 95-95-95 Fast-Track Progress", fontsize=12.5, fontweight='bold', color=C_PRIMARY, pad=12)
    ax2.legend(loc='lower left', fontsize=9, framealpha=0.95)
    ax2.grid(True, ls='--', alpha=0.3, axis='y')

    ax2.text(2, 40, "3rd 95 SURPASSED:\n97.6% Viral Suppression\non Antiretroviral Therapy", 
             ha='center', fontsize=9.5, fontweight='bold', color=C_SUCCESS,
             bbox=dict(boxstyle="round,pad=0.3", fc="#F0FDF4", ec=C_SUCCESS, lw=1.2))

    plt.tight_layout()
    save_fig(fig, "ch31_4_disease_care_cascades.png")

# ----------------------------------------------------------------------
# 31-5: NHP 2017 Continuum of Care & Ayushman Arogya Mandir
# ----------------------------------------------------------------------
def draw_31_5():
    fig, ax = plt.subplots(figsize=(15, 8.5), facecolor=C_BG)
    ax.set_facecolor(C_BG)
    ax.axis('off')
    
    fig.suptitle("National Health Policy 2017: Comprehensive Primary Health Care (CPHC) Continuum", 
                 fontsize=17, fontweight='bold', color=C_PRIMARY, y=0.97)

    def draw_tier(x, y, w, h, title, subtitle, bullets, fill, border, title_color):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.03,rounding_size=0.03", 
                                     facecolor=fill, edgecolor=border, lw=2.2)
        ax.add_patch(rect)
        ax.text(x + 0.02, y + h - 0.04, title, fontsize=11.5, fontweight='bold', color=title_color)
        ax.text(x + 0.02, y + h - 0.08, subtitle, fontsize=9, fontstyle='italic', color=C_MUTED)
        body = "\n".join([f"• {b}" for b in bullets])
        ax.text(x + 0.02, y + 0.03, body, fontsize=8.8, color=C_TEXT, va='bottom', linespacing=1.3)

    def draw_v_arrow(x, y1, y2, label=""):
        ax.annotate("", xy=(x, y2), xytext=(x, y1),
                    arrowprops=dict(arrowstyle="<|-|>", lw=2.5, color=C_PRIMARY, mutation_scale=15))
        if label:
            ax.text(x + 0.015, (y1+y2)/2, label, fontsize=8.5, fontweight='bold', color=C_PRIMARY, rotation=270, va='center')

    # Tier 1: Community
    draw_tier(0.08, 0.74, 0.84, 0.16, 
              "TIER 1: COMMUNITY EMPOWERMENT & PROMOTIVE PLATFORM", 
              "Village Health Sanitation and Nutrition Committees (VHSNC) & Mahila Arogya Samitis (MAS)",
              ["Frontline Workers: Accredited Social Health Activist (ASHA) & Anganwadi Worker (AWW)",
               "Universal Community Mobilization: Village Health, Sanitation and Nutrition Days (VHSND)",
               "Population-Based Screening (PBS): CBAC enumeration for NCDs, Oral/Breast/Cervical cancer in adults >=30y"],
              fill="#F8FAFC", border="#94A3B8", title_color=C_TEXT)

    draw_v_arrow(0.50, 0.74, 0.68, "Community Mobilization")

    # Tier 2: Primary Care Hub (Ayushman Arogya Mandir)
    draw_tier(0.08, 0.44, 0.84, 0.24, 
              "TIER 2: AYUSHMAN AROGYA MANDIR (AAM - SUB-CENTRE & PHC UPGRADE)", 
              "Core Engine of Comprehensive Primary Health Care (CPHC) - 1.5 Lakh Facilities Transformed",
              ["Leadership: Community Health Officer (CHO - B.Sc Nursing / Ayurvedic practitioner with BPCCHN certification)",
               "12 Expanded Service Packages: Maternal, Neonatal, Child, Adolescent, Family Planning, Communicable (TB/Malaria),",
               "  Non-Communicable Diseases (Hypertension/Diabetes), Mental Health, ENT, Eye, Elderly/Palliative, Trauma stabilization",
               "Essential Medicines & Diagnostics: 65 essential free medicines + 14 point-of-care diagnostic tests",
               "Teleconsultation & Wellness: eSanjeevani tele-link to specialist hubs; Daily wellness and Yoga sessions"],
              fill="#F0FDF4", border=C_SUCCESS, title_color=C_SUCCESS)

    draw_v_arrow(0.50, 0.44, 0.38, "eSanjeevani Teleconsultation / Upward Referral")

    # Tier 3 & 4: Secondary & Tertiary Care
    draw_tier(0.08, 0.10, 0.84, 0.28, 
              "TIERS 3 & 4: SECONDARY & TERTIARY CARE BACKBONE (PM-JAY INTEGRATION)", 
              "Community Health Centres (CHCs), First Referral Units (FRUs), District Hospitals, Medical Colleges",
              ["First Referral Units (FRUs): Comprehensive Emergency Obstetric & Newborn Care (CEmONC), 24/7 blood storage",
               "Specialist Triage: Medicine, Surgery, Obstetrics/Gynecology, Pediatrics, Anesthesia, and Critical Care",
               "Ayushman Bharat PM-JAY: Inpatient health cover of INR 5 Lakh per family per year for bottom 40% vulnerable families",
               "Digital Integration: ABDM interoperability, unified e-Prescriptions, and coordinated counter-referral back to AAMs"],
              fill="#EFF6FF", border=C_PRIMARY, title_color=C_PRIMARY)

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    save_fig(fig, "ch31_5_nhp_continuum_aam_architecture.png")

# ----------------------------------------------------------------------
# 31-6: Health Information Systems Continuum
# ----------------------------------------------------------------------
def draw_31_6():
    fig, ax = plt.subplots(figsize=(16, 8.5), facecolor=C_BG)
    ax.set_facecolor(C_BG)
    ax.axis('off')
    
    fig.suptitle("Continuum of India's Major Health Information Systems: Methodological Comparison", 
                 fontsize=16.5, fontweight='bold', color=C_PRIMARY, y=0.97)

    systems = [
        {"name": "1. POPULATION CENSUS", "inst": "ORGI / Ministry of Home Affairs", 
         "nature": "Decennial 100% Statutory Complete Enumeration (Census Act 1948)",
         "scope": "1.21 Billion (2011) / Digital Census 2027", 
         "output": "Total population denominator, sex ratio, density, literacy, urbanization",
         "color": C_PRIMARY, "fill": "#EFF6FF"},
        {"name": "2. SAMPLE REGISTRATION (SRS)", "inst": "ORGI / Ministry of Home Affairs", 
         "nature": "Continuous Dual Record Probability Sample Surveillance",
         "scope": "Nationally representative sample (~8.4 million population)", 
         "output": "Official annual vital rates: CBR, CDR, IMR (24), NMR (18), TFR (1.9), MMR (87)",
         "color": C_SUCCESS, "fill": "#F0FDF4"},
        {"name": "3. CIVIL REGISTRATION (CRS)", "inst": "ORGI (RBD Act 1969 / 2023 Amendment)", 
         "nature": "Continuous Universal Statutory Administrative Registration",
         "scope": "All births and deaths across municipal and panchayat registrar desks", 
         "output": "Legal identity birth/death certificates, Medical Certification of Cause of Death",
         "color": "#0284C7", "fill": "#F0F9FF"},
        {"name": "4. NATIONAL FAMILY HEALTH (NFHS)", "inst": "IIPS, Mumbai / MoHFW", 
         "nature": "Periodic Multi-round Cross-sectional Household Sample Survey",
         "scope": "NFHS-6: ~6.8 Lakh households across 715 districts", 
         "output": "In-depth RCH indicators, immunization, nutrition (stunting/wasting), biomarker data",
         "color": C_PURPLE, "fill": "#F5F3FF"},
        {"name": "5. FACILITY HMIS", "inst": "Statistics Division, MoHFW", 
         "nature": "Monthly Routine Facility-Based Aggregated Reporting",
         "scope": ">2.2 Lakh public health facilities (AAMs, PHCs, CHCs, DHs)", 
         "output": "Monthly service delivery: ANC registrations, institutional deliveries, OPD/IPD volumes",
         "color": C_ACCENT, "fill": "#FFFBEB"},
        {"name": "6. OUTBREAK SURVEILLANCE (IHIP)", "inst": "National Centre for Disease Control (NCDC)", 
         "nature": "Near Real-Time Case-Based Digital Disease Outbreak Surveillance",
         "scope": "Nationwide integrated web portal (replaces manual IDSP)", 
         "output": "Syndromic (S-form), Presumptive (P-form), Laboratory (L-form) outbreak signals",
         "color": C_DANGER, "fill": "#FEF2F2"},
    ]

    for i, s in enumerate(systems):
        y = 0.82 - i * 0.14
        rect = patches.FancyBboxPatch((0.04, y), 0.92, 0.12, boxstyle="round,pad=0.02,rounding_size=0.02", 
                                     facecolor=s["fill"], edgecolor=s["color"], lw=2)
        ax.add_patch(rect)
        ax.text(0.06, y + 0.08, s["name"], fontsize=11, fontweight='bold', color=s["color"])
        ax.text(0.34, y + 0.08, f"Nodal Agency: {s['inst']}", fontsize=9.5, fontstyle='italic', color=C_MUTED)
        
        info = f"• Design: {s['nature']}\n• Coverage: {s['scope']}\n• Core Value: {s['output']}"
        ax.text(0.06, y + 0.015, info, fontsize=8.8, color=C_TEXT, va='bottom', linespacing=1.25)

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    save_fig(fig, "ch31_6_health_information_systems_continuum.png")

# ----------------------------------------------------------------------
# 32-1: ABDM 4 Building Blocks & Federated Architecture
# ----------------------------------------------------------------------
def draw_32_1():
    fig, ax = plt.subplots(figsize=(15, 8.5), facecolor=C_BG)
    ax.set_facecolor(C_BG)
    ax.axis('off')
    
    fig.suptitle("Ayushman Bharat Digital Mission (ABDM): 4 Core Building Blocks & Federated Architecture", 
                 fontsize=16.5, fontweight='bold', color=C_PRIMARY, y=0.97)

    def draw_box(x, y, w, h, title, body, fill, border, title_color):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.03,rounding_size=0.03", 
                                     facecolor=fill, edgecolor=border, lw=2.2)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h - 0.04, title, ha='center', va='top', fontsize=11, fontweight='bold', color=title_color)
        ax.text(x + w/2, y + (h - 0.08)/2, body, ha='center', va='center', fontsize=8.8, color=C_TEXT, linespacing=1.3)

    # 4 Building Blocks (Top Row)
    draw_box(0.03, 0.58, 0.22, 0.26, "1. ABHA NUMBER & PHR", 
             "• 14-digit Unique Identity\n• User handle: name@abdm\n• Citizen-linked health history\n• 100% Voluntary enrollment\n• Non-exclusion mandate",
             fill="#EFF6FF", border=C_PRIMARY, title_color=C_PRIMARY)

    draw_box(0.27, 0.58, 0.22, 0.26, "2. PROFESSIONALS (HPR)", 
             "• Healthcare Professionals Registry\n• Modern & AYUSH clinicians\n• Verified registration numbers\n• Direct integration with NMC\n• Telemedicine verified trust",
             fill="#F0FDF4", border=C_SUCCESS, title_color=C_SUCCESS)

    draw_box(0.51, 0.58, 0.22, 0.26, "3. FACILITIES (HFR)", 
             "• Health Facility Registry\n• Public & private hospitals\n• Clinics, labs, pharmacies\n• Geocoded spatial mapping\n• Resource capacity tracking",
             fill="#FFFBEB", border=C_ACCENT, title_color=C_ACCENT)

    draw_box(0.75, 0.58, 0.22, 0.26, "4. UNIFIED INTERFACE (UHI)", 
             "• Open network protocol\n• Interoperable teleconsultations\n• Seamless appointment booking\n• Labs & pharmacy discovery\n• Prevents platform monopoly",
             fill="#F5F3FF", border=C_PURPLE, title_color=C_PURPLE)

    # Convergence Arrows
    for x in [0.14, 0.38, 0.62, 0.86]:
        ax.annotate("", xy=(0.50, 0.44), xytext=(x, 0.58),
                    arrowprops=dict(arrowstyle="-|>", lw=2, color=C_MUTED, mutation_scale=15))

    # Middle Engine: Electronic Consent Manager & Federated HIE
    draw_box(0.18, 0.26, 0.64, 0.18, "ELECTRONIC CONSENT MANAGER & FEDERATED HEALTH INFORMATION EXCHANGE", 
             "• Granular, revocable, time-bound consent managed directly by the citizen via ABHA\n"
             "• NO CENTRAL HEALTH DATA STORAGE: Records stay encrypted at generating facility\n"
             "• Strictly compliant with the Digital Personal Data Protection (DPDP) Act, 2023",
             fill="#F8FAFC", border=C_PRIMARY, title_color=C_PRIMARY)

    # Downward integration arrows
    ax.annotate("", xy=(0.30, 0.16), xytext=(0.38, 0.26), arrowprops=dict(arrowstyle="-|>", lw=2, color=C_SECONDARY, mutation_scale=15))
    ax.annotate("", xy=(0.70, 0.16), xytext=(0.62, 0.26), arrowprops=dict(arrowstyle="-|>", lw=2, color=C_SECONDARY, mutation_scale=15))

    # Bottom Row: Public Programs & Telemedicine
    draw_box(0.08, 0.04, 0.40, 0.12, "eSanjeevani Telemedicine Ecosystem", 
             "• eSanjeevani AB-HWC (Assisted: Spoke AAM to Hub Hospital)\n• eSanjeevani OPD (Direct: Patient smartphone to Clinician)",
             fill="#F0FDFA", border=C_SECONDARY, title_color=C_SECONDARY)

    draw_box(0.52, 0.04, 0.40, 0.12, "National Programmatic Convergence", 
             "• U-WIN (Universal Immunization Registry)\n• Ni-kshay (Tuberculosis Direct Benefit Transfers & Care)\n• PM-JAY (Cashless Inpatient Entitlement Validation)",
             fill="#FEF2F2", border=C_DANGER, title_color=C_DANGER)

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    save_fig(fig, "ch32_1_abdm_architecture.png")

# ----------------------------------------------------------------------
# 32-2: AI & CAD qXR Clinical Screening & Triage Workflow
# ----------------------------------------------------------------------
def draw_32_2():
    fig, ax = plt.subplots(figsize=(15, 8.5), facecolor=C_BG)
    ax.set_facecolor(C_BG)
    ax.axis('off')
    
    fig.suptitle("Artificial Intelligence in Mass Screening: CAD / qXR Triage Workflow (NTEP)", 
                 fontsize=16.5, fontweight='bold', color=C_PRIMARY, y=0.97)

    def draw_step(x, y, w, h, step_num, title, body, fill, border):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.03,rounding_size=0.03", 
                                     facecolor=fill, edgecolor=border, lw=2.2)
        ax.add_patch(rect)
        ax.text(x + 0.015, y + h - 0.04, f"{step_num}. {title}", fontsize=10.5, fontweight='bold', color=C_PRIMARY)
        ax.text(x + 0.015, y + (h - 0.08)/2, body, fontsize=8.5, color=C_TEXT, va='center', linespacing=1.25)

    def draw_arrow(x1, y1, x2, y2, label=""):
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="-|>", lw=2.2, color=C_PRIMARY, mutation_scale=15))
        if label:
            ax.text((x1+x2)/2, (y1+y2)/2 + 0.025, label, ha='center', va='bottom', fontsize=8.5, fontweight='bold', color=C_PRIMARY)

    # Step 1: Active Case Finding / Screening
    draw_step(0.04, 0.65, 0.26, 0.22, "1", "COMMUNITY ENCOUNTER",
              "• High-risk / tribal / peri-urban cohort\n• Mobile Active Case Finding (ACF) Van\n• Ultra-portable battery-powered Digital X-ray\n• Point-of-care CXR acquisition",
              fill="#F8FAFC", border="#94A3B8")

    draw_arrow(0.30, 0.76, 0.38, 0.76, "<15 seconds")

    # Step 2: Edge/Cloud Deep Learning
    draw_step(0.38, 0.65, 0.26, 0.22, "2", "ALGORITHMIC INFERENCE",
              "• Deep Convolutional Neural Network (qXR)\n• Automated bounding box localization\n• Computes Abnormality Probability Score (0-100)\n• Identifies cavities, infiltrates, nodules",
              fill="#EFF6FF", border=C_PRIMARY)

    draw_arrow(0.64, 0.76, 0.72, 0.76)

    # Step 3: Algorithmic Threshold Decision
    draw_step(0.72, 0.65, 0.24, 0.22, "3", "THRESHOLD TRIAGE",
              "• Set clinical cutoff (e.g. Score >= 0.50)\n• High Sensitivity & NPV (>95%)\n• Directs resource-intensive tests\n• Drastically cuts radiologist backlog",
              fill="#F5F3FF", border=C_PURPLE)

    # Branching Arrows
    draw_arrow(0.84, 0.65, 0.84, 0.48, "Score >= Cutoff (Positive)")
    draw_arrow(0.76, 0.65, 0.40, 0.48, "Score < Cutoff (Negative)")

    # Positive Branch (Fast-track Molecular)
    draw_step(0.60, 0.26, 0.36, 0.20, "4A", "RAPID MOLECULAR CONFIRMATION",
              "• Fast-track for CBNAAT / TrueNat molecular testing\n• Universal Drug Susceptibility Testing (UDST) baseline\n• Confirms M. tuberculosis & Rifampicin resistance\n• Immediate notification on Ni-kshay & treatment start",
              fill="#FEF2F2", border=C_DANGER)

    # Negative Branch (Alternate Triage)
    draw_step(0.18, 0.26, 0.36, 0.20, "4B", "SYMPTOMATIC RE-EVALUATION",
              "• Screen for persistent respiratory symptoms\n• Low risk of active pulmonary tuberculosis\n• Alternate clinical workup (asthma, COPD, infection)\n• Prevents unnecessary molecular cartridge wastage",
              fill="#F0FDF4", border=C_SUCCESS)

    # Bottom Governance Bar
    rect_gov = patches.FancyBboxPatch((0.08, 0.05), 0.84, 0.12, boxstyle="round,pad=0.02,rounding_size=0.02",
                                     facecolor="#FFFBEB", edgecolor=C_ACCENT, lw=2)
    ax.add_patch(rect_gov)
    ax.text(0.10, 0.12, "ETHICAL GOVERNANCE & CLINICAL DECISION SUPPORT SYSTEM (CDSS) BOUNDARIES", 
            fontsize=10.5, fontweight='bold', color=C_ACCENT)
    ax.text(0.10, 0.07, 
            "• ICMR Ethical Guidelines: AI serves as Clinical Decision Support, NEVER an autonomous replacement for human clinicians.\n"
            "• Ultimate diagnostic and therapeutic accountability remains with the registered treating medical officer. DPDP Act 2023 data safety.",
            fontsize=8.5, color=C_TEXT)

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    save_fig(fig, "ch32_2_ai_cad_screening_workflow.png")

# ----------------------------------------------------------------------
# 32-3: ICMR i-DRONE Logistics Corridor & Hub-and-Spoke Transport
# ----------------------------------------------------------------------
def draw_32_3():
    fig, ax = plt.subplots(figsize=(15, 8.5), facecolor=C_BG)
    ax.set_facecolor(C_BG)
    ax.axis('off')
    
    fig.suptitle("ICMR i-DRONE Logistics Architecture: Hub-and-Spoke Medical Drone Transport", 
                 fontsize=16.5, fontweight='bold', color=C_PRIMARY, y=0.97)

    def draw_node(x, y, w, h, title, bullets, fill, border, title_color):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.03,rounding_size=0.03", 
                                     facecolor=fill, edgecolor=border, lw=2.2)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h - 0.04, title, ha='center', va='top', fontsize=11, fontweight='bold', color=title_color)
        body = "\n".join([f"• {b}" for b in bullets])
        ax.text(x + w/2, y + (h - 0.08)/2, body, ha='center', va='center', fontsize=8.8, color=C_TEXT, linespacing=1.25)

    # Central Hub
    draw_node(0.04, 0.40, 0.32, 0.44, "CENTRAL SUPPLY HUB\n(District Hospital / Medical College)",
              ["Automated Flight Dispatch via DGCA Digital Sky",
               "Pre-flight battery & avionics diagnostic check",
               "Smart cold-chain packaging (+2°C to +8°C)",
               "Real-time data temperature logging",
               "Priority Payloads Dispatched:",
               "  - Emergency PRBCs / Plasma for PPH/Trauma",
               "  - Polyvalent Anti-Snake Venom (ASV)",
               "  - Routine UIP Vaccine replenishment",
               "  - Anti-rabies immunoglobulins & ARV"],
              fill="#EFF6FF", border=C_PRIMARY, title_color=C_PRIMARY)

    # Flight Corridor (Middle)
    rect_corridor = patches.FancyBboxPatch((0.40, 0.44), 0.20, 0.36, boxstyle="round,pad=0.03,rounding_size=0.03",
                                          facecolor="#F0FDF4", edgecolor=C_SUCCESS, lw=2, ls="--")
    ax.add_patch(rect_corridor)
    ax.text(0.50, 0.74, "BVLOS FLIGHT\nCORRIDOR", ha='center', va='top', fontsize=11, fontweight='bold', color=C_SUCCESS)
    ax.text(0.50, 0.58, 
            "• Beyond Visual Line of Sight\n• Green / Yellow Airspace\n• Geofenced corridor\n• Autonomous GPS transit\n• Fail-safe parachute system\n• Transit time: 15-30 min\n  (vs 4-8 hrs by road)",
            ha='center', va='center', fontsize=8.5, color=C_TEXT, linespacing=1.25)

    # Forward Arrow (Supplies)
    ax.annotate("", xy=(0.40, 0.66), xytext=(0.36, 0.66),
                arrowprops=dict(arrowstyle="-|>", lw=2.5, color=C_PRIMARY, mutation_scale=15))
    ax.annotate("", xy=(0.64, 0.66), xytext=(0.60, 0.66),
                arrowprops=dict(arrowstyle="-|>", lw=2.5, color=C_PRIMARY, mutation_scale=15))
    ax.text(0.50, 0.81, "FORWARD SUPPLY LOGISTICS", ha='center', fontsize=8.5, fontweight='bold', color=C_PRIMARY)

    # Reverse Arrow (Diagnostics)
    ax.annotate("", xy=(0.36, 0.48), xytext=(0.40, 0.48),
                arrowprops=dict(arrowstyle="-|>", lw=2.5, color=C_ACCENT, mutation_scale=15))
    ax.annotate("", xy=(0.60, 0.48), xytext=(0.64, 0.48),
                arrowprops=dict(arrowstyle="-|>", lw=2.5, color=C_ACCENT, mutation_scale=15))
    ax.text(0.50, 0.40, "REVERSE DIAGNOSTIC LOGISTICS", ha='center', fontsize=8.5, fontweight='bold', color=C_ACCENT)

    # Peripheral Spoke
    draw_node(0.64, 0.40, 0.32, 0.44, "PERIPHERAL SPOKE\n(Remote PHC / Island / Cut-off AAM)",
              ["Designated GPS-fenced Landing Zone (LZ)",
               "Trained community ground handler extraction",
               "Immediate temperature verification stamp",
               "Immediate clinical administration to patient",
               "Reverse Transport Payload:",
               "  - Sputum cups for TB CBNAAT / TrueNat",
               "  - Blood smears for Malaria microscopy",
               "  - Water samples for bacteriological testing",
               "  - Viral transport media (Nipah, Dengue)"],
              fill="#FFFBEB", border=C_ACCENT, title_color=C_ACCENT)

    # Bottom Specifications Box
    rect_spec = patches.FancyBboxPatch((0.08, 0.06), 0.84, 0.24, boxstyle="round,pad=0.03,rounding_size=0.03",
                                      facecolor="#FFFFFF", edgecolor=C_BORDER, lw=2)
    ax.add_patch(rect_spec)
    ax.text(0.10, 0.26, "TECHNICAL SPECIFICATIONS & VALIDATION STANDARDS (ICMR i-DRONE GUIDELINES)", 
            fontsize=10.5, fontweight='bold', color=C_PRIMARY)
    ax.text(0.10, 0.15,
            "1. Platform Architecture: Hybrid VTOL (Vertical Takeoff and Landing) combining multirotor lift with fixed-wing cruising.\n"
            "2. Payload Capacity: 3 to 5 kg insulated smart container maintaining +2°C to +8°C with phase-change cold packs.\n"
            "3. Biochemical Stability: ICMR validation demonstrated zero hemolysis, intact blood cellular morphology, and preserved vaccine titer.\n"
            "4. Biological Safety: Compliant with WHO / IATA Category B (UN 3373) triple packaging standards for infectious substances.",
            fontsize=8.5, color=C_TEXT, linespacing=1.3)

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    save_fig(fig, "ch32_3_idrone_logistics_model.png")

# ----------------------------------------------------------------------
# 32-4: Adult Immunization Schedule Framework
# ----------------------------------------------------------------------
def draw_32_4():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8), facecolor=C_BG)
    fig.suptitle("Adult Immunization: Life-Course Schedule & Sequential Pneumococcal Algorithm", 
                 fontsize=16.5, fontweight='bold', color=C_PRIMARY, y=0.98)

    # Left: High Priority Vaccines Matrix
    ax1.set_facecolor(C_CARD)
    ax1.axis('off')
    ax1.set_title("Core Adult Vaccination Priorities (API / ACIP Guidelines)", fontsize=12.5, fontweight='bold', color=C_PRIMARY, pad=12)

    vaccines = [
        ("Influenza (Quadrivalent)", "All adults >=65y, pregnant women, healthcare personnel, chronic NCDs", "Annual single dose (0.5 mL IM) before winter peak"),
        ("Td / Tdap Booster", "All adults (Tdap once in adulthood, followed by Td decennial)", "Every 10 years; substitute Tdap once for pertussis immunity"),
        ("Recombinant Zoster (Shingrix)", "Adults >=50y, immunocompromised >=19y (Non-live recombinant)", "2 doses spaced 2-6 months apart (0.5 mL IM)"),
        ("Human Papillomavirus (HPV)", "Females & males aged 9-26y (catch-up to 45y on clinical decision)", "3 doses: 0, 1-2, 6 months (2 doses if started <15y)"),
        ("Hepatitis B Recombinant", "Healthcare workers, chronic liver disease, hemodialysis", "Standard: 0, 1, 6 months (Dialysis: Double dose 40mcg at 0,1,2,6m)"),
        ("Typhoid Conjugate (TCV)", "Food handlers, wastewater workers, laboratory staff", "Single dose (0.5 mL IM); confers durable T-cell immunity")
    ]

    for i, (vname, pop, sched) in enumerate(vaccines):
        y = 0.88 - i * 0.155
        rect = patches.FancyBboxPatch((0.02, y), 0.96, 0.13, boxstyle="round,pad=0.02,rounding_size=0.02",
                                     facecolor="#F8FAFC", edgecolor=C_PRIMARY if i%2==0 else C_SECONDARY, lw=1.8)
        ax1.add_patch(rect)
        ax1.text(0.04, y + 0.085, vname, fontsize=10, fontweight='bold', color=C_PRIMARY)
        ax1.text(0.04, y + 0.045, f"Target: {pop}", fontsize=8.2, color=C_TEXT)
        ax1.text(0.04, y + 0.015, f"Schedule: {sched}", fontsize=8.2, fontweight='bold', color=C_SUCCESS)

    ax1.set_xlim(0, 1)
    ax1.set_ylim(0, 1)

    # Right: Sequential Pneumococcal Protocol
    ax2.set_facecolor(C_CARD)
    ax2.axis('off')
    ax2.set_title("Sequential Pneumococcal Vaccination Algorithm", fontsize=12.5, fontweight='bold', color=C_PRIMARY, pad=12)

    def draw_p_box(x, y, w, h, title, body, fill, border):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.03,rounding_size=0.03",
                                     facecolor=fill, edgecolor=border, lw=2.2)
        ax2.add_patch(rect)
        ax2.text(x + w/2, y + h - 0.05, title, ha='center', va='top', fontsize=11, fontweight='bold', color=border)
        ax2.text(x + w/2, y + (h - 0.09)/2, body, ha='center', va='center', fontsize=9, color=C_TEXT, linespacing=1.3)

    draw_p_box(0.15, 0.78, 0.70, 0.16, "STEP 1: PRIMING CONJUGATE VACCINE",
               "Administer PCV13, PCV15, or PCV20 (0.5 mL IM deltoid)\n"
               "• Establishes robust T-cell dependent mucosal immunity\n"
               "• Indicated for adults >=65y, Asplenia, CKD, or Immunocompromised",
               fill="#EFF6FF", border=C_PRIMARY)

    ax2.annotate("", xy=(0.50, 0.62), xytext=(0.50, 0.78),
                 arrowprops=dict(arrowstyle="-|>", lw=2.5, color=C_PRIMARY, mutation_scale=15))
    ax2.text(0.52, 0.70, "MANDATORY TIME INTERVAL", fontsize=9, fontweight='bold', color=C_PRIMARY)

    # Split Intervals (Immunocompromised vs Immunocompetent)
    rect_int = patches.FancyBboxPatch((0.10, 0.44), 0.80, 0.18, boxstyle="round,pad=0.03,rounding_size=0.03",
                                     facecolor="#FFFBEB", edgecolor=C_ACCENT, lw=2)
    ax2.add_patch(rect_int)
    ax2.text(0.50, 0.58, "CRITICAL TIMING INTERVAL BEFORE POLYSACCHARIDE VACCINE", ha='center', fontsize=9.5, fontweight='bold', color=C_ACCENT)
    ax2.text(0.50, 0.49, 
             "• High-Risk / Immunocompromised / Asplenia / CSF Leak: WAIT AT LEAST 8 WEEKS\n"
             "• Immunocompetent Adults (Age >= 65 years): WAIT AT LEAST 1 YEAR\n"
             "(Never administer PCV and PPSV23 simultaneously: causes immune hyporesponsiveness)",
             ha='center', fontsize=8.5, color=C_TEXT, linespacing=1.25)

    ax2.annotate("", xy=(0.50, 0.28), xytext=(0.50, 0.44),
                 arrowprops=dict(arrowstyle="-|>", lw=2.5, color=C_SUCCESS, mutation_scale=15))

    draw_p_box(0.15, 0.10, 0.70, 0.18, "STEP 2: POLYSACCHARIDE BROADENING",
               "Administer PPSV23 (Pneumovax 23 - 0.5 mL IM/SC)\n"
               "• Expands serotype coverage to 23 capsular polysaccharides\n"
               "• Booster recommendation: Single revaccination after 5 years\n"
               "  for asplenia, chronic renal failure, and immunocompromised states",
               fill="#F0FDF4", border=C_SUCCESS)

    ax2.set_xlim(0, 1)
    ax2.set_ylim(0, 1)

    plt.tight_layout()
    save_fig(fig, "ch32_4_adult_immunization_framework.png")

# ----------------------------------------------------------------------
# 32-5: Biosafety Levels (BSL-1 to 4) & CDC Bioterrorism Agents
# ----------------------------------------------------------------------
def draw_32_5():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8), facecolor=C_BG)
    fig.suptitle("Biosafety Containment Hierarchy (BSL-1 to BSL-4) & Bioterrorism Threat Agents", 
                 fontsize=16.5, fontweight='bold', color=C_PRIMARY, y=0.98)

    # Left: BSL Hierarchy Pyramid
    ax1.set_facecolor(C_CARD)
    ax1.axis('off')
    ax1.set_title("Biosafety Containment Levels (BSL-1 to BSL-4)", fontsize=12.5, fontweight='bold', color=C_PRIMARY, pad=12)

    bsl_tiers = [
        {"lvl": "BSL-4 (Maximum Containment)", "desc": "Dangerous/exotic agents with high fatal aerosol transmission & NO treatment/vaccine\nEngineering: Full-body positive pressure suit or Class III glove box, airlock shower, double HEPA\nExamples: Ebola, Marburg, Variola (Smallpox), Crimean-Congo HF (NIV Pune BSL-4)", 
         "fill": "#FEE2E2", "border": C_DANGER, "w": 0.55, "y": 0.74, "h": 0.18},
        {"lvl": "BSL-3 (High Containment)", "desc": "Indigenous or exotic agents causing severe/lethal aerosol disease\nEngineering: Negative directional airflow, double-door entry, sealed HEPA exhaust\nExamples: M. tuberculosis, Bacillus anthracis, SARS-CoV-2, Yellow fever virus", 
         "fill": "#FEF3C7", "border": C_ACCENT, "w": 0.68, "y": 0.50, "h": 0.20},
        {"lvl": "BSL-2 (Moderate Containment)", "desc": "Agents causing moderate human disease via percutaneous, ingestion, or splash exposure\nEngineering: Class I/II Biosafety Cabinets, autoclave on-site, biohazard warning signs\nExamples: Hepatitis B, HIV, Salmonella, Vibrio cholerae, Plasmodium spp.", 
         "fill": "#EFF6FF", "border": C_PRIMARY, "w": 0.82, "y": 0.26, "h": 0.20},
        {"lvl": "BSL-1 (Basic Containment)", "desc": "Well-characterized agents not known to cause disease in healthy immunocompetent adults\nEngineering: Standard open benchwork, sink for handwashing, standard personal PPE\nExamples: Bacillus subtilis, non-pathogenic E. coli, standard yeast cultures", 
         "fill": "#F0FDF4", "border": C_SUCCESS, "w": 0.94, "y": 0.04, "h": 0.18},
    ]

    for t in bsl_tiers:
        x = (1.0 - t["w"]) / 2
        rect = patches.FancyBboxPatch((x, t["y"]), t["w"], t["h"], boxstyle="round,pad=0.02,rounding_size=0.02",
                                     facecolor=t["fill"], edgecolor=t["border"], lw=2.2)
        ax1.add_patch(rect)
        ax1.text(0.50, t["y"] + t["h"] - 0.035, t["lvl"], ha='center', va='top', fontsize=10.5, fontweight='bold', color=t["border"])
        ax1.text(0.50, t["y"] + (t["h"] - 0.06)/2, t["desc"], ha='center', va='center', fontsize=8.2, color=C_TEXT, linespacing=1.2)

    ax1.set_xlim(0, 1)
    ax1.set_ylim(0, 1)

    # Right: CDC Bioterrorism Categorization
    ax2.set_facecolor(C_CARD)
    ax2.axis('off')
    ax2.set_title("CDC Classification of Bioterrorism Agents", fontsize=12.5, fontweight='bold', color=C_PRIMARY, pad=12)

    cats = [
        {"cat": "CATEGORY A: HIGHEST PRIORITY (THE BIG SIX)", 
         "char": "Easily disseminated or transmitted person-to-person; high mortality rates; mass panic potential; mandates dedicated national stockpiles",
         "agents": "1. Bacillus anthracis (Inhalational Anthrax - 60d Cipro/Doxy)\n2. Clostridium botulinum toxin (Botulism - HBAT antitoxin)\n3. Yersinia pestis (Pneumonic Plague - Droplet isolation)\n4. Variola major (Smallpox - Ring vaccination)\n5. Francisella tularensis (Tularemia)\n6. Viral Hemorrhagic Fevers (Ebola, Marburg, Lassa)",
         "fill": "#FEF2F2", "border": C_DANGER},
        {"cat": "CATEGORY B: SECOND HIGHEST PRIORITY", 
         "char": "Moderately easy to disseminate; moderate morbidity and low mortality; requires specialized diagnostic laboratory enhancements",
         "agents": "• Brucella species (Brucellosis)  • Coxiella burnetii (Q fever)\n• Chlamydia psittaci  • Ricin toxin from Ricinus communis\n• Food-borne: Salmonella, Shigella, E. coli O157:H7\n• Water-borne: Vibrio cholerae, Cryptosporidium parvum",
         "fill": "#FFFBEB", "border": C_ACCENT},
        {"cat": "CATEGORY C: THIRD HIGHEST PRIORITY (EMERGING)", 
         "char": "Emerging engineered pathogens; readily available with potential for high morbidity and mortality; demands molecular surveillance",
         "agents": "• Nipah virus and Hendra virus  • Hantaviruses\n• Multi-drug resistant Tuberculosis (MDR-TB)\n• Pandemic-potential novel Coronaviruses and Influenza",
         "fill": "#EFF6FF", "border": C_PRIMARY},
    ]

    for i, c in enumerate(cats):
        y = 0.68 - i * 0.31
        h = 0.28 if i == 0 else 0.23
        rect = patches.FancyBboxPatch((0.03, y), 0.94, h, boxstyle="round,pad=0.03,rounding_size=0.03",
                                     facecolor=c["fill"], edgecolor=c["border"], lw=2.2)
        ax2.add_patch(rect)
        ax2.text(0.06, y + h - 0.035, c["cat"], fontsize=10.5, fontweight='bold', color=c["border"])
        ax2.text(0.06, y + h - 0.075, f"Impact: {c['char']}", fontsize=8.2, fontstyle='italic', color=C_MUTED)
        ax2.text(0.06, y + 0.025, c["agents"], fontsize=8.5, color=C_TEXT, va='bottom', linespacing=1.2)

    ax2.set_xlim(0, 1)
    ax2.set_ylim(0, 1)

    plt.tight_layout()
    save_fig(fig, "ch32_5_biosafety_levels_bioterrorism.png")

# ----------------------------------------------------------------------
# 32-6: One Health Framework & WHO AWaRe Classification
# ----------------------------------------------------------------------
def draw_32_6():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8), facecolor=C_BG)
    fig.suptitle("One Health Framework (NAP-AMR 2.0) & WHO AWaRe Antibiotic Stewardship", 
                 fontsize=16.5, fontweight='bold', color=C_PRIMARY, y=0.98)

    # Left: One Health Triad
    ax1.set_facecolor(C_CARD)
    ax1.axis('off')
    ax1.set_title("One Health Antimicrobial Resistance Ecosystem", fontsize=12.5, fontweight='bold', color=C_PRIMARY, pad=12)

    # 3 Intersecting Circles
    c_human = patches.Circle((0.35, 0.62), 0.24, facecolor="#3B82F6", alpha=0.35, edgecolor=C_PRIMARY, lw=2.5)
    c_animal = patches.Circle((0.65, 0.62), 0.24, facecolor="#10B981", alpha=0.35, edgecolor=C_SUCCESS, lw=2.5)
    c_env = patches.Circle((0.50, 0.36), 0.24, facecolor="#F59E0B", alpha=0.35, edgecolor=C_ACCENT, lw=2.5)
    ax1.add_patch(c_human)
    ax1.add_patch(c_animal)
    ax1.add_patch(c_env)

    ax1.text(0.26, 0.72, "HUMAN HEALTH\n• Over-prescription\n• Incomplete courses\n• Hospital HAIs\n• Lack of AMSP", 
             fontsize=9, fontweight='bold', color=C_PRIMARY, ha='center')
    ax1.text(0.74, 0.72, "ANIMAL & AQUA\n• Growth promotion\n• Metaphylaxis\n• Unchecked OTC sales\n• Colistin in poultry", 
             fontsize=9, fontweight='bold', color=C_SUCCESS, ha='center')
    ax1.text(0.50, 0.22, "ENVIRONMENT\n• Pharma manufacturing effluent\n• Agricultural runoff into rivers\n• Untreated hospital sewage", 
             fontsize=9, fontweight='bold', color=C_ACCENT, ha='center')

    ax1.text(0.50, 0.53, "ONE HEALTH\nNAP-AMR 2.0\nNEXUS", ha='center', va='center', fontsize=10.5, fontweight='bold', color=C_TEXT,
             bbox=dict(boxstyle="round,pad=0.3", fc="#FFFFFF", ec=C_TEXT, lw=1.5))

    # Bottom 6 priorities
    rect_pri = patches.FancyBboxPatch((0.05, 0.02), 0.90, 0.12, boxstyle="round,pad=0.02,rounding_size=0.02",
                                     facecolor="#F8FAFC", edgecolor=C_BORDER, lw=1.5)
    ax1.add_patch(rect_pri)
    ax1.text(0.50, 0.08, "NAP-AMR 2.0 (2025-2029) 6 STRATEGIC PILLARS", ha='center', fontsize=9.5, fontweight='bold', color=C_PRIMARY)
    ax1.text(0.50, 0.035, "1. Awareness & Training  2. Laboratory Surveillance  3. Infection Prevention (IPC/WASH)\n4. Antimicrobial Stewardship  5. Research & Diagnostics  6. Intersectoral Governance",
             ha='center', fontsize=8, color=C_TEXT)

    ax1.set_xlim(0, 1)
    ax1.set_ylim(0, 1)

    # Right: WHO AWaRe Classification
    ax2.set_facecolor(C_CARD)
    ax2.axis('off')
    ax2.set_title("WHO AWaRe Antibiotic Classification & Target Consumption", fontsize=12.5, fontweight='bold', color=C_PRIMARY, pad=12)

    aware_groups = [
        {"group": "ACCESS GROUP (>=60% of Total National Consumption)",
         "desc": "First- and second-choice narrow-spectrum antibiotics for common clinical infections.\nHigh therapeutic value with lowest potential for inducing microbial resistance.",
         "examples": "Amoxicillin, Ampicillin, Cefazolin, Doxycycline, Co-trimoxazole, Gentamicin, Metronidazole",
         "target": "TARGET: >= 60% of all national antibiotic consumption",
         "fill": "#DCFCE7", "border": C_SUCCESS},
        {"group": "WATCH GROUP (Monitor and Restrict)",
         "desc": "Critically important broad-spectrum antimicrobials with higher potential for resistance.\nSubject to rigorous hospital prescription monitoring and institutional stewardship auditing.",
         "examples": "Fluoroquinolones (Ciprofloxacin, Levofloxacin), 3rd Gen Cephalosporins (Ceftriaxone), Macrolides (Azithromycin), Carbapenems (Meropenem)",
         "target": "RESTRICTION: Target for significant consumption reduction",
         "fill": "#FEF3C7", "border": C_ACCENT},
        {"group": "RESERVE GROUP (Last-Resort Protected Antimicrobials)",
         "desc": "Last-resort life-saving options reserved strictly for confirmed multi-drug resistant (MDR) pathogens.\nAccessible ONLY through authorized infectious disease specialist approval and institutional logging.",
         "examples": "Colistin, Polymyxin B, Linezolid, Daptomycin, Ceftazidime-Avibactam, Tigecycline",
         "target": "PROTECTION: Dedicated stewardship, zero empiric usage",
         "fill": "#FEE2E2", "border": C_DANGER},
    ]

    for i, g in enumerate(aware_groups):
        y = 0.68 - i * 0.31
        rect = patches.FancyBboxPatch((0.04, y), 0.92, 0.28, boxstyle="round,pad=0.03,rounding_size=0.03",
                                     facecolor=g["fill"], edgecolor=g["border"], lw=2.2)
        ax2.add_patch(rect)
        ax2.text(0.07, y + 0.23, g["group"], fontsize=10.5, fontweight='bold', color=g["border"])
        ax2.text(0.07, y + 0.16, g["desc"], fontsize=8.2, color=C_TEXT, linespacing=1.2)
        ax2.text(0.07, y + 0.08, f"Key Agents: {g['examples']}", fontsize=8.2, fontweight='bold', color=C_TEXT)
        ax2.text(0.07, y + 0.025, g["target"], fontsize=8.5, fontweight='bold', color=g["border"])

    ax2.set_xlim(0, 1)
    ax2.set_ylim(0, 1)

    plt.tight_layout()
    save_fig(fig, "ch32_6_nap_amr_aware_one_health.png")

# ----------------------------------------------------------------------
# 32-7: GIS Spatial Buffering & Thematic Layer Disease Mapping
# ----------------------------------------------------------------------
def draw_32_7():
    fig, ax = plt.subplots(figsize=(15, 8.5), facecolor=C_BG)
    ax.set_facecolor(C_BG)
    ax.axis('off')
    
    fig.suptitle("Geographic Information Systems (GIS): Spatial Thematic Layers & Buffer Analysis", 
                 fontsize=16.5, fontweight='bold', color=C_PRIMARY, y=0.97)

    def draw_layer_slice(y, title, desc, tag, fill, border, tag_color):
        rect = patches.FancyBboxPatch((0.10, y), 0.80, 0.13, boxstyle="round,pad=0.02,rounding_size=0.02",
                                     facecolor=fill, edgecolor=border, lw=2.2)
        ax.add_patch(rect)
        ax.text(0.12, y + 0.085, title, fontsize=11, fontweight='bold', color=tag_color)
        ax.text(0.12, y + 0.025, desc, fontsize=8.8, color=C_TEXT, va='bottom')
        ax.text(0.88, y + 0.085, tag, fontsize=9.5, fontweight='bold', color=tag_color, ha='right')

    # 5 Layers from bottom (environment) to top (intervention)
    draw_layer_slice(0.70, "LAYER 5: GEOPROCESSING & INTERVENTION BUFFER", 
                     "Generating 500m & 1,000m vector flight buffers around breeding hot-spots; targeted larvicide & indoor residual spraying (IRS)",
                     "DECISION SUPPORT", "#FEF2F2", C_DANGER, C_DANGER)

    draw_layer_slice(0.54, "LAYER 4: GEOCODED EPIDEMIOLOGICAL INCIDENCE", 
                     "Case-based georeferenced Dengue & Malaria point coordinates; automated spatial kernel density estimation & cluster heatmaps",
                     "POINT / INCIDENCE", "#FFFBEB", C_ACCENT, C_ACCENT)

    draw_layer_slice(0.38, "LAYER 3: HEALTH INFRASTRUCTURE & SETTLEMENTS", 
                     "Spatial point layer of Ayushman Arogya Mandirs, Primary Health Centres, Community Health Centres, and village habitations",
                     "FACILITY ASSETS", "#F5F3FF", C_PURPLE, C_PURPLE)

    draw_layer_slice(0.22, "LAYER 2: HYDROLOGY & VECTOR BREEDING ECOLOGY", 
                     "Vector polygon layer mapping stagnant water bodies, drainage networks, irrigation canals, and peri-domestic breeding sites",
                     "HYDROLOGY / VECTOR", "#EFF6FF", C_PRIMARY, C_PRIMARY)

    draw_layer_slice(0.06, "LAYER 1: SATELLITE REMOTE SENSING (BASE LAYER)", 
                     "Raster imagery of Normalized Difference Vegetation Index (NDVI), Land Surface Temperature (LST), elevation (DEM), and rainfall",
                     "ENVIRONMENTAL RASTER", "#F0FDF4", C_SUCCESS, C_SUCCESS)

    # Side bracket / arrows indicating overlay
    ax.annotate("", xy=(0.06, 0.80), xytext=(0.06, 0.08),
                arrowprops=dict(arrowstyle="->", lw=3, color=C_PRIMARY, mutation_scale=20))
    ax.text(0.035, 0.44, "SPATIAL DATA INTEGRATION & OVERLAY ANALYSIS", 
            fontsize=10, fontweight='bold', color=C_PRIMARY, rotation=90, va='center', ha='center')

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    save_fig(fig, "ch32_7_gis_thematic_layers_buffering.png")

# ----------------------------------------------------------------------
# 32-8: PRISMA 2020 Flow Diagram & ROC Curve Geometry
# ----------------------------------------------------------------------
def draw_32_8():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8), facecolor=C_BG)
    fig.suptitle("Methodological Rigor: PRISMA 2020 Flow Diagram & ROC Curve Geometry", 
                 fontsize=16.5, fontweight='bold', color=C_PRIMARY, y=0.98)

    # Left: PRISMA 2020
    ax1.set_facecolor(C_CARD)
    ax1.axis('off')
    ax1.set_title("PRISMA 2020 Flow Diagram for Systematic Reviews", fontsize=12.5, fontweight='bold', color=C_PRIMARY, pad=12)

    def draw_prisma_box(y, stage, text, n_str, fill, border):
        rect = patches.FancyBboxPatch((0.04, y), 0.92, 0.16, boxstyle="round,pad=0.02,rounding_size=0.02",
                                     facecolor=fill, edgecolor=border, lw=2)
        ax1.add_patch(rect)
        ax1.text(0.07, y + 0.12, stage, fontsize=10.5, fontweight='bold', color=border)
        ax1.text(0.07, y + 0.04, text, fontsize=8.5, color=C_TEXT, linespacing=1.2)
        ax1.text(0.92, y + 0.12, n_str, fontsize=9.5, fontweight='bold', color=border, ha='right')

    draw_prisma_box(0.76, "1. IDENTIFICATION", 
                    "Records identified from electronic databases (PubMed, Embase, Cochrane)\nRecords identified from trial registries and grey literature", 
                    "Records (n = 3,450)", "#EFF6FF", C_PRIMARY)

    ax1.annotate("", xy=(0.50, 0.69), xytext=(0.50, 0.76),
                 arrowprops=dict(arrowstyle="-|>", lw=2, color=C_PRIMARY, mutation_scale=12))

    draw_prisma_box(0.53, "2. SCREENING", 
                    "Duplicates removed (n = 850)\nTitles and abstracts screened against eligibility criteria (Excluded n = 2,240)", 
                    "Screened (n = 2,600)", "#FFFBEB", C_ACCENT)

    ax1.annotate("", xy=(0.50, 0.46), xytext=(0.50, 0.53),
                 arrowprops=dict(arrowstyle="-|>", lw=2, color=C_ACCENT, mutation_scale=12))

    draw_prisma_box(0.30, "3. ELIGIBILITY", 
                    "Full-text reports assessed for eligibility in duplicate\nFull-text excluded with explicit clinical reasons recorded (n = 286)", 
                    "Retrieved (n = 360)", "#F5F3FF", C_PURPLE)

    ax1.annotate("", xy=(0.50, 0.23), xytext=(0.50, 0.30),
                 arrowprops=dict(arrowstyle="-|>", lw=2, color=C_PURPLE, mutation_scale=12))

    draw_prisma_box(0.06, "4. INCLUDED", 
                    "Eligible studies included in qualitative systematic review synthesis (n = 74)\nHigh-homogeneity studies included in quantitative Meta-Analysis (Forest plot)", 
                    "Included (n = 74)", "#F0FDF4", C_SUCCESS)

    ax1.set_xlim(0, 1)
    ax1.set_ylim(0, 1)

    # Right: ROC Curve Geometry
    ax2.set_facecolor(C_CARD)
    fpr = np.linspace(0, 1, 200)
    # Excellent test (AUC = 0.92)
    tpr_exc = np.sqrt(fpr) * 0.7 + (1 - np.exp(-5 * fpr)) * 0.3
    tpr_exc = np.clip(tpr_exc, 0, 1)
    
    # Moderate test (AUC = 0.75)
    tpr_mod = fpr**0.55

    ax2.plot(fpr, tpr_exc, color=C_PRIMARY, lw=3, label="Excellent Diagnostic Test (AUC = 0.92)")
    ax2.plot(fpr, tpr_mod, color=C_ACCENT, lw=2.5, ls="--", label="Moderate Diagnostic Test (AUC = 0.75)")
    ax2.plot([0, 1], [0, 1], color=C_MUTED, lw=1.8, ls=":", label="Chance Line / No Discrimination (AUC = 0.50)")

    # Highlight Youden's Index
    idx_opt = 35
    ax2.scatter(fpr[idx_opt], tpr_exc[idx_opt], color=C_DANGER, s=90, zorder=5)
    ax2.plot([fpr[idx_opt], fpr[idx_opt]], [fpr[idx_opt], tpr_exc[idx_opt]], color=C_DANGER, lw=2, ls="-.")
    
    ax2.annotate("Optimal Cut-off Point (Youden's J):\nMax Vertical Distance to Chance Line\nJ = Sensitivity + Specificity - 1", 
                 xy=(fpr[idx_opt], tpr_exc[idx_opt]), xytext=(fpr[idx_opt]+0.15, tpr_exc[idx_opt]-0.20),
                 arrowprops=dict(facecolor=C_DANGER, shrink=0.08, width=1.5, headwidth=6),
                 fontsize=9, fontweight='bold', color=C_DANGER,
                 bbox=dict(boxstyle="round,pad=0.3", fc="#FEF2F2", ec=C_DANGER, lw=1.2))

    ax2.set_xlim(-0.02, 1.02)
    ax2.set_ylim(-0.02, 1.02)
    ax2.set_xlabel("1 - Specificity (False Positive Rate)", fontsize=11, fontweight='bold', color=C_TEXT)
    ax2.set_ylabel("Sensitivity (True Positive Rate)", fontsize=11, fontweight='bold', color=C_TEXT)
    ax2.set_title("Receiver Operating Characteristic (ROC) Geometry", fontsize=12.5, fontweight='bold', color=C_PRIMARY, pad=12)
    ax2.legend(loc='lower right', fontsize=9, framealpha=0.95)
    ax2.grid(True, ls='--', alpha=0.3)

    plt.tight_layout()
    save_fig(fig, "ch32_8_prisma_roc_geometry.png")

# ----------------------------------------------------------------------
# 32-9: Miller's Pyramid & Family Adoption Programme Timeline
# ----------------------------------------------------------------------
def draw_32_9():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8), facecolor=C_BG)
    fig.suptitle("CBME in Community Medicine: Miller's Pyramid & Family Adoption Programme (FAP)", 
                 fontsize=16.5, fontweight='bold', color=C_PRIMARY, y=0.98)

    # Left: Miller's Pyramid
    ax1.set_facecolor(C_CARD)
    ax1.axis('off')
    ax1.set_title("Miller's Pyramid of Clinical Competence", fontsize=12.5, fontweight='bold', color=C_PRIMARY, pad=12)

    tiers = [
        {"lvl": "DOES (Action)", "sub": "Authentic Community & Clinical Practice", 
         "eval": "Assessment: Direct observation in field, FAP logbook, clinical audits",
         "w": 0.38, "y": 0.74, "h": 0.18, "fill": "#DCFCE7", "border": C_SUCCESS},
        {"lvl": "SHOWS HOW (Performance)", "sub": "Clinical Competence Demonstration", 
         "eval": "Assessment: OSCE, OSPE, simulation scenarios, health talk demonstrations",
         "w": 0.56, "y": 0.50, "h": 0.20, "fill": "#EFF6FF", "border": C_PRIMARY},
        {"lvl": "KNOWS HOW (Applied Knowledge)", "sub": "Clinical Problem-Solving & Reasoning", 
         "eval": "Assessment: Clinical case vignettes, problem-based exercises, epidemiologic data",
         "w": 0.74, "y": 0.26, "h": 0.20, "fill": "#FEF3C7", "border": C_ACCENT},
        {"lvl": "KNOWS (Fact Knowledge)", "sub": "Basic Factual Recall & Comprehension", 
         "eval": "Assessment: Multiple-choice questions (MCQs), traditional viva voce, short answers",
         "w": 0.92, "y": 0.04, "h": 0.18, "fill": "#F1F5F9", "border": C_MUTED},
    ]

    for t in tiers:
        x = (1.0 - t["w"]) / 2
        rect = patches.FancyBboxPatch((x, t["y"]), t["w"], t["h"], boxstyle="round,pad=0.02,rounding_size=0.02",
                                     facecolor=t["fill"], edgecolor=t["border"], lw=2.2)
        ax1.add_patch(rect)
        ax1.text(0.50, t["y"] + t["h"] - 0.035, t["lvl"], ha='center', va='top', fontsize=11, fontweight='bold', color=t["border"])
        ax1.text(0.50, t["y"] + t["h"] - 0.08, t["sub"], ha='center', va='top', fontsize=8.5, fontstyle='italic', color=C_TEXT)
        ax1.text(0.50, t["y"] + 0.025, t["eval"], ha='center', va='bottom', fontsize=8, color=C_MUTED)

    ax1.set_xlim(0, 1)
    ax1.set_ylim(0, 1)

    # Right: Family Adoption Programme (FAP) Timeline
    ax2.set_facecolor(C_CARD)
    ax2.axis('off')
    ax2.set_title("NMC Family Adoption Programme (FAP): 3-Year Cadence", fontsize=12.5, fontweight='bold', color=C_PRIMARY, pad=12)

    fap_stages = [
        {"prof": "1st MBBS (Phase I - Community Immersion)", 
         "cohort": "3 to 5 rural / peri-urban families assigned per medical student",
         "tasks": "• Initial introductory visit, rapport building, ethical consent\n• Socio-demographic profiling (Udani / Prasad BG scale)\n• Environmental health audit (housing, water, sanitation, waste)\n• Nutritional intake assessment & dietary counselling",
         "fill": "#EFF6FF", "border": C_PRIMARY},
        {"prof": "2nd MBBS (Phase II - Longitudinal RCH Follow-up)", 
         "cohort": "Continuous longitudinal mentorship of adopted families",
         "tasks": "• Maternal health tracking: Antenatal care, IFA consumption, PMSMA\n• Under-5 growth monitoring: Plotting WHO growth charts, immunization check\n• Adolescent guidance & lifestyle counseling\n• Health education sessions on hygiene and vector control",
         "fill": "#FFFBEB", "border": C_ACCENT},
        {"prof": "3rd MBBS (Phase III - NCD Screening & Graduation)", 
         "cohort": "Chronic disease management and palliative handoff",
         "tasks": "• Population-based screening: Blood pressure, capillary blood glucose\n• Linkage to Ayushman Arogya Mandir (AAM) & specialist referral\n• Geriatric palliative support & disability management\n• Final comprehensive community logbook defense & viva",
         "fill": "#F0FDF4", "border": C_SUCCESS},
    ]

    for i, s in enumerate(fap_stages):
        y = 0.68 - i * 0.31
        rect = patches.FancyBboxPatch((0.04, y), 0.92, 0.28, boxstyle="round,pad=0.03,rounding_size=0.03",
                                     facecolor=s["fill"], edgecolor=s["border"], lw=2.2)
        ax2.add_patch(rect)
        ax2.text(0.07, y + 0.23, s["prof"], fontsize=10.5, fontweight='bold', color=s["border"])
        ax2.text(0.07, y + 0.17, s["cohort"], fontsize=8.5, fontstyle='italic', color=C_MUTED)
        ax2.text(0.07, y + 0.025, s["tasks"], fontsize=8.5, color=C_TEXT, va='bottom', linespacing=1.25)

    ax2.set_xlim(0, 1)
    ax2.set_ylim(0, 1)

    plt.tight_layout()
    save_fig(fig, "ch32_9_millers_pyramid_fap_timeline.png")

# ----------------------------------------------------------------------
# 32-10: Healthcare Carbon Footprint (Scopes 1, 2, 3)
# ----------------------------------------------------------------------
def draw_32_10():
    fig, ax = plt.subplots(figsize=(15, 8.5), facecolor=C_BG)
    ax.set_facecolor(C_BG)
    ax.axis('off')
    
    fig.suptitle("Healthcare Decarbonization: Greenhouse Gas Protocol Scopes 1, 2, 3 in Green Hospitals", 
                 fontsize=16.5, fontweight='bold', color=C_PRIMARY, y=0.97)

    def draw_scope_card(x, y, w, h, title, share, sources, mitigations, fill, border, title_color):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.03,rounding_size=0.03",
                                     facecolor=fill, edgecolor=border, lw=2.2)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h - 0.04, title, ha='center', va='top', fontsize=11, fontweight='bold', color=title_color)
        ax.text(x + w/2, y + h - 0.08, share, ha='center', va='top', fontsize=9.5, fontweight='bold', color=border)
        
        body1 = "EMISSION SOURCES:\n" + "\n".join([f"• {s}" for s in sources])
        ax.text(x + 0.02, y + h - 0.12, body1, fontsize=8.2, color=C_TEXT, va='top', linespacing=1.2)
        
        body2 = "GREEN MITIGATIONS:\n" + "\n".join([f"✔ {m}" for m in mitigations])
        ax.text(x + 0.02, y + 0.03, body2, fontsize=8.2, fontweight='bold', color=C_SUCCESS, va='bottom', linespacing=1.2)

    # Scope 1 (Direct)
    draw_scope_card(0.04, 0.32, 0.29, 0.58, 
                    "SCOPE 1: DIRECT EMISSIONS", "Estimated 10% - 15% of Footprint",
                    ["Hospital fossil fuel boilers & chillers",
                     "Fleet ambulance fuel consumption",
                     "Volatile anaesthetic gases: Desflurane,",
                     "  Sevoflurane, and Nitrous Oxide (N₂O)",
                     "Fugitive refrigerant leaks (HFCs)"],
                    ["Anaesthetic gas capture & scavenging",
                     "Transition to low-GWP agents (Sevoflurane)",
                     "Electric / hybrid ambulance fleets",
                     "Strict preventive refrigerant audits"],
                    fill="#FEF2F2", border=C_DANGER, title_color=C_DANGER)

    # Scope 2 (Indirect Energy)
    draw_scope_card(0.355, 0.32, 0.29, 0.58, 
                    "SCOPE 2: PURCHASED ENERGY", "Estimated 15% - 20% of Footprint",
                    ["Purchased municipal grid electricity",
                     "Steam, central heating & cooling",
                     "Energy-intensive high-voltage diagnostic",
                     "  imaging (MRI, CT, PET scanners)",
                     "Continuous 24/7 HVAC air handling"],
                    ["Rooftop solar photovoltaic microgrids",
                     "Energy-efficient LED conversion",
                     "Smart HVAC variable air volume (VAV)",
                     "Green building certifications (GRIHA)"],
                    fill="#FFFBEB", border=C_ACCENT, title_color=C_ACCENT)

    # Scope 3 (Supply Chain & Life-Cycle)
    draw_scope_card(0.67, 0.32, 0.29, 0.58, 
                    "SCOPE 3: SUPPLY CHAIN VALUE", "Estimated 70% - 80% of Footprint (DOMINANT)",
                    ["Pharmaceutical production & packaging",
                     "Single-use plastic medical consumables",
                     "Medical device procurement & transport",
                     "Staff, patient, and visitor transport",
                     "Biomedical waste incineration & disposal"],
                    ["Circular medical supply procurement",
                     "Transition to reusable sterilized instruments",
                     "Local pharmaceutical sourcing",
                     "Autoclave disinfection over incineration",
                     "Plant-forward seasonal inpatient catering"],
                    fill="#EFF6FF", border=C_PRIMARY, title_color=C_PRIMARY)

    # Bottom Summary Ribbon
    rect_sum = patches.FancyBboxPatch((0.04, 0.06), 0.92, 0.20, boxstyle="round,pad=0.03,rounding_size=0.03",
                                     facecolor="#F0FDF4", edgecolor=C_SUCCESS, lw=2)
    ax.add_patch(rect_sum)
    ax.text(0.06, 0.21, "NATIONAL INITIATIVES: KAYAKALP & GREEN AND CLIMATE RESILIENT HEALTHCARE FACILITIES", 
            fontsize=11, fontweight='bold', color=C_SUCCESS)
    ax.text(0.06, 0.10, 
            "• National Programme on Climate Change and Human Health (NPCCHH): Mandates green hospital standards across all district hospitals.\n"
            "• Kayakalp Assessment Framework: Incorporates Eco-friendly Facility criteria, energy audits, solar integration, and BMW segregation.\n"
            "• Biomedical Waste Management Rules: Mandatory non-chlorinated plastic bags and barcode tracking to minimize toxic dioxin emissions.",
            fontsize=8.8, color=C_TEXT, linespacing=1.3)

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    save_fig(fig, "ch32_10_healthcare_ghg_scopes_green_hospital.png")

# ----------------------------------------------------------------------
# 32-11: International Health Regulations Yellow Fever Decision Tree
# ----------------------------------------------------------------------
def draw_32_11():
    fig, ax = plt.subplots(figsize=(15, 8.5), facecolor=C_BG)
    ax.set_facecolor(C_BG)
    ax.axis('off')
    
    fig.suptitle("International Health Regulations (IHR 2005): Yellow Fever Vaccination & Quarantine Decision Tree", 
                 fontsize=16.5, fontweight='bold', color=C_PRIMARY, y=0.97)

    def draw_box(x, y, w, h, title, body, fill, border, title_color):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.03,rounding_size=0.03",
                                     facecolor=fill, edgecolor=border, lw=2.2)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h - 0.04, title, ha='center', va='top', fontsize=10.5, fontweight='bold', color=title_color)
        ax.text(x + w/2, y + (h - 0.08)/2, body, ha='center', va='center', fontsize=8.5, color=C_TEXT, linespacing=1.25)

    def draw_arrow(x1, y1, x2, y2, label=""):
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="-|>", lw=2.2, color=C_PRIMARY, mutation_scale=15))
        if label:
            ax.text((x1+x2)/2, (y1+y2)/2 + 0.02, label, ha='center', va='bottom', fontsize=8.5, fontweight='bold', color=C_PRIMARY)

    # Top: Traveler Arrival
    draw_box(0.24, 0.82, 0.52, 0.12, "TRAVELER ARRIVAL AT INDIAN POINT OF ENTRY (AIRPORT / SEAPORT)", 
             "Traveler has departed from or transited through a WHO Yellow Fever Endemic Country\n(Sub-Saharan Africa or South America) within the past 6 days",
             fill="#EFF6FF", border=C_PRIMARY, title_color=C_PRIMARY)

    draw_arrow(0.50, 0.82, 0.50, 0.72)

    # Step 2: APHO Inspection
    draw_box(0.20, 0.56, 0.60, 0.16, "AIRPORT / PORT HEALTH OFFICER (APHO) DOCUMENT AUDIT", 
             "Inspection of International Certificate of Vaccination or Prophylaxis (ICVP - Yellow Card):\n"
             "1. Administered at officially designated Yellow Fever Vaccination Centre?\n"
             "2. WHO-approved 17D vaccine strain documented?\n"
             "3. Completed at least 10 DAYS PRIOR to arrival in India?\n"
             "4. Certificate validity: LIFETIME (under amended IHR 2005 Annex 7)",
             fill="#FFFBEB", border=C_ACCENT, title_color=C_ACCENT)

    # Branching arrows
    draw_arrow(0.30, 0.56, 0.18, 0.44, "YES (All Valid)")
    draw_arrow(0.50, 0.56, 0.50, 0.44, "Airport Transit <12h")
    draw_arrow(0.70, 0.56, 0.82, 0.44, "NO / Invalid / <10 Days")

    # Outcome 1: Immediate Clearance
    draw_box(0.04, 0.22, 0.28, 0.22, "OUTCOME A: CLEARED", 
             "• Valid ICVP verified\n• >= 10 days since vaccination\n• Immediate immigration clearance\n• Allowed entry into India without restriction",
             fill="#DCFCE7", border=C_SUCCESS, title_color=C_SUCCESS)

    # Outcome 2: Transit Exception
    draw_box(0.36, 0.22, 0.28, 0.22, "OUTCOME B: TRANSIT EXEMPT", 
             "• Transit stay < 12 hours\n• Confined strictly to international transit lounge of airport\n• Airport verified mosquito-proof\n• Conditional release with self-monitoring",
             fill="#F0FDFA", border=C_SECONDARY, title_color=C_SECONDARY)

    # Outcome 3: Mandatory Quarantine
    draw_box(0.68, 0.22, 0.28, 0.22, "OUTCOME C: STRICT QUARANTINE", 
             "• Missing / fake certificate\n• Vaccination < 10 days before arrival\n• MANDATORY ISOLATION in designated APHO mosquito-proof facility\n• Duration: UP TO 6 DAYS from departure",
             fill="#FEE2E2", border=C_DANGER, title_color=C_DANGER)

    # Bottom Callout: Biological rationale
    rect_rat = patches.FancyBboxPatch((0.08, 0.04), 0.84, 0.12, boxstyle="round,pad=0.02,rounding_size=0.02",
                                     facecolor="#F8FAFC", edgecolor=C_BORDER, lw=1.8)
    ax.add_patch(rect_rat)
    ax.text(0.50, 0.11, "EPIDEMIOLOGICAL RATIONALE: WHY INDIA ENFORCES STRICT QUARANTINE", 
            ha='center', fontsize=10, fontweight='bold', color=C_DANGER)
    ax.text(0.50, 0.06, 
            "India has abundant competent mosquito vectors (Aedes aegypti) and a non-immune population of 1.4 billion.\n"
            "Yellow fever incubation period is 3 to 6 days. Introduction of a viraemic traveler risks catastrophic urban transmission.",
            ha='center', fontsize=8.5, color=C_TEXT)

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    save_fig(fig, "ch32_11_yellow_fever_ihr_decision_tree.png")

# ----------------------------------------------------------------------
# Master Runner
# ----------------------------------------------------------------------
def main():
    print("[*] Marcus Directorate Generator: Generating 17 High-Yield Medical Visuals...")
    draw_31_1()
    draw_31_2()
    draw_31_3()
    draw_31_4()
    draw_31_5()
    draw_31_6()
    draw_32_1()
    draw_32_2()
    draw_32_3()
    draw_32_4()
    draw_32_5()
    draw_32_6()
    draw_32_7()
    draw_32_8()
    draw_32_9()
    draw_32_10()
    draw_32_11()
    print("[+] All 17 visuals successfully generated in reading-illustrations/!")

if __name__ == "__main__":
    main()
