# Purposeful Placement Audit

I reviewed the full `src/data/mockData.json` tree with the goal of adding images only where they materially improve comprehension, recall, or navigation.

## Framework used

An image is worth placing only if it does at least one of these jobs:

- Compresses a long sequence into a single visual timeline or flow.
- Separates concepts that learners commonly confuse.
- Converts a high-stakes recall list into a memorable chart.
- Shows a cycle, framework, or relationship that is harder to retain as prose.
- Supports a graph- or process-based topic where text alone is inefficient.

An image is **not** added when it would only decorate:

- Short factual lists.
- Definition-heavy topics already easy to scan.
- Legal/history paragraphs with no process or structure to visualize.
- Topics where a picture would repeat the text without clarifying anything new.

## Full-content findings

Across the 123 leaf reading topics, the strongest image opportunities cluster into these patterns:

- Timelines: history of medicine, health reforms, programme evolution.
- Framework maps: concept of health, determinants, community diagnosis, ethics frameworks.
- Process flows: chain of infection, cold chain, water purification, screening pathways.
- Compare/contrast boards: epidemiological study designs, contraceptive methods, filter types.
- Color-coded or category charts: biomedical waste, triage, vector identification, program hierarchies.
- Cycles and loops: disaster cycle, natural history of disease, surveillance-response loops.
- Graph-heavy statistics: distributions, charts, correlation, hypothesis testing.
- Spatial or stage-based recall topics: growth milestones, maternal cycle, demographic transition.

## Initial batch added now

These were chosen because they are high-yield, broadly useful, and fit the framework strongly:

- `theory:1` `Man and Medicine`: evolution timeline.
- `theory:2` `Concept of Health and Disease`: concept-dimensions-determinants framework.
- `theory:3-3` `Analytical Epidemiology`: study design comparison board.
- `theory:3-5` `Infectious Disease Epidemiology`: chain of infection.
- `theory:3-6` `Immunization...`: cold chain ladder.
- `theory:15-2` `Water Purification & Quality`: purification flow.
- `theory:16` `Hospital Waste Management`: BMW segregation chart.
- `theory:17` `Disaster Management`: disaster cycle.
- `theory:26-1`, `26-2`, `26-3`, `26-4`, `26-5`, `26-7`: existing biostat visuals were surfaced through the new illustration layer so they render in-app.

## Good next candidates

If you want the second batch, the next most valuable topics are:

- `theory:3-1` morbidity and mortality measures.
- `theory:4` screening framework and test validity relationships.
- `theory:8-4` and `theory:8-5` contraception method comparison charts.
- `theory:9-3` and `theory:9-4` development milestones and growth charts.
- `theory:14` SDG structure map.
- `theory:15-6` mosquito comparison and vector control cues.
- `theory:19-1` Mendelian inheritance patterns.
- `theory:20-1` mental health care framework.

## Why Firebase was chosen

The app already uses Firebase Auth and Firestore, so the lowest-friction content-management path is:

- Store image metadata and placement in Firestore (`topicIllustrations`).
- Store image files in Firebase Storage.
- Keep a bundled fallback for the first batch so the app still shows images even if Firestore is unavailable.

This gives you easy future editing in Firebase Console without reopening giant chapter JSON files.
