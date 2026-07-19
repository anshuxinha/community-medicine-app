---
name: library-chapter-review
description: >
  Review accuracy and exam-quality of a Library chapter (latest Firebase
  libraryContentOverrides + mockData) against Park textbook PDFs in
  D:\Study Related\Books\Park Split and MD Community Medicine PYQs in
  categorized_questions_report.md. Tags SN/LAQ sections with fixed colour
  markers, requires MD-exam-depth new content with Exam Tip boxes, fills
  Park gaps only with verified knowledge, flags outdated facts only when
  verified from official sources, and suggests PYQ content gaps. Use when
  the user runs /library-chapter-review, /chapter-review, "review library
  chapter", "check chapter accuracy", "audit Park chapter", or asks to
  quality-check a specific Library chapter for MD exam prep.
metadata:
  short-description: "QA Library chapters vs Park + PYQs (SN/LAQ + Exam Tip)"
---

# /library-chapter-review — Library chapter accuracy & exam quality

Review one Library chapter for an **MD Community Medicine resident** exam prep standard: factual accuracy, academic structure, PYQ coverage, fixed SN/LAQ colour tags, and **exam-ready new content** (depth + Exam Tip).

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

**On approval (mandatory ship path):** apply content → **git commit + git push** → **Firebase `libraryContentOverrides` for every changed leaf**. **Do not** run `eas update` unless required for non-override reasons — and if it is required, **ask the user first**.

## Fixed paths

Read `references/paths.md`. Critical paths:

| What | Where |
|------|--------|
| Effective content | `mockData.json` **merged with** Firestore `libraryContentOverrides` |
| Park reference | `D:\Study Related\Books\Park Split\` (match by chapter number or name) |
| PYQs | `D:\IGIMS\Major Tests & Question Papers\categorized_questions_report.md` |
| Rubric | `references/quality-rubric.md` |
| SN/LAQ/EXAMTIP tags | `references/tag-format.md` |

## Step 0 — Resolve chapter and load bundle

Run from app root (`D:\The App`):

```bash
python .grok/skills/library-chapter-review/scripts/load_chapter_bundle.py "<chapter>"
```

Optional flags:

- `--no-firebase` — mockData only (if offline / no service account)
- `--no-pdf-text` — skip PDF text extract (path match only)
- `--out <dir>` — custom output root

The script prints JSON with `bundleDir`. Then:

1. Read `bundleDir/manifest.json`
2. Read every `bundleDir/content/*.txt` leaf (these already include **active Firebase overrides** when available)
3. Read `bundleDir/park_reference.txt` if present; otherwise open the PDF path from the manifest with the PDF reader tool
4. Read `bundleDir/pyqs.json` (LQ / SN / MCQ lists for the matched Park chapter)

If Park PDF matching fails, list available files under Park Split and retry by number/title before proceeding.

If Firebase fails, say so clearly and continue with mockData (note reduced confidence for leaves that may be overridden in production).

## Step 1 — Audience & quality bar

Apply `references/quality-rubric.md`.

Content must support:

- **Short notes (SN):** definition → 6–12 high-yield bullets → India/programme hook → **Exam Tip box**
- **Long answers (LAQ/LQ):** definition → framework/classification → elaboration → national context → conclusion → **Exam Tip box**

Depth = MD theory exam, not UG one-liners and not textbook chapter rewrites.

**When proposing or applying any new content**, the draft must be something a final-year MD Community Medicine resident could write from under exam conditions for that question type (see Step 3a and rubric §C).

## Step 2 — Accuracy audit (vs Park + official sources)

For each leaf:

1. Compare definitions, classifications, cut-offs, doses, schedules, programme names, and classic exam numbers against **Park text** for that chapter.
2. Flag mismatches as `critical` / `major` / `minor` with short quotes from Library vs Park.
3. **Time-sensitive / possibly outdated** facts (either side):
   - Web-search **official** sources only (MoHFW, NHM, NCDC, ICMR, WHO fact sheets, Gazette, IPHS, NFHS, SRS, Census).
   - Propose an update **only if 100% sure** and the official document clearly supersedes the text.
   - Always include in the **report**: claim → official source name → date → URL → exact suggested replacement sentence.
   - If not certain after search: label `NEEDS_AGENT_VERIFY` in the **report only** and **do not** invent a correction. Then **you** (the agent) must resolve it with further official sources before any apply, or **omit** the claim. Never pass uncertainty to the app reader.
4. Never use coaching blogs or random MCQ sites as sole authority for factual updates.

### Live content is paid product — never offload verification to the reader

Residents pay for **finished, trustworthy Library text**. All of the following are **forbidden** in any text that will be written to `mockData.json`, Firebase overrides, SN/LAQ bodies, headings, or Exam Tips:

- “Verify latest circular / schedule / guideline”
- “Confirm for your exam year / exam sitting”
- “Check MoHFW yourself” / “readers should verify”
- “Content below may be outdated — verify”
- Soft hedges that dump work on the reader: “commonly taught; confirm locally”, “name year only if verified”, “cite current version in viva; do not invent…”
- Leaving `NEEDS_HUMAN_VERIFY` / `NEEDS_AGENT_VERIFY` tokens in live content

**Allowed:** factual statements the agent has already checked (e.g. “JE vaccine in endemic districts only” from the official NIS).  
**Allowed in Exam Tips only:** how to **structure the answer** (order of headings, tables to draw) — not “go verify this fact”.  
**If a figure cannot be verified:** omit it or use qualitative wording the agent can defend — never tell the reader to verify.

## Step 3 — PYQ coverage map

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

## Step 3a — Writing new content (mandatory for every gap fill)

Whenever the review **proposes** or **applies** new/expanded text for a PYQ gap:

### Depth by question type

| Type | Minimum usable answer |
|------|------------------------|
| **SN** | Definition (with authority) + 6–12 high-yield points + India/programme hook when relevant. Length ≈ ½–1 exam page. |
| **LAQ/LQ** | Definition → classification/framework (table preferred) → elaborate each limb with examples → national context → short conclusion. Length ≈ 1½–3 exam pages of scannable scaffold (not fluff). |

Full rules: `references/quality-rubric.md` §C1–C2.

### Park gaps — fill, don’t invent

1. Use **Park** as primary when the chapter covers the topic.
2. If Park is **brief or silent** but the PYQ is standard MD material, **fill the gap** using standard Community Medicine knowledge.
3. **Cross-verify** definitions, programme names, and any numbers against good sources (official MoHFW/WHO/ICMR/NCDC/NHM pages; consistent textbook principles). Record sources in the **report** (not in live Library prose).
4. **Do not hallucinate.** No invented rates, years, doses, or “latest” claims. If a figure cannot be verified after official-source search: **omit it** from proposed live text. Use `NEEDS_AGENT_VERIFY` only inside the review report as a task for the agent/user before apply — **never** in app-facing content.
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

Also place the matching `[SN]…[/SN]` and/or `[LAQ]…[/LAQ]` tag(s) above the section when tagging that topic — **each tag on its own line, each followed by a blank line** (never stack tags on adjacent lines; the text-table heuristic will turn them into a purple 2-column table).

### Draft quality gate before including in report or applying

- [ ] Matches SN vs LAQ depth above
- [ ] Opens with definition/framework as required
- [ ] No unverified statistics
- [ ] Ends with `[EXAMTIP]…[/EXAMTIP]`
- [ ] Precise medical English; no AI filler

In **report-only** mode, write these full drafts under “Proposed content additions” so apply is copy-paste ready.

## Step 4 — SN / LAQ / EXAMTIP colour tags

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

1. SN/LAQ: one full line per tag, immediately above the answering section.
2. **Always leave a blank line after SN/LAQ tag block(s)** before the section heading/body — otherwise `ReadingView` text-table preprocessing can turn `[SN]…` + title into a fake 2-column table.
3. Align titles with PYQ wording when possible.
4. Both SN and LAQ tags allowed if a section serves both.
5. Exam tip: one full line at the **end** of each new/expanded exam block (prefer `> **EXAM TIP:** …` and a blank line before it). Must render as a box, never as raw `[EXAMTIP]…` body text. **No** `SN (5)` / `LAQ (10)` mark-count prefixes.
6. In the report, list **proposed tag insertions** as exact before/after snippets (file leaf id + surrounding lines).
7. Do not invent alternate colours or markup.

If `ReadingView.js` lacks SN/LAQ/EXAMTIP block styles **or** still folds exam tags into text-tables, restore parser + styles from `references/tag-format.md` before applying tags to live content.

## Step 5 — Academic quality (non-factual)

Check and note:

- Section order (overview → definitions → core → programmes/India → key points → formulas/mnemonics)
- Broken formulas, wrong units, empty “FORMULAS” stubs that should exist
- Contradictions between leaves of the same chapter
- Weak LAQ scaffolding (lists without definitions/frameworks)
- Missing Exam Tip on newly proposed blocks
- Encoding glitches / OCR junk

## Step 6 — Write the report

Write `bundleDir/review_report.md` with this structure:

```markdown
# Library chapter review: <title> (id=<id>)

- Date / bundle path
- Firebase overrides applied: yes/no + leaf list
- Park PDF used
- PYQ chapter mapping

## Executive summary
(2–5 sentences + counts: critical/major/minor/tag/pyq_gap/verify)

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
(for each missing/partial: **full MD-exam draft** per Step 3a — not outline-only;
 include Park coverage + sources used; end each draft with [EXAMTIP]…[/EXAMTIP])

## Optional apply plan
(ordered surgical edits; do not apply unless user **approves** the report)
```

Also give the user a short in-chat summary with the bundle path and top findings. End report-only runs by asking whether to **approve and ship** (apply + commit + push + Firebase overrides).

## Step 7 — Apply + ship (when user approves the report)

**Trigger:** User approves the report or explicitly asks to apply/ship (e.g. “apply all fixes”, “approve”, “publish”, “do it”). Partial apply is allowed if they name a subset.

### 7a — Content apply

1. Edit the **effective** leaf content in `src/data/mockData.json` (respect override-backed text as the baseline when merging).
2. Insert SN/LAQ tags and full new blocks that pass Step 3a (depth + verified gap-fill + Exam Tip).
3. Surgical edits only — no drive-by refactors.
4. **Pre-flight:** grep applied text for forbidden reader-offload phrases (`verify latest`, `exam year`, `confirm yourself`, `NEEDS_`, “commonly taught; confirm”, etc.) and remove them before ship.
5. Live text must be **authoritative finished prose** — verification is the agent’s job before publish, not the subscriber’s.

### 7b — Git commit + push (**always** on approval)

Do this for every approved apply that changes repo files (at minimum `mockData.json`; include skill/docs only if this session changed them for the same work):

1. `git status` / `git diff` / `git log -5 --oneline` (parallel) per repo commit rules.
2. Stage **only** files that belong to this library-review apply (never unrelated dirty files: graphify-out, unrelated scripts, secrets).
3. Commit with a clear message (why: chapter id + what shipped).
4. **`git push`** to the tracked remote branch (usually `origin/main`) — **required** on approval so GitHub matches what production overrides ship against.
5. Never force-push unless the user explicitly requests it.

### 7c — Firebase overrides (**always** on approval)

Publish **every changed leaf** to Firestore `libraryContentOverrides`:

```bash
python scripts/publish_library_override.py <leafId> --reason "ChN library review apply: <short summary>"
```

- Repeat for each leaf id (e.g. `3-1` … `3-6`).
- Confirm each response: `ok: true`, `status: "active"`, sensible `contentLen`.
- Overrides make content visible in the app **without** a native rebuild (app merges active/approved overrides at runtime).

### 7d — EAS Update (**ask first** — never auto-run)

Library **body text** for overridden leaves does **not** need `eas update`.

**Ask the user before any `eas update`** if (and only if) something outside override-backed leaf text must ship for the change to work, e.g.:

- `ReadingView.js` / SN-LAQ-EXAMTIP renderer or styles
- App navigation, contentRegistry merge logic, or other JS that does not come from Firestore overrides
- Assets/config that are only in the JS bundle

If unsure whether OTA is required, **ask** rather than publish OTA. If they approve OTA, follow `Agents.md` EAS protocol (commit + push already done in 7b; then channel/branch checks, `--branch main`, `--clear-cache` as per project EAS docs).

### 7e — Close-out message

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
- [ ] No reader-offload / “verify yourself” language in proposed live content
- [ ] `review_report.md` written under the bundle directory
- [ ] No live content mutation unless user approved

### On approval (additional)

- [ ] `mockData.json` (and related apply files) updated
- [ ] Pre-flight: no reader-offload phrases in shipped text
- [ ] **Git commit completed**
- [ ] **Git push completed** to remote tracking branch
- [ ] **Firebase overrides published** (`status: active`) for **every** changed leaf
- [ ] **EAS update not run** unless required — and if required, **user asked first**
- [ ] Close-out summary given to user
