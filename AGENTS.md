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
