# Library mnemonics (I RECALL technique)

Source technique: *How to Make Better Mnemonics!* (Memorable Psychiatry and Neurology) — video framework **I RECALL**. Use this when proposing or applying Library content so high-yield lists stick for MD theory exams (SN/LAQ/viva), not as decoration.

Mnemonics are a **stepping stone**, not a substitute for understanding. The ones residents remember best are clear, situation-linked, and lean.

## I RECALL checklist (every proposed mnemonic must pass)

| Letter | Criterion | Meaning for Library reviews |
|--------|-----------|-----------------------------|
| **I** | **Important** | Only for high-yield exam material (definitions criteria, classic lists, steps, classifications, differential pivots). Skip trivia and low-stakes lists. Use sparingly: like a highlighter, not a yellow page. |
| **R** | **Relevant** | Maps to a real use moment: SN/LAQ write-up, viva, or standard clinical/public-health decision. Prefer near-term exam/practice use over “lifetime knowledge” fluff. |
| **E** | **Emotional** | Prefer vivid, amusing, surprising, or slightly provocative imagery over dry labels. If the phrase feels boring, rewrite it. |
| **C** | **Contrasting** | Distinct from other mnemonics in the same chapter/domain. Avoid overused shells that collide across topics (especially generic `ABCDE`, `PQRST`, or endless same-letter lists unless the domain already owns that shell). |
| **A** | **Associable** | Each letter/word must map to the **key** concept word, not a filler adjective. Prefer “Renal” over “Acute…” when renal failure is the point. Avoid muddying the same letter for multiple unrelated items when possible. Thesaurus synonyms are allowed when they stay clinically accurate (e.g. hepatic ↔ liver). |
| **L** | **Linked** | The mnemonic itself must cue the **topic** under exam stress (embed the disease/drug/programme/concept in the phrase or acronym: e.g. topic word as the acronym when it fits). Purely arbitrary phrases with no topic hook fail this gate. |
| **L** | **Lean** | As long as needed, no longer. Prefer **≤9 items**. Lists of 10+ only when the material truly demands it (e.g. fixed canonical series you cannot drop). Split into two lean mnemonics rather than one bloated one when possible. |

### Hard gates (fail → do not ship)

1. Wrong clinical/public-health mapping (letter stands for the wrong item).
2. Invented facts to force a clever phrase.
3. Not linked to the topic (unrelated witty sentence the resident cannot cue from the question stem).
4. Purely decorative: topic is not high-yield or has no clear exam use moment.
5. Collides with another mnemonic already in the same leaf for a different list (confusable shells).

### Soft preferences

- Prefer **acronyms / acrostics** whose whole word links to the topic (`TRAUMA` for PTSD-style criteria lists) over random sentences.
- Prefer **name-embedded** cues when the stem is a programme, act, index, or named method.
- Prefer **one mnemonic per discrete list**, placed next to that list.
- Keep Hindi/hinglish only if it is already a local high-yield tradition **and** letters remain associable for English exam wording; otherwise use clear English.
- Never use em-dashes in mnemonic expansions (house rule). Use colons, commas, or hyphens in compounds only.

## When to insert (during `/library-chapter-review`)

Add or propose a mnemonic when **all** of the following hold:

1. The block is (or will be) an SN/LAQ answerable list, criteria set, steps, classification limbs, or classic compare list.
2. Residents routinely need ordered recall under time pressure.
3. No accurate mnemonic already exists for that list in the leaf (or the existing one fails I RECALL / is factually wrong).
4. You can write a version that passes every I RECALL letter above.

**Do not** force a mnemonic onto:

- Narrative history, single definitions, long prose without a finite list
- Unverified statistics or time-sensitive numbers
- Topics where a table/framework is the better exam tool and a mnemonic adds nothing

## Placement in live Library text

### Preferred: immediately after the list it encodes, before Exam Tip

Order inside an exam block:

1. `[SN]` / `[LAQ]` tags (each on its own line + blank line)
2. Heading + definition/framework body
3. The list / table / steps
4. **Mnemonic block** (this file)
5. `> **EXAM TIP:** …`

### Format A (default: portable, matches Exam Tip family)

One blockquote line for the cue phrase, then plain expansion bullets (not inside the tip):

```text
**Mnemonic:** TRAUMA
- T: Trauma / exposure
- R: Re-experiencing (intrusions)
- A: Avoidance
- U: Unable to function (negative mood/cognition, disability)
- M: Month or longer duration
- A: Arousal / hyperarousal
```

Alternate single-line form when the expansion is short (colon or parentheses only; never an em-dash):

```text
**Mnemonic:** DM-MAM (IMNCI major conditions): Diarrhoea, Malnutrition, Measles, ARI/pneumonia, Malaria
```

### Format B (chapter “MNEMONICS” section)

If a leaf already has a `MNEMONICS` heading (ReadingView treats it as a section head), append there **and** keep a short cue next to the primary list when the list is far from that section:

```text
MNEMONICS

- PTSD criteria: TRAUMA
  - T: Trauma / exposure
  - R: Re-experiencing
  - A: Avoidance
  - U: Unable to function
  - M: Month or longer
  - A: Arousal
```

### Format C (inline after a bullet list)

```text
- Item one
- Item two
- Item three
(Mnemonic: WORD → expansion in order)
```

Use Format A for new review-written blocks. Use B/C only when matching an existing leaf style.

## Appraisal of existing mnemonics (Step 5)

When auditing a leaf:

| Verdict | Action |
|---------|--------|
| Passes I RECALL + factually correct | Keep; optional polish for associability/lean |
| Factually wrong | **critical/major**: fix or remove |
| Important topic but weak (not linked, not emotional, bloated, letter collision) | Propose **revised** mnemonic in report; apply on approval |
| Low-importance or no use moment | Propose **removal** (Important gate) |
| Overused shell colliding with another list | Rewrite for Contrast + Link |

In the **report**, score each kept/proposed mnemonic against I RECALL (one line: `I✓ R✓ E~ C✓ A✓ L✓ L✓` style is fine).

## Writing workflow (agent)

1. Extract the ordered list of items the resident must recall.
2. Drop any item that is not needed for the exam use moment (Important + Relevant + Lean).
3. Build candidates that are **Linked** to the topic word/name first; only then optimize emotion/contrast.
4. Check each letter for **Associable** key words; swap synonyms if needed without changing medical meaning.
5. Read it aloud: if it is dull, boost **Emotional** imagery without breaking accuracy.
6. Ensure it does not collide with other mnemonics in the same chapter (**Contrasting**).
7. Cap length (**Lean**).
8. Place with Format A after the list, before Exam Tip.
9. Note in the report: items covered, I RECALL self-score, and why the cue is linked to the topic.

## Report section (required when any mnemonic work applies)

```markdown
## Proposed / revised mnemonics
### <topic> (leaf <id>)
- Use moment: SN | LAQ | viva | clinical
- Items (ordered): …
- Draft:
  **Mnemonic:** …
  - …
- I RECALL: I / R / E / C / A / L(linked) / L(lean)
- Action: add | replace existing | remove existing
```

## Anti-patterns (from the source technique)

| Anti-pattern | Fix |
|--------------|-----|
| Mnemonic for everything (yellow highlighter page) | Keep only high-yield lists |
| Lifetime-risk lists when the decision is near-term | Reframe items to the actual exam/clinical question |
| Dry “three Xs” with no imagery | Add vivid linked image/word |
| Same ABCDE shell for unrelated topics | Unique, topic-linked phrase |
| Letter stands for a weak adjective, not the key noun | Re-letter from the key word |
| Clever phrase with no topic hook | Embed topic name/concept in the cue |
| 12+ item dump when list can split | Split or cut non-essential items |

## Voice rules (same as rest of skill)

- No textbook name-dropping (“Park”) in live mnemonic text.
- No em-dashes (U+2014) or ` -- ` clause dashes.
- No “verify yourself” / reader-offload language.
- No invented rates, years, doses, or programme facts to force a rhyme.
