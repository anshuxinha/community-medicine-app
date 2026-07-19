# Chapter 3 — post-publish verification checklist

**Chapter:** Principles of Epidemiology and Epidemiologic Methods (`3`)  
**Leaves published:** `3-1` … `3-6`  
**Source of truth in repo:** `src/data/mockData.json`  
**Live source:** Firestore `libraryContentOverrides/{leafId}` with `status: "active"`  
**Review artifacts (local, gitignored):** `dist/library_chapter_reviews/ch3_20260719T072513Z/`

Use this after Firebase overrides are published. Check on a **real device or emulator with network**, signed into an account that can load Library content.

---

## A. App loads overrides

| # | Check | Pass? | Notes |
|---|--------|-------|-------|
| A1 | Force-close and reopen the app (or pull-to-refresh Library if available) so overrides re-fetch | ☐ | |
| A2 | Open **Library → Chapter 3** (not offline-only / stale cache if you have one) | ☐ | |
| A3 | Open each subtopic `3-1` through `3-6` without crash or blank screen | ☐ | |
| A4 | Content length feels updated (esp. **3-2** much longer: surveillance, STEPS, etc.) | ☐ | |

---

## B. SN / LAQ / Exam Tip rendering

| # | Check | Where | Pass? |
|---|--------|-------|-------|
| B1 | Teal **SN** badge/box renders (not raw `[SN]…[/SN]` text) | e.g. 3-1 lead/length time; 3-3 nested/case-cohort | ☐ |
| B2 | Amber **LAQ** badge/box renders | e.g. 3-2 epidemic investigation; 3-4 RCT | ☐ |
| B3 | Blank line after tags — heading is **not** turned into a purple 2-column “text table” | Any tagged section | ☐ |
| B4 | Exam tips show as indigo-style **EXAM TIP** box / blockquote, not raw `[EXAMTIP]` | New blocks in 3-1…3-4 | ☐ |
| B5 | Multiple consecutive SN/LAQ tags do not collapse into a table | 3-3 risk measures; 3-4 RCT tags | ☐ |

---

## C. Critical factual fixes (must be present)

| # | Leaf | Must **see** | Must **not** see | Pass? |
|---|------|--------------|------------------|-------|
| C1 | `3-2` | Prospective (concurrent) cohort **above** retrospective in hierarchy | `retrospective > prospective` | ☐ |
| C2 | `3-5` | Hep A: vaccine preferred; IG in **mL/kg** | `0.05 mg/kg` | ☐ |
| C3 | `3-3` | Cohort good for rare **exposure**, poor for rare **disease** | “inappropriate when disease **or** exposure is rare” as single conflated line | ☐ |
| C4 | `3-4` | Randomization → intervention **and control** groups | “experimental group and **reference** group” | ☐ |
| C5 | `3-6` | Kilkari = RMNCH messaging, **not** IMI app | “New mobile app for IMI: Kilkari” | ☐ |
| C6 | `3-5` | Leprosy eliminated **as a public health problem** (2005) | Absolute “leprosy eliminated” with no PHP wording | ☐ |
| C7 | `3-5` | Autoclave **121 °C** | **122 °C** | ☐ |

---

## D. High-yield new / expanded blocks (spot-read)

| # | Leaf | Section to find | Pass? |
|---|------|-----------------|-------|
| D1 | `3-1` | Lead time **and** length time bias + Exam Tip | ☐ |
| D2 | `3-1` | Risk measurement orientation (RR/OR/AR/PAR) | ☐ |
| D3 | `3-2` | Food-item 2×2 attack rates (marriage/mass catering) | ☐ |
| D4 | `3-2` | Types of surveillance table + IDSP S/P/L + IHIP | ☐ |
| D5 | `3-2` | WHO STEPS 1/2/3 | ☐ |
| D6 | `3-2` | R0 interpretation + control levers | ☐ |
| D7 | `3-3` | Case-cohort vs nested case-control table | ☐ |
| D8 | `3-3` | Effect modification vs confounding | ☐ |
| D9 | `3-4` | Stepped-wedge design | ☐ |
| D10 | `3-4` | Ethics in clinical/community trials | ☐ |
| D11 | `3-4` | Bradford Hill criteria (named) | ☐ |
| D12 | `3-4` | Block randomization | ☐ |

---

## E. Operator spot-check of time-sensitive facts (publisher only — never shown to readers)

App text must already be authoritative. This section is for **you as publisher** to spot-check rendering against sources used at apply time — not a prompt to leave “verify yourself” wording in the product.

| # | Topic | Leaf | What was applied | Source used at apply | Spot-check OK? |
|---|--------|------|------------------|----------------------|----------------|
| E1 | National Immunization Schedule | `3-6` | UIP NIS including fIPV-3 / PCV / MR; JE endemic districts; ages 9–11 mo visit | MoHFW/U-WIN NIS PDF; NHM schedule tables | ☐ |
| E2 | Open vial policy | `3-6` | Multidose open-vial rules as taught (bOPV, IPV, Penta, Hep B, DPT, Td, TT; not lyophilized live) | MoHFW open-vial policy teaching standard | ☐ |
| E3 | Elimination wording | `3-5` | Leprosy PHP 2005; KA residual foci; LF elimination ongoing | MoHFW/NLEP; PIB/NCDC KA updates | ☐ |
| E4 | IDSP + IHIP | `3-2` | S/P/L classical forms + IHIP real-time | MoHFW IHIP-IDSP | ☐ |
| E5 | Hep A traveller prophylaxis | `3-5` | Vaccine preferred; IG **mL/kg** (~0.1 / 0.2 by duration) | CDC Yellow Book / ACIP-style IG dosing | ☐ |

---

## F. Firestore sanity (optional CLI / console)

| # | Check | Pass? |
|---|--------|-------|
| F1 | Docs exist: `libraryContentOverrides/3-1` … `3-6` | ☐ |
| F2 | Each has `status: "active"` | ☐ |
| F3 | `proposedContent` length roughly matches mockData leaf (3-2 largest) | ☐ |
| F4 | `approvedAt` is today’s publish time | ☐ |

Quick re-publish one leaf (if needed):

```bash
python scripts/publish_library_override.py 3-2 --reason "Ch3 review fix"
```

---

## G. Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| Content / exam facts (section E) | | | ☐ OK / ☐ needs edit |
| App rendering (sections A–D) | | | ☐ OK / ☐ needs edit |
| Publish confirmed in production app | | | ☐ OK |

**If something fails:** note leaf id + screenshot + whether issue is **content** (edit mockData + re-publish) or **renderer** (ReadingView SN/LAQ/EXAMTIP styles).
