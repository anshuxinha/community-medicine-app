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
4. If unsure after official-source search, mark **`NEEDS_AGENT_VERIFY` in the review report only** — do not invent a change, and **do not** put any “verify this yourself” instruction into Library body text, headings, tags, or Exam Tips. Resolve with better sources before apply, or omit the claim.
5. When Park is outdated but still exam-relevant, prefer: *current official fact* + short note *“Park (edition) still states X for historical context.”* (Historical framing is fine; telling the **reader** to re-check MoHFW is not.)
6. **Paid-product rule:** Library content must read as finished, trustworthy material. Never offload verification to the subscriber (“verify latest circular”, “confirm for your exam year”, “check official PDF”, etc.).

## B. Completeness for exam use

| Check | Expectation |
|-------|-------------|
| SN coverage | Every high-yield SN topic has a discrete, extractable block (definition → key points → exam bullets → Exam Tip) |
| LAQ coverage | Major LAQ themes have structure: intro/definition → classification/framework → details → Indian context/programmes → conclusion → Exam Tip |
| PYQ map | Map each LQ/SN from `categorized_questions_report.md` → present / partial / missing |
| Indian context | National programmes, NFHS/SRS figures where relevant, recent renames (e.g. NTEP) |
| Comparators | Tables for classic contrasts (incidence vs prevalence, monitoring vs surveillance, SMR, etc.) |

## C. New content depth (mandatory when adding or proposing full draft text)

Any **new** or **substantially expanded** block must be enough for a final-year MD Community Medicine resident to write from in the university exam. Match depth to question type.

### C1. Short note (SN) — target length ~½–1 exam page

Must include, in order:

1. **Definition** (1–2 lines) with authority (WHO / Park / MoHFW) when standard wording exists.
2. **Core body** — 6–12 high-yield bullets (or a short table + bullets). Cover classification, mechanism/features, advantages/limitations, or steps as the topic demands.
3. **India / programme hook** where relevant (national programme, NFHS/SRS figure, legal act, institutional example).
4. **Closing exam line** only if it adds marks (e.g. one high-yield contrast or “remember” point).
5. **Exam tip** (`> **EXAM TIP:** …` preferred) — brief framing (structure order, what not to miss). See `tag-format.md`. **No mark-count prefixes** (`SN (5)`, `LAQ (10)`, etc.).

**Not enough:** definition alone; 2–3 UG bullets; heading with no body.

### C2. Long answer (LAQ/LQ) — target length ~1½–3 exam pages scaffold

Must include, in order:

1. **Introduction / definition(s)** with authority.
2. **Framework or classification** (prefer a markdown table or numbered levels).
3. **Elaboration** of each major limb with examples a resident can expand under time pressure.
4. **National / programme context** (India-specific schemes, indicators, recent renames) when the topic allows.
5. **Conclusion** — 2–4 lines tying concept to public-health practice or exam “so what”.
6. **Exam tip** (`> **EXAM TIP:** …` preferred) — how to frame the long answer (recommended heading sequence). **No invented mark splits** (`LAQ (10)`, `10 marks`, etc.).

**Not enough:** bullet dump without definition/framework; SN-length block labelled as LAQ; essay padding without structure.

### C3. Gap-fill when Park is thin or silent

Park chapter PDFs are the **primary** reference but are not exhaustive for every PYQ.

| Situation | Action |
|-----------|--------|
| Park covers the topic fully | Align Library text to Park; modernise only with verified official sources |
| Park mentions briefly; PYQ needs SN/LAQ depth | Expand to C1/C2 using standard MD Community Medicine knowledge |
| Park silent; topic is standard in MD exams | Write full C1/C2 block from standard knowledge + **cross-verify** definitions, programmes, and numbers against good sources (Park other chapters if known, WHO, MoHFW, ICMR, NCDC, standard CM textbooks principles) |
| Cannot verify a specific number/year/claim | **Omit** the number from live text; flag `NEEDS_AGENT_VERIFY` in the **report** only — **do not invent** and **do not** ask the reader to verify |

**Anti-hallucination rules for gap-fill**

- Do not invent statistics, coverage %, cut-offs, act years, vaccine doses, or “latest” guideline years.
- Prefer qualitative, structural, and classification content when exact figures are uncertain — still write it as confident, correct teaching text, not as a disclaimer.
- Every time-sensitive claim in new content must be web-checked against an official source, or dropped **before** it reaches mockData/overrides.
- Coaching blogs / random MCQ sites are never sole authority.
- In the report, note for each gap-fill block: `Park coverage: full | partial | absent` and `Sources used: …`.
- **Never** ship phrases that make the paying reader re-verify programme facts.

## D. Structure & pedagogy

| Check | Expectation |
|-------|-------------|
| Section hierarchy | Clear ALL-CAPS or equivalent section heads; scannable bullets |
| Definitions first | Exam answers open with definition/authority |
| Mnemonics | Only if accurate; flag wrong mnemonics |
| Formulas | Correct formula + units + multiplier + when to use |
| Exam Tip | Every new SN/LAQ block ends with `[EXAMTIP]…[/EXAMTIP]` (brief framing only — not a second essay) |
| Redundancy | Duplicate blocks across subsections noted; don’t rewrite whole chapter unless asked |

## E. Writing quality

| Check | Expectation |
|-------|-------------|
| Clarity | Precise medical English; no AI fluff |
| Consistency | Same term for same concept throughout (e.g. HWC vs Ayushman Arogya Mandir — state current official name if tagging updates) |
| Tables | Prefer markdown tables for multi-column comparisons when ReadingView supports them |
| Length | SN-depth ~½–1 page equivalent; LAQ scaffolds deeper without essay padding |
| Exam Tip tone | Imperative, brief (“Open with WHO definition → table of … → 5 India points → close with …”) |

## Severity labels for findings

- **critical** — factual error that would cost exam marks or mislead clinical/public-health practice
- **major** — important gap for LAQ/SN, obsolete programme treated as current, missing core Park topic
- **minor** — wording, organisation, optional enrichment
- **tag** — SN/LAQ tagging suggestion only
- **pyq_gap** — PYQ not covered; suggest content to add
- **verify** — possible outdated fact; not yet proven by official source (**report-only** severity; never a live-content label)

## Do not

- Invent statistics or guideline years.
- “Modernise” content based on blogs, coaching sites, or secondary MCQ banks alone.
- Mass-rewrite style when a surgical fix suffices.
- Apply Firebase/live overrides without explicit user approval after the report.
- Ship new SN/LAQ text without an Exam Tip box.
- Pad answers with generic AI filler that would not earn MD theory marks.
- Put “verify latest…”, “confirm for your exam year”, or similar **reader-offload** wording into live Library content (including Exam Tips).
