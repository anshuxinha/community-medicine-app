---
name: library-chapter-review
description: >
  Review accuracy and exam-quality of a Library chapter (latest Firebase
  libraryContentOverrides + mockData) against Park textbook PDFs in
  D:\Study Related\Books\Park Split and MD Community Medicine PYQs in
  categorized_questions_report.md. Tags SN/LAQ sections with fixed colour
  markers, requires MD-exam-depth new content with Exam Tip boxes, inserts
  list-only hybrid mnemonics sparingly (finite 4–10 item exam lists only; no
  I RECALL framework), places SN/LAQ tags only above answering sections (never
  a tag dump before overview), fills Park gaps only with verified knowledge,
  flags outdated facts only when verified from official sources, and suggests
  PYQ content gaps. Use when the user runs /library-chapter-review,
  /chapter-review, "review library chapter", "check chapter accuracy",
  "audit Park chapter", or asks to quality-check a specific Library chapter
  for MD exam prep.
metadata:
  short-description: "QA Library chapters vs Park + PYQs (SN/LAQ + Exam Tip + hybrid list mnemonics)"
---

# /library-chapter-review: Library chapter accuracy & exam quality

Review one Library chapter for an **MD Community Medicine resident** exam prep standard: factual accuracy, academic structure, PYQ coverage, fixed SN/LAQ colour tags (only above real sections), **exam-ready new content** (depth + Exam Tip), and **optional hybrid list-only mnemonics** where a finite high-yield list (typically **4–10 items**) must be memorized.

## Usage

```
/library-chapter-review <chapter>
```

Examples:

- `/library-chapter-review 2`
- `/library-chapter-review Concept of Health and Disease`
- `/library-chapter-review Epidemiology of Communicable Diseases`
- `Run library chapter review for chapter 11`

`<chapter>` may be a number, Library id, or title fragment.

**Default mode: report only.** Do not edit `mockData.json`, commit, push, or publish Firebase overrides until the user **approves** the report (e.g. “apply”, “approve”, “ship it”, “do the fixes”).

**On approval (mandatory ship path):** apply content → **git commit + git push** → **Firebase `libraryContentOverrides` for every changed leaf**. **Do not** run `eas update` unless required for non-override reasons: and if it is required, **ask the user first**.

## Fixed paths

Read `references/paths.md`. Critical paths:

| What | Where |
|------|--------|
| Effective content | `mockData.json` **merged with** Firestore `libraryContentOverrides` |
| Park reference | `D:\Study Related\Books\Park Split\` (match by chapter number or name) |
| PYQs | `D:\IGIMS\Major Tests & Question Papers\categorized_questions_report.md` |
| Rubric | `references/quality-rubric.md` |
| SN/LAQ/EXAMTIP tags | `references/tag-format.md` |
| Mnemonics (hybrid list-only, 4–10 items) | `references/mnemonics.md` |
| Bulk Park gap scan | `scripts/scan_park_library_gaps.py` → `dist/park_gap_scans/latest.md` |

## Bulk Park gap scan (before multi-chapter deep review)

To **rank** Library chapters by large Park coverage gaps (thin text + missing high-yield topics), run:

```bash
py -3 scripts/scan_park_library_gaps.py
py -3 scripts/scan_park_library_gaps.py --chapters 6,16,22,23
py -3 scripts/scan_park_library_gaps.py --no-firebase
```

- Report-only; does not edit Library content.
- Read `dist/park_gap_scans/latest.md` (critical/large first).
- Then run `/library-chapter-review <id>` only on top offenders.
- Seeds: `scripts/data/park_chapter_topic_seeds.json`. Optional aliases: `scripts/data/park_topic_aliases.json`.
- Needs `pypdf` or `pdfplumber` (`py -3 -m pip install pypdf`).
- Bands: **critical** ≥55, **large** ≥30, **moderate** ≥18 (thin Library text is boosted).

## Step 0: Resolve chapter and load bundle

Run from app root (`D:\The App`):

```bash
python .grok/skills/library-chapter-review/scripts/load_chapter_bundle.py "<chapter>"
```

Optional flags:

- `--no-firebase`: mockData only (if offline / no service account)
- `--no-pdf-text`: skip PDF text extract (path match only)
- `--out <dir>`: custom output root

The script prints JSON with `bundleDir`. Then:

1. Read `bundleDir/manifest.json`
2. Read every `bundleDir/content/*.txt` leaf (these already include **active Firebase overrides** when available)
3. Read `bundleDir/park_reference.txt` if present; otherwise open the PDF path from the manifest with the PDF reader tool
4. Read `bundleDir/pyqs.json` (LQ / SN / MCQ lists for the matched Park chapter)

If Park PDF matching fails, list available files under Park Split and retry by number/title before proceeding.

If Firebase fails, say so clearly and continue with mockData (note reduced confidence for leaves that may be overridden in production).

## Step 1: Audience & quality bar

Apply `references/quality-rubric.md`.

Content must support:

- **Short notes (SN):** definition → 6–12 high-yield bullets → Indian context → **Exam Tip box**
- **Long answers (LAQ/LQ):** definition → framework/classification → elaboration → national context → conclusion → **Exam Tip box**

Depth = MD theory exam, not UG one-liners and not textbook chapter rewrites.

**When proposing or applying any new content**, the draft must be something a final-year MD Community Medicine resident could write from under exam conditions for that question type (see Step 3a and rubric §C).

## Step 2: Accuracy audit (vs Park + official sources)

For each leaf:

1. Compare definitions, classifications, cut-offs, doses, schedules, programme names, and classic exam numbers against **Park text** for that chapter.
2. Flag mismatches as `critical` / `major` / `minor` with short quotes from Library vs Park.
3. **Time-sensitive / possibly outdated** facts (either side):
   - Web-search **official** sources only (MoHFW, NHM, NCDC, ICMR, WHO fact sheets, Gazette, IPHS, NFHS, SRS, Census).
   - Propose an update **only if 100% sure** and the official document clearly supersedes the text.
   - Always include in the **report**: claim → official source name → date → URL → exact suggested replacement sentence.
   - If not certain after search: label `NEEDS_AGENT_VERIFY` in the **report only** and **do not** invent a correction. Then **you** (the agent) must resolve it with further official sources before any apply, or **omit** the claim. Never pass uncertainty to the app reader.
4. Never use coaching blogs or random MCQ sites as sole authority for factual updates.

### Live content is paid product: never offload verification to the reader

Residents pay for **finished, trustworthy Library text**. All of the following are **forbidden** in any text that will be written to `mockData.json`, Firebase overrides, SN/LAQ bodies, headings, or Exam Tips:

- "Verify latest circular / schedule / guideline"
- "Confirm for your exam year / exam sitting"
- "Check MoHFW yourself" / "readers should verify"
- "Content below may be outdated; verify"
- Soft hedges that dump work on the reader: "commonly taught; confirm locally", "name year only if verified", "cite current version in viva; do not invent…"
- Leaving `NEEDS_HUMAN_VERIFY` / `NEEDS_AGENT_VERIFY` tokens in live content

**Allowed:** factual statements the agent has already checked (e.g. "JE vaccine in endemic districts only" from the official NIS).
**Allowed in Exam Tips only:** how to **structure the answer** (order of headings, tables to draw), not "go verify this fact".
**If a figure cannot be verified:** omit it or use qualitative wording the agent can defend. Never tell the reader to verify.

### Live prose voice: no textbook name-dropping, no em-dashes, no meta language, expand acronyms on first use

Park (and other textbooks) are **agent-side references** for accuracy audits and the **review report**. They are not branding for the app reader.

**Forbidden in live Library text** (bodies, headings, tags, Exam Tips, `mockData`, Firebase overrides):

0. **Meta language (hard ban)**
   - Do **not** write author-to-self notes, prompt residue, or writing-process labels in the page.
   - Do **not** call a chapter subsection a "leaf" (or "this leaf", "next leaf", "effects leaf"). Cross-references name the **topic**, not the file or the content tree.
   - Do **not** label a block "India hook", "India paper", "guidebook language", "standard guidebook language", "information not too compressed", "for completeness", "not a forced word", or similar.
   - The heading for national material is **`Indian context:`** (not "India hook.").
   - These skill instructions stay in the skill. They must never appear in reader-facing content.

1. **Textbook name spam**
   - Do **not** write: "Park", "Park-aligned", "Park framing", "Park notes", "Park says", "as per Park", "Park (edition)", "According to Park", "Park-aligned steps", "Meaning (Park)", "DEFINITION (Park)", "Open with Park's definition", "to link Park", or similar.
   - Do **not** stamp every heading or definition with a textbook name.
   - **Prefer zero** textbook author names in a leaf. Standard definitions stand alone as exam-ready fact.
   - **Rare exception only:** if a definition is inseparable from a named authority that examiners expect as the **cited source of a legal or WHO/MoHFW wording**, prefer the **official authority** (WHO, MoHFW, Act name). Do not use "Park" as that authority label in live text.
   - Keep all "Park coverage: full|partial|absent" and "Sources used: Park Ch.N…" notes **only in the review report**, never in drafts that ship.

2. **Em-dashes (hard ban in live content and in skill-generated drafts)**
   - Never use Unicode U+2014 (em dash). Write the code point, not the character, in docs when naming the ban.
   - Never use HTML entities `&mdash;`, `&#8212;`, `&#x2014;`.
   - Never use markdown/plain substitutes meant as em-dashes (e.g. `---` as a dash in prose, or ` -- ` between clauses).
   - **Use instead:** a period and new sentence; a comma, colon, or semicolon; parentheses for asides; a regular hyphen only for true compound words (e.g. `well-known`, `cost-effectiveness`).
   - This matches the global no-em-dashes house rule and applies to all proposed and shipped Library prose.

3. **Acronyms: expand on first use (mandatory in every leaf)**
   - The **first time** an acronym or initialism appears in a leaf, write the **full expanded form** with the acronym in parentheses, then use the short form freely after.
   - **Format:** `Full Name (ACRONYM)` on first use. Examples: `Group A β-haemolytic Streptococcus (GAS)`, `National Programme for Prevention and Control of Non-Communicable Diseases (NP-NCD)`, `Body Mass Index (BMI)`, `World Health Organization (WHO)`.
   - Apply to medical, programme, legal, and technical acronyms a resident might not instantly expand (e.g. GAS, RHD, NPCDCS, NP-NCD, DASH, STEPS, COTPA, NPPCD, RPwD, VIA, HPV, TIA, RTA, HDL, LDL).
   - **Per-leaf rule:** expand on first use **within each leaf** (readers open leaves separately). One-leaf chapters expand once at first appearance in that leaf.
   - **Do not** open a section with a bare acronym the body never expands (e.g. “GAS pharyngitis” with no prior expansion).
   - **Exceptions:** SI units (`mmHg`, `mg/dL`, `kg`, `cm`) and pure formula symbols already defined in context. Still expand programme and disease acronyms.
   - **Audit existing text** during review: flag bare first-use acronyms as clarity findings and fix on apply.
   - **Pre-flight on apply:** spot-check high-yield acronyms in changed leaves; first occurrence must be `Expanded (ACRONYM)` form.

**Pre-flight (mandatory before apply/ship):** search each changed subsection for `Park`, `park-aligned`, U+2014 em-dash, ` -- `, `India hook`, and live-text uses of `leaf` as a section label (`this leaf`, `next leaf`, `effects leaf`). Fail ship if any hit remains in live text (case-insensitive for Park, except incidental words that are not the textbook, which should not appear). Also confirm first-use expansions for major acronyms introduced in that subsection.

## Step 3: PYQ coverage map

Using `pyqs.json`:

| Status | Meaning |
|--------|---------|
| `covered` | Clear section answers the question at MD exam depth |
| `partial` | Related content exists but missing structure/depth for exam |
| `missing` | No usable answer block |

For each **LQ** and **SN** (MCQs optional summary only):

- Status + leaf id(s)
- For `partial` / `missing`: produce a **full draft block** (not a skeleton only) per Step 3a
- Prefer surgical additions over whole-chapter rewrites

## Step 3a: Writing new content (mandatory for every gap fill)

Whenever the review **proposes** or **applies** new/expanded text for a PYQ gap:

### Depth by question type

| Type | Minimum usable answer |
|------|------------------------|
| **SN** | Definition (with authority) + 6–12 high-yield points + Indian context when relevant. Length ≈ ½–1 exam page. |
| **LAQ/LQ** | Definition → classification/framework (table preferred) → elaborate each limb with examples → national context → short conclusion. Length ≈ 1½–3 exam pages of scannable scaffold (not fluff). |

Full rules: `references/quality-rubric.md` §C1–C2.

### Source wording and following explanation (mandatory)

When drafting or editing live Library text:

1. **Definitions and categorisations** (named types, tables of classes, numbered frameworks) must be **verbatim from the source** (Park, WHO, MoHFW, statute, or the teaching source used for that topic). Do not paraphrase a definition to "simplify" it.
2. If a source sentence or bullet is hard to follow, **keep the source wording**, then add a **following** paragraph (or a following bullet if the source was a bullet) that restates the same idea in ordinary teaching English. Do not compress that explanation to save space.
3. Never put the writing instruction into the page. Do not write "standard guidebook language", "information not too compressed", "this is an explanation for easier understanding", "leaf", or "India hook".
4. National material uses the heading **`Indian context:`**.

### Park gaps: fill, don’t invent

1. Use **Park** as primary when the chapter covers the topic.
2. If Park is **brief or silent** but the PYQ is standard MD material, **fill the gap** using standard Community Medicine knowledge.
3. **Cross-verify** definitions, programme names, and any numbers against good sources (official MoHFW/WHO/ICMR/NCDC/NHM pages; consistent textbook principles). Record sources in the **report** (not in live Library prose).
4. **Do not hallucinate.** No invented rates, years, doses, or “latest” claims. If a figure cannot be verified after official-source search: **omit it** from proposed live text. Use `NEEDS_AGENT_VERIFY` only inside the review report as a task for the agent/user before apply: **never** in app-facing content.
5. In the report, for each addition note: `Park coverage: full | partial | absent` and `Sources used: …`.
6. Drafts under “Proposed content additions” must already be **reader-ready**: no verify-yourself language. The agent does the verification work before drafting.

### Exam Tip box (mandatory on every new SN/LAQ block)

End every new/expanded exam block with a single full line (format in `references/tag-format.md`). **Prefer blockquote form** so all app builds show a box (not raw tags):

```text
> **EXAM TIP:** …brief framing for the resident…
```

(Alternate on newer builds only: `[EXAMTIP]…[/EXAMTIP]`.)

The tip must tell the reader **how to frame the answer in the exam** (heading order, tables to draw, what not to miss). It must **not** restate the whole answer.

**Forbidden in Exam Tip text:** mark-count or type-prefix artifacts such as `SN (5)`, `LAQ (10)`, `LAQ (10–15)`, `SN HDI (5)`, `5 marks`, `10 marks`, or leading `LAQ/SN on …:`. Question type is already shown by the SN/LAQ badges; the tip is framing only.

Also place the matching `[SN]…[/SN]` and/or `[LAQ]…[/LAQ]` tag(s) **immediately above the answering section** when tagging that topic: **each tag on its own line, each followed by a blank line** (never stack tags on adjacent lines; the text-table heuristic will turn them into a purple 2-column table).

**Forbidden tag placement:** a dump of many SN/LAQ tags at the **start of the leaf before `OVERVIEW` / definitions**. Tags live only next to the content they mark. If no section exists yet, **create the section** from Park/official sources, then tag it.

### Mnemonics (hybrid list-only; no I RECALL)

Apply `references/mnemonics.md`. Rules in short:

1. **Only** for finite high-yield lists residents must memorize (typically **4–10 ordered items**; classic fixed lists of 5–7 are ideal). Not for narrative, definitions, or every section.
2. **House method = hybrid:** prefer classic CM mnemonics when already standard and accurate; else acronym/acrostic when letters map cleanly; else initialism; chunk long lists rather than one bloated cue. **Do not use the I RECALL framework.**
3. **Place** after the list/table it encodes and **before** Exam Tip.
4. **Remove** weak, forced, or list-less mnemonics on apply. Do **not** add a mnemonic that does not actually help recall (sentence paraphrases of a table already on the page, decorative slogans, or a trailing `MNEMONICS` dump that only restates earlier text).
5. **Never** invent facts to force a phrase. Prefer no mnemonic over a bad one. Never add a bottom-of-page `MNEMONICS` index.

Default live format (when a mnemonic is warranted):

```text
**Mnemonic:** WORD
- W: …
- O: …
- R: …
- D: …
```

### Draft quality gate before including in report or applying

- [ ] Matches SN vs LAQ depth above
- [ ] Opens with definition/framework as required
- [ ] No unverified statistics
- [ ] SN/LAQ tags sit **only** above answering sections (no pre-overview tag dump)
- [ ] Mnemonics only for finite high-yield lists of **4–10 items** when warranted (hybrid method; or none); no I RECALL
- [ ] Mnemonic (if any) sits after the list and **before** Exam Tip
- [ ] Ends with Exam Tip (`> **EXAM TIP:** …` preferred)
- [ ] Precise medical English; no AI filler
- [ ] **Acronyms expanded on first use** in each subsection (`Full Name (ACRONYM)`), then short form OK
- [ ] **No textbook name-dropping** ("Park", "Park-aligned", etc.) in live draft text
- [ ] **No em-dashes** (U+2014) or ` -- ` clause dashes
- [ ] **No meta language** in live draft text ("leaf" as a section label, "India hook", "guidebook language", "information not too compressed", prompt residue)
- [ ] **Indian context:** used as the heading for national material (never "India hook.")
- [ ] Definitions and categorisations copied **verbatim from the source**; a following teaching paragraph or bullet is added where the source wording is hard to follow
- [ ] Mnemonics only when they actually help a finite 4–10 item list; no trailing `MNEMONICS` dump

In **report-only** mode, write these full drafts under “Proposed content additions” so apply is copy-paste ready.

## Step 4: SN / LAQ / EXAMTIP colour tags

Use the **fixed** format in `references/tag-format.md` only:

```text
[SN]Topic title[/SN]
[LAQ]Topic title[/LAQ]
[EXAMTIP]Brief exam framing…[/EXAMTIP]
```

| Tag | Border | Background | Label |
|-----|--------|------------|-------|
| SN  | `#0F766E` | `#CCFBF1` | `#115E59` |
| LAQ | `#B45309` | `#FEF3C7` | `#92400E` |
| EXAMTIP | `#4338CA` | `#E0E7FF` | `#3730A3` |

Rules:

1. SN/LAQ: one full line per tag, immediately above the answering section (heading + body for that PYQ).
2. **Never** place a block of SN/LAQ tags before chapter `OVERVIEW` / opening definitions as a “question index.”
3. **Always leave a blank line after every SN/LAQ tag line** before the next tag or heading/body: otherwise `ReadingView` text-table preprocessing can turn `[SN]…` + title into a fake 2-column table.
4. Align titles with PYQ wording when possible.
5. Both SN and LAQ tags allowed if a section serves both.
6. If the answering section is missing, create it from verified sources, then tag it.
7. Exam tip: one full line at the **end** of each new/expanded exam block (prefer `> **EXAM TIP:** …` and a blank line before it). Must render as a box, never as raw `[EXAMTIP]…` body text. **No** `SN (5)` / `LAQ (10)` mark-count prefixes.
8. In the report, list **proposed tag insertions** as exact before/after snippets (file leaf id + surrounding lines).
9. Do not invent alternate colours or markup.

If `ReadingView.js` lacks SN/LAQ/EXAMTIP block styles **or** still folds exam tags into text-tables, restore parser + styles from `references/tag-format.md` before applying tags to live content.

## Step 5: Academic quality (non-factual)

Check and note:

- Section order (overview → definitions → core → Indian context → key points → formulas). Mnemonics sit after the list they encode, not in a trailing dump
- Broken formulas, wrong units, empty “FORMULAS” stubs that should exist
- Contradictions between leaves of the same chapter
- Weak LAQ scaffolding (lists without definitions/frameworks)
- Missing Exam Tip on newly proposed blocks
- **Tag placement:** no SN/LAQ dump before overview; tags only above answering sections
- **Mnemonics (hybrid list-only):** only for finite high-yield lists (**4–10 items**); remove forced/weak/list-less mnemonics; no I RECALL framework (see `references/mnemonics.md`)
- **Acronyms:** first use in each leaf is `Full Name (ACRONYM)`; no bare unexplained programme/disease initialisms
- Encoding glitches / OCR junk

## Step 6: Write the report

Write `bundleDir/review_report.md` with this structure:

```markdown
# Library chapter review: <title> (id=<id>)

- Date / bundle path
- Firebase overrides applied: yes/no + leaf list
- Park PDF used
- PYQ chapter mapping

## Executive summary
(2–5 sentences + counts: critical/major/minor/tag/pyq_gap/verify/mnemonic_add/mnemonic_revise/mnemonic_remove)

## Accuracy findings
### [critical|major|minor] <title>
- Leaf: <id>
- Library says: …
- Park / source says: …
- Recommendation: …
- Official verification: <url or N/A> (only if 100% sure)

## Outdated-fact checks
(table: claim | source checked | verdict update/keep/needs_human_verify)

## PYQ coverage
### Long answers (LQ/LAQ)
| # | Question | Status | Leaf | Action |
### Short notes (SN)
| # | Topic | Status | Leaf | Action |

## Proposed SN/LAQ tags
(exact insertion snippets)

## Proposed content additions (PYQ gaps)
(for each missing/partial: **full MD-exam draft** per Step 3a: not outline-only;
 include Park coverage + sources used; list-only mnemonic after a finite high-yield list only when warranted;
 end each draft with Exam Tip)

## Proposed / revised mnemonics
(for each: leaf id, ordered list items, method, full **Mnemonic:** draft or removal, action add|replace|remove;
 see `references/mnemonics.md`. Prefer omit if no clean list mnemonic)

## Optional apply plan
(ordered surgical edits; do not apply unless user **approves** the report)
```

Also give the user a short in-chat summary with the bundle path and top findings. End report-only runs by asking whether to **approve and ship** (apply + commit + push + Firebase overrides).

## Step 7: Apply + ship (when user approves the report)

**Trigger:** User approves the report or explicitly asks to apply/ship (e.g. “apply all fixes”, “approve”, “publish”, “do it”). Partial apply is allowed if they name a subset.

### 7a: Content apply

1. Edit the **effective** leaf content in `src/data/mockData.json` (respect override-backed text as the baseline when merging).
2. Insert SN/LAQ tags **only above answering sections** (never pre-overview dumps) and full new blocks that pass Step 3a (depth + verified gap-fill + optional list-only mnemonics + Exam Tip).
3. Apply approved mnemonic add/replace/remove actions (list-only; after list, before Exam Tip). Remove weak or list-less mnemonics.
4. Surgical edits only: no drive-by refactors.
5. **Pre-flight:** grep applied text for forbidden reader-offload phrases (`verify latest`, `exam year`, `confirm yourself`, `NEEDS_`, "commonly taught; confirm", etc.), **textbook name-dropping** (`Park`, `park-aligned`), **em-dashes** (U+2014, ` -- `), **`India hook`**, and live-text **`leaf`** as a section label. Remove all hits before ship. Confirm **acronyms expand on first use** in each changed subsection. Confirm definitions/categorisations are verbatim and that hard source wording has a following teaching explanation.
6. Live text must be **authoritative finished prose**. Verification is the agent's job before publish, not the subscriber's.

### 7b: Git commit + push (**always** on approval)

Do this for every approved apply that changes repo files (at minimum `mockData.json`; include skill/docs only if this session changed them for the same work):

1. `git status` / `git diff` / `git log -5 --oneline` (parallel) per repo commit rules.
2. Stage **only** files that belong to this library-review apply (never unrelated dirty files: graphify-out, unrelated scripts, secrets).
3. Commit with a clear message (why: chapter id + what shipped).
4. **`git push`** to the tracked remote branch (usually `origin/main`): **required** on approval so GitHub matches what production overrides ship against.
5. Never force-push unless the user explicitly requests it.

### 7c: Firebase overrides (**always** on approval)

Publish **every changed leaf** to Firestore `libraryContentOverrides`:

```bash
python scripts/publish_library_override.py <leafId> --reason "ChN library review apply: <short summary>"
```

- Repeat for each leaf id (e.g. `3-1` … `3-6`).
- Confirm each response: `ok: true`, `status: "active"`, sensible `contentLen`, **`markAsNew: false`** (default).
- Overrides make content visible in the app **without** a native rebuild (app merges active/approved overrides at runtime).

**Progress / NEW badge (mandatory for this skill):**

- Library chapter review is a **silent quality edit**. Do **not** pass `--mark-as-new`.
- Do **not** set `recentlyUpdated: true` on mockData leaves for review applies.
- Do **not** fill `updatedSegments` unless the user explicitly wants a NEW badge and in-app highlight for a product announcement.
- Default publish payload uses `markAsNew: false` so users who already read the chapter **keep their progress and checkmark** (no NEW reset).
- Only use `python scripts/publish_library_override.py <leafId> --mark-as-new ...` if the user explicitly asks to announce the change as a Library update.

### 7d: EAS Update (**ask first**: never auto-run)

Library **body text** for overridden leaves does **not** need `eas update`.

**Ask the user before any `eas update`** if (and only if) something outside override-backed leaf text must ship for the change to work, e.g.:

- `ReadingView.js` / SN-LAQ-EXAMTIP renderer or styles
- App navigation, contentRegistry merge logic, or other JS that does not come from Firestore overrides
- Assets/config that are only in the JS bundle

If unsure whether OTA is required, **ask** rather than publish OTA. If they approve OTA, follow `Agents.md` EAS protocol (commit + push already done in 7b; then channel/branch checks, `--branch main`, `--clear-cache` as per project EAS docs).

### 7e: Close-out message

After ship, report:

| Item | Value |
|------|--------|
| Leaves edited | ids |
| Git commit | hash + pushed yes/no |
| Firebase overrides | leaf ids + active |
| EAS update | not needed / asked user / ran after approval |
| App check | force-close & reopen Library for the chapter |

## Success criteria

### Report-only

- [ ] Bundle loaded with Firebase merge attempted
- [ ] Park PDF matched and used
- [ ] PYQ LQ+SN mapped with statuses
- [ ] Accuracy findings severity-tagged
- [ ] Outdated claims web-checked against official sources; updates only at 100% confidence
- [ ] SN/LAQ tags proposed in fixed format/colours
- [ ] Every proposed new SN/LAQ block is MD-exam depth for its type
- [ ] Park gaps filled only with non-hallucinated, cross-verified material (sources noted **in the report**)
- [ ] Every new/expanded exam block ends with Exam Tip
- [ ] SN/LAQ tags only above answering sections (no pre-overview tag dump)
- [ ] Mnemonics only for finite high-yield lists when they actually help recall; weak/list-less/slogan/trailing-dump ones removed or proposed for removal
- [ ] No meta language in proposed live content ("leaf" as a section label, "India hook", writing-process labels)
- [ ] Definitions and categorisations verbatim from source; hard source wording followed by a teaching explanation
- [ ] No I RECALL framework required; method per `mnemonics.md`
- [ ] No reader-offload / "verify yourself" language in proposed live content
- [ ] No "Park" / textbook name-dropping in proposed live content
- [ ] No em-dashes in proposed live content
- [ ] Acronyms expanded on first use in proposed live content (per leaf)
- [ ] `review_report.md` written under the bundle directory
- [ ] No live content mutation unless user approved

### On approval (additional)

- [ ] `mockData.json` (and related apply files) updated
- [ ] Pre-flight: no reader-offload phrases, no textbook name-dropping, no em-dashes, acronyms expanded on first use in shipped text
- [ ] **Git commit completed**
- [ ] **Git push completed** to remote tracking branch
- [ ] **Firebase overrides published** (`status: active`) for **every** changed leaf
- [ ] **EAS update not run** unless required: and if required, **user asked first**
- [ ] Close-out summary given to user
