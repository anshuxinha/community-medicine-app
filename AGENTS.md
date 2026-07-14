# Graph-First Protocol (graphify)

**MANDATORY: Always query the knowledge graph before using standard search.**
The knowledge graph provides clustered, relationship-aware context that standard grep/glob often misses.

## Workflow
1. **Query Graph**: Run `python -m graphify query "[task description]"` to get ranked nodes and community context.
2. **Explore Connections**: If the initial query reveals a "bridge node" (high betweenness), run `python -m graphify explain "[node_id]"` to understand its role.
3. **Targeted Edit**: Only after understanding the graph structure should you view specific files.

## Background Watcher
- `graphify --watch` is running in the background.
- It automatically updates `graphify-out/graph.json` when you modify files.
- You do NOT need to re-run the full `/graphify` pipeline unless the graph structure becomes stale or missing.

## Primary Tools
- `python -m graphify query "<text>"`: BFS search for context.
- `python -m graphify explain "<node>"`: Node-level deep dive.
- `python -m graphify path "<source>" "<target>"`: Trace dependencies between components.

## Guidelines
- Favor nodes in communities with high **cohesion** (defined in `GRAPH_REPORT.md`).
- Treat **INFERRED** edges as hypotheses to verify in the code.
- Always check **God Nodes** if the task involves core architecture changes.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)


# Karpathy Coding Guidelines

Behavioral guidelines to reduce common LLM coding mistakes, derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876).

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" — "Write tests for invalid inputs, then make them pass"
- "Fix the bug" — "Write a test that reproduces it, then make it pass"
- "Refactor X" — "Ensure tests pass before and after"

For multi-step tasks, state a brief plan and verify each step.

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

# EAS Update Protocol

**MANDATORY: If an `eas update` is related to local code or config changes, commit and push those changes first.**

Do not publish an OTA from a dirty or unpushed tree when the update depends on that work.

## Required order
1. **Commit** related changes with a clear message (include only files that belong to the change).
2. **Push** to the remote branch that production tracks (usually `origin/main`).
3. **Then** run `eas update` (see `CUSTOM_INSTRUCTION_EAS.md` / `EAS_UPDATE_GUIDELINES.md` for channel checks, `--branch main`, `--clear-cache`, verify).

## Why
- EAS Update records the git commit; dirty publishes show a `*` commit and drift from GitHub.
- Teammates and future deploys must see the same code that production OTA ships.
- Channel/branch mapping assumes the remote branch is the source of truth.

## Exceptions
- Pure channel/config inspection (`eas channel:list`, etc.) needs no commit.
- If the user explicitly asks to OTA uncommitted work, note the risk and still prefer committing first.
