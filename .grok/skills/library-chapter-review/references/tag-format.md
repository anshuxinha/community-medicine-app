# SN / LAQ / EXAMTIP fixed tag format

Use **exactly** these markers in Library content (one full line each), same family as existing `[REF]…[/REF]`:

## Short Note (SN)

```text
[SN]Exact short-note topic title[/SN]
```

**Fixed colours (do not invent alternatives):**

| Token | Border | Background | Label text |
|-------|--------|------------|------------|
| SN    | `#0F766E` | `#CCFBF1` | `#115E59` |

## Long Answer Question (LAQ)

```text
[LAQ]Exact long-answer topic title[/LAQ]
```

**Fixed colours (do not invent alternatives):**

| Token | Border | Background | Label text |
|-------|--------|------------|------------|
| LAQ   | `#B45309` | `#FEF3C7` | `#92400E` |

## Exam Tip box (EXAMTIP)

Place at the **end** of every **new or substantially expanded** SN/LAQ content block. Brief only — how to frame the answer in the exam, not a second content dump.

```text
[EXAMTIP]SN (5 marks): Definition (WHO) → 6–8 bullets on classification + features → 1 India/programme line. Skip history essays.[/EXAMTIP]
```

```text
[EXAMTIP]LAQ (10 marks): Intro/definition → classification table → elaborate each limb with example → national programmes → 2-line conclusion. Aim structured headings, not paragraphs of fluff.[/EXAMTIP]
```

**Fixed colours (do not invent alternatives):**

| Token   | Border | Background | Label text |
|---------|--------|------------|------------|
| EXAMTIP | `#4338CA` | `#E0E7FF` | `#3730A3` |

**Rules for Exam Tip content**

1. One full line: `[EXAMTIP]…[/EXAMTIP]` (keep tip text concise; one or two sentences).
2. State question type and typical marks when known (SN ~5 / LAQ ~10).
3. Give **answer frame only**: heading order, what table to draw, what not to miss.
4. Do not repeat the full academic content inside the tip.
5. Always pair with the SN/LAQ section it serves (tip goes **after** the section body).

## Placement rules

1. Put SN/LAQ tags on their **own line**, immediately **above** the section that answers that PYQ.
2. **Blank line after every SN/LAQ tag block** (and before the ALL-CAPS/section heading). Required so the text-table heuristic in `ReadingView` does not treat `[SN]…` + title as a 2-column table.
3. Topic title inside SN/LAQ tags should match the PYQ wording closely (or a clear shortened form).
4. One tag per discrete exam topic. Prefer multiple SN tags over one vague LAQ tag.
5. Do **not** nest tags. Do **not** put other markup inside the tag body.
6. If a section serves **both** SN and LAQ (common for “Levels of prevention”), place **both** tags on consecutive lines, SN first then LAQ, then a blank line, then the heading.
7. Optional: after the SN/LAQ tag line(s) + blank line, keep the existing ALL-CAPS section heading so navigation stays clear.
8. Place `[EXAMTIP]…[/EXAMTIP]` on its **own single line** at the **end** of that section’s new content (after body, blank line preferred, before the next major heading). Keep the whole tip on one line so the full-line parser matches.

### Example

```text
[SN]Levels of prevention[/SN]
[LAQ]Levels of Prevention and Modes of Intervention[/LAQ]

LEVELS OF PREVENTION & MODES OF INTERVENTION
- Primordial Prevention: ...
- Primary Prevention: ...
- Secondary Prevention: ...
- Tertiary Prevention: ...

[EXAMTIP]LAQ (10): Define prevention → table of 4 levels × mode of intervention + example each → link to national programmes → close with “levels are complementary”. SN: definition + 4 levels with one example each.[/EXAMTIP]
```

## Renderer (do not regress)

`ReadingView.js` must:

1. Parse full-line `[SN]…[/SN]`, `[LAQ]…[/LAQ]`, and `[EXAMTIP]…[/EXAMTIP]` into coloured badge/box blocks (`exam_sn`, `exam_laq`, `exam_tip`).
2. **Exclude** exam-markup lines from `preprocessTextTables` / `parseTextTable` (never convert `[SN]`/`[LAQ]` + heading into a markdown table).
3. Render EXAMTIP as an indigo left-border box with an **EXAM TIP** badge — never as raw body text showing the brackets.

If those styles or exclusions are missing, restore them from this file before publishing tagged content.

| Token   | Border | Background | Label text |
|---------|--------|------------|------------|
| SN      | `#0F766E` | `#CCFBF1` | `#115E59` |
| LAQ     | `#B45309` | `#FEF3C7` | `#92400E` |
| EXAMTIP | `#4338CA` | `#E0E7FF` | `#3730A3` |
