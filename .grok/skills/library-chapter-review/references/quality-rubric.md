# Academic content quality rubric (MD Community Medicine)

Audience: **MD Community Medicine resident** preparing for university theory exams (LQ/LAQ, SN) and related practical/viva context. Depth should support structured long answers and crisp short notes—not UG recall alone, and not research-monograph detail.

## A. Accuracy (hard gate)

| Check | Fail if |
|-------|---------|
| Definitions match standard sources (Park, WHO, MoHFW, national programme guidelines) | Wrong WHO/Park definitions, inverted formulas, wrong programme names |
| Numbers (rates, cut-offs, doses, schedules, targets) | Invented or clearly obsolete without historical framing |
| Legal / programme facts | Wrong act year, wrong implementing agency, obsolete scheme treated as current |
| Causal / epi reasoning | Contradicts basic epi (e.g. incidence vs prevalence relationship) |

**Outdated facts policy**

1. If Library content **or** Park states a time-sensitive fact (coverage targets, disease elimination status, vaccine schedule, notification rates, SES income slabs, BMW rules, NTEP/NLEP renames, etc.), **cross-check with web search**.
2. Prefer **official** sources only: MoHFW / NHM / NCDC / ICMR / CDSCO / WHO fact sheets / Gazette / IPHS / NFHS reports / SRS / Census.
3. Suggest an update **only if you are 100% sure** the official source supersedes the text. Cite the source title, date, and URL in the report.
4. If unsure, mark **`NEEDS_HUMAN_VERIFY`** — do not propose a factual change.
5. When Park is outdated but still exam-relevant, prefer: *current official fact* + short note *“Park (edition) still states X for historical/exam context.”*

## B. Completeness for exam use

| Check | Expectation |
|-------|-------------|
| SN coverage | Every high-yield SN topic has a discrete, extractable block (definition → key points → exam bullets) |
| LAQ coverage | Major LAQ themes have structure: intro/definition → classification/framework → details → Indian context/programmes → conclusion/exam tips |
| PYQ map | Map each LQ/SN from `categorized_questions_report.md` → present / partial / missing |
| Indian context | National programmes, NFHS/SRS figures where relevant, recent renames (e.g. NTEP) |
| Comparators | Tables for classic contrasts (incidence vs prevalence, monitoring vs surveillance, SMR, etc.) |

## C. Structure & pedagogy

| Check | Expectation |
|-------|-------------|
| Section hierarchy | Clear ALL-CAPS or equivalent section heads; scannable bullets |
| Definitions first | Exam answers open with definition/authority |
| Mnemonics | Only if accurate; flag wrong mnemonics |
| Formulas | Correct formula + units + multiplier + when to use |
| Redundancy | Duplicate blocks across subsections noted; don’t rewrite whole chapter unless asked |

## D. Writing quality

| Check | Expectation |
|-------|-------------|
| Clarity | Precise medical English; no AI fluff |
| Consistency | Same term for same concept throughout (e.g. HWC vs Ayushman Arogya Mandir — state current official name if tagging updates) |
| Tables | Prefer markdown tables for multi-column comparisons when ReadingView supports them |
| Length | SN-depth ~½–1 page equivalent; LAQ scaffolds deeper without essay padding |

## Severity labels for findings

- **critical** — factual error that would cost exam marks or mislead clinical/public-health practice
- **major** — important gap for LAQ/SN, obsolete programme treated as current, missing core Park topic
- **minor** — wording, organisation, optional enrichment
- **tag** — SN/LAQ tagging suggestion only
- **pyq_gap** — PYQ not covered; suggest content to add
- **verify** — possible outdated fact; not yet proven by official source

## Do not

- Invent statistics or guideline years.
- “Modernise” content based on blogs, coaching sites, or secondary MCQ banks alone.
- Mass-rewrite style when a surgical fix suffices.
- Apply Firebase/live overrides without explicit user approval after the report.
