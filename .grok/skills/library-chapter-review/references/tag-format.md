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

## Exam Tip box

Place at the **end** of every **new or substantially expanded** SN/LAQ content block. Brief only — how to frame the answer in the exam, not a second content dump.

### Preferred (portable — works even without a JS OTA)

```text
> **EXAM TIP:** Open with WHO definition → 6–8 bullets on classification + features → one India/programme line. Skip history essays.
```

```text
> **EXAM TIP:** Intro/definition → classification table → elaborate each limb → national programmes → short conclusion. Prefer structured headings over fluff.
```

Older app builds still render this as a blockquote box; newer builds map it to the dedicated indigo **EXAM TIP** badge box.

### Alternate (newer builds only — avoid for live content until renderer is confirmed)

```text
[EXAMTIP]Open with WHO definition → 6–8 bullets on classification + features → one India/programme line.[/EXAMTIP]
```

**Fixed colours (do not invent alternatives):**

| Token   | Border | Background | Label text |
|---------|--------|------------|------------|
| EXAMTIP | `#4338CA` | `#E0E7FF` | `#3730A3` |

**Rules for Exam Tip content**

1. Prefer one full line blockquote `> **EXAM TIP:** …`.
2. Give **answer frame only**: heading order, what table to draw, what not to miss.
3. Do not repeat the full academic content inside the tip.
4. Always pair with the SN/LAQ section it serves (tip goes **after** the section body; blank line before tip).
5. **Do not invent or show mark-count artifacts** such as `SN (5)`, `LAQ (10)`, `LAQ (10–15)`, `SN HDI (5)`, or `5 marks` / `10 marks` prefixes. The SN/LAQ coloured tags already mark question type; the tip is framing only.
6. Avoid leading labels like `SN:`, `LAQ:`, or `LAQ/SN on …:` unless they are necessary clinical wording inside the frame.

## Placement rules

1. Put SN/LAQ tags on their **own line**, immediately **above** the section that answers that PYQ.
2. **Blank line after every individual SN/LAQ tag line** — including between two consecutive tags. Required so the text-table heuristic never treats `[SN]A[/SN]` + `[SN]B[/SN]` or `[SN]…` + title as a 2-column table.
3. Topic title inside SN/LAQ tags should match the PYQ wording closely (or a clear shortened form).
4. One tag per discrete exam topic. Prefer multiple SN tags over one vague LAQ tag.
5. Do **not** nest tags. Do **not** put other markup inside the tag body.
6. If a section serves **both** SN and LAQ, place SN then LAQ **each followed by a blank line**, then the heading.
7. Optional: after tags + blank line, keep the existing ALL-CAPS section heading so navigation stays clear.
8. Exam tip: prefer `> **EXAM TIP:** …` on its own line at the **end** of the section (blank line before it).

### Example

```text
[SN]Levels of prevention[/SN]

[LAQ]Levels of Prevention and Modes of Intervention[/LAQ]

LEVELS OF PREVENTION & MODES OF INTERVENTION
- Primordial Prevention: ...
- Primary Prevention: ...
- Secondary Prevention: ...
- Tertiary Prevention: ...

> **EXAM TIP:** Define prevention → table of 4 levels × mode of intervention + example each → link to national programmes → close with “levels are complementary”. For short notes: definition + 4 levels with one example each.
```

## Renderer (do not regress)

`ReadingView.js` must:

1. Parse full-line `[SN]…[/SN]`, `[LAQ]…[/LAQ]`, and `[EXAMTIP]…[/EXAMTIP]` into coloured badge/box blocks (`exam_sn`, `exam_laq`, `exam_tip`).
2. Map blockquotes starting with `**EXAM TIP:**` / `EXAM TIP:` to `exam_tip` as well.
3. **Skip** `preprocessTextTables` entirely when content contains exam markup tags.
4. **Exclude** exam-markup lines from `parseTextTable` (never convert `[SN]`/`[LAQ]` + heading into a markdown table).
5. Render exam tips as an indigo left-border box with an **EXAM TIP** badge — never as raw `[EXAMTIP]…` body text.

If those styles or exclusions are missing, restore them from this file before publishing tagged content.

| Token   | Border | Background | Label text |
|---------|--------|------------|------------|
| SN      | `#0F766E` | `#CCFBF1` | `#115E59` |
| LAQ     | `#B45309` | `#FEF3C7` | `#92400E` |
| EXAMTIP | `#4338CA` | `#E0E7FF` | `#3730A3` |
