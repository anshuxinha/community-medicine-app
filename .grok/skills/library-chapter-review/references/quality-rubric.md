# Academic content quality rubric (MD Community Medicine)

Audience: **MD Community Medicine resident** preparing for university theory exams (LQ/LAQ, SN) and related practical/viva context. Depth should support structured long answers and crisp short notes: not UG recall alone, and not research-monograph detail.

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
4. If unsure after official-source search, mark **`NEEDS_AGENT_VERIFY` in the review report only**: do not invent a change, and **do not** put any “verify this yourself” instruction into Library body text, headings, tags, or Exam Tips. Resolve with better sources before apply, or omit the claim.
5. When the textbook is outdated but still exam-relevant, put historical vs current framing in the **review report**. In **live Library text**, state the current official fact in plain teaching prose. Do **not** write "Park still states…" or similar textbook name-drops for the reader.
6. **Paid-product rule:** Library content must read as finished, trustworthy material. Never offload verification to the subscriber ("verify latest circular", "confirm for your exam year", "check official PDF", etc.).
7. **No textbook name-dropping in live text:** Do not use "Park", "Park-aligned", "as per Park", "Park notes", or equivalent labels on definitions/headings/Exam Tips. Park is for the agent's audit and the report only. Prefer WHO/MoHFW/Act names only when examiners expect that official citation.
8. **No em-dashes in live text:** Never use U+2014 (em dash), `&mdash;`, or ` -- ` as a clause dash. Use a period, comma, colon, semicolon, or parentheses. Hyphen only for true compounds (e.g. cost-effectiveness).

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

### C1. Short note (SN): target length ~½–1 exam page

Must include, in order:

1. **Definition** (1–2 lines). Prefer plain standard wording. Cite **WHO / MoHFW / statute** only when that authority is part of the exam answer; never label definitions "Park" in live text.
2. **Core body**: 6–12 high-yield bullets (or a short table + bullets). Cover classification, mechanism/features, advantages/limitations, or steps as the topic demands.
3. **India / programme hook** where relevant (national programme, NFHS/SRS figure, legal act, institutional example).
4. **Mnemonic (I RECALL)** when the body has a finite high-yield recall list (criteria, steps, limbs). Place after the list; format and gates in `mnemonics.md`. Skip with report rationale if Important/Relevant fails.
5. **Closing exam line** only if it adds marks (e.g. one high-yield contrast or “remember” point).
6. **Exam tip** (`> **EXAM TIP:** …` preferred): brief framing (structure order, what not to miss). See `tag-format.md`. **No mark-count prefixes** (`SN (5)`, `LAQ (10)`, etc.).

**Not enough:** definition alone; 2–3 UG bullets; heading with no body.

### C2. Long answer (LAQ/LQ): target length ~1½–3 exam pages scaffold

Must include, in order:

1. **Introduction / definition(s)** with authority.
2. **Framework or classification** (prefer a markdown table or numbered levels).
3. **Elaboration** of each major limb with examples a resident can expand under time pressure.
4. **National / programme context** (India-specific schemes, indicators, recent renames) when the topic allows.
5. **Mnemonic (I RECALL)** for each major classification/steps list that is exam-recall heavy (after the list; see `mnemonics.md`). Not required for pure essay narrative limbs.
6. **Conclusion**: 2–4 lines tying concept to public-health practice or exam “so what”.
7. **Exam tip** (`> **EXAM TIP:** …` preferred): how to frame the long answer (recommended heading sequence). **No invented mark splits** (`LAQ (10)`, `10 marks`, etc.).

**Not enough:** bullet dump without definition/framework; SN-length block labelled as LAQ; essay padding without structure.

### C3. Gap-fill when Park is thin or silent

Park chapter PDFs are the **primary** reference but are not exhaustive for every PYQ.

| Situation | Action |
|-----------|--------|
| Park covers the topic fully | Align Library text to Park; modernise only with verified official sources |
| Park mentions briefly; PYQ needs SN/LAQ depth | Expand to C1/C2 using standard MD Community Medicine knowledge |
| Park silent; topic is standard in MD exams | Write full C1/C2 block from standard knowledge + **cross-verify** definitions, programmes, and numbers against good sources (Park other chapters if known, WHO, MoHFW, ICMR, NCDC, standard CM textbooks principles) |
| Cannot verify a specific number/year/claim | **Omit** the number from live text; flag `NEEDS_AGENT_VERIFY` in the **report** only: **do not invent** and **do not** ask the reader to verify |

**Anti-hallucination rules for gap-fill**

- Do not invent statistics, coverage %, cut-offs, act years, vaccine doses, or “latest” guideline years.
- Prefer qualitative, structural, and classification content when exact figures are uncertain: still write it as confident, correct teaching text, not as a disclaimer.
- Every time-sensitive claim in new content must be web-checked against an official source, or dropped **before** it reaches mockData/overrides.
- Coaching blogs / random MCQ sites are never sole authority.
- In the report, note for each gap-fill block: `Park coverage: full | partial | absent` and `Sources used: …`.
- **Never** ship phrases that make the paying reader re-verify programme facts.

## D. Structure & pedagogy

| Check | Expectation |
|-------|-------------|
| Section hierarchy | Clear ALL-CAPS or equivalent section heads; scannable bullets |
| Definitions first | Exam answers open with definition/authority |
| Mnemonics | Use **I RECALL** (`mnemonics.md`): Important, Relevant, Emotional, Contrasting, Associable, Linked, Lean. Insert after high-yield lists (before Exam Tip). Flag wrong mnemonics as accuracy issues; revise weak ones; remove low-value noise |
| Formulas | Correct formula + units + multiplier + when to use |
| Exam Tip | Every new SN/LAQ block ends with Exam Tip (brief framing only: not a second essay) |
| Redundancy | Duplicate blocks across subsections noted; don’t rewrite whole chapter unless asked |

## E. Writing quality

| Check | Expectation |
|-------|-------------|
| Clarity | Precise medical English; no AI fluff |
| Acronyms | **First use in each leaf:** `Full Name (ACRONYM)`; short form only after that. Never open a topic with a bare unexplained acronym (e.g. bare `GAS` without Group A β-haemolytic Streptococcus). Expand programme, disease, legal, and technical initialisms. SI units and pure formula symbols may stay short. |
| Consistency | Same term for same concept throughout (e.g. HWC vs Ayushman Arogya Mandir: state current official name if tagging updates) |
| Tables | Prefer markdown tables for multi-column comparisons when ReadingView supports them |
| Length | SN-depth ~½–1 page equivalent; LAQ scaffolds deeper without essay padding |
| Exam Tip tone | Imperative, brief ("Open with definition → table of … → 5 India points → close with …"). No textbook name-drops, no em-dashes |
| Mnemonic tone | Topic-linked cue + clear letter expansions; vivid is good, inaccurate is not. Prefer ≤9 items. No em-dashes |
| Textbook names | Zero "Park" / "Park-aligned" in live prose; report-only attribution |
| Em-dashes | Forbidden in live Library text (use period/comma/colon/parentheses) |

## Severity labels for findings

- **critical**: factual error that would cost exam marks or mislead clinical/public-health practice
- **major**: important gap for LAQ/SN, obsolete programme treated as current, missing core Park topic
- **minor**: wording, organisation, optional enrichment
- **tag**: SN/LAQ tagging suggestion only
- **pyq_gap**: PYQ not covered; suggest content to add
- **verify**: possible outdated fact; not yet proven by official source (**report-only** severity; never a live-content label)

## Do not

- Invent statistics or guideline years.
- “Modernise” content based on blogs, coaching sites, or secondary MCQ banks alone.
- Mass-rewrite style when a surgical fix suffices.
- Apply content, Firebase overrides, commit, or push without explicit user **approval of the report** (approval then triggers the full ship path in SKILL.md Step 7).
- Ship new SN/LAQ text without an Exam Tip box.
- Ship high-yield ordered lists with no I RECALL consideration (must add mnemonic, or document why skipped).
- Force a mnemonic onto every paragraph or invent facts to make a phrase work.
- Pad answers with generic AI filler that would not earn MD theory marks.
- Put "verify latest…", "confirm for your exam year", or similar **reader-offload** wording into live Library content (including Exam Tips).
- Put "Park", "Park-aligned", "as per Park", or other textbook name-drops into live Library content.
- Use em-dashes (U+2014) or ` -- ` clause dashes in live Library content.
- Introduce bare acronyms without a prior full-form expansion in that leaf.
