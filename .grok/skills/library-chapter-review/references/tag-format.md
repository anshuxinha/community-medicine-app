# SN / LAQ fixed tag format

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

## Placement rules

1. Put the tag on its **own line**, immediately **above** the section that answers that PYQ.
2. Topic title inside the tag should match the PYQ wording closely (or a clear shortened form).
3. One tag per discrete exam topic. Prefer multiple SN tags over one vague LAQ tag.
4. Do **not** nest tags. Do **not** put other markup inside the tag body.
5. If a section serves **both** SN and LAQ (common for “Levels of prevention”), place **both** tags on consecutive lines, SN first then LAQ.
6. Optional: after the tag line, keep the existing ALL-CAPS section heading so navigation stays clear.

### Example

```text
[SN]Levels of prevention[/SN]
[LAQ]Levels of Prevention and Modes of Intervention[/LAQ]
LEVELS OF PREVENTION & MODES OF INTERVENTION
- Primordial Prevention: ...
```

## Renderer

`ReadingView.js` parses full-line `[SN]…[/SN]` and `[LAQ]…[/LAQ]` into coloured badge blocks. If those styles are missing, restore them from this file before publishing tagged content.
