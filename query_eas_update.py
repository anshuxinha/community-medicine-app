import sys, json
import networkx as nx
from networkx.readwrite import json_graph
from pathlib import Path

data = json.loads(Path('graphify-out/graph.json').read_text())
G = json_graph.node_link_graph(data, edges='links')

question = 'what are the details of the last eas update?'
terms = [t.lower() for t in question.split() if len(t) > 3]

# Find best-matching start nodes
scored = []
for nid, ndata in G.nodes(data=True):
    label = ndata.get('label', '').lower()
    score = sum(1 for t in terms if t in label)
    if score > 0:
        scored.append((score, nid))
scored.sort(reverse=True)
start_nodes = [nid for _, nid in scored[:3]]

if not start_nodes:
    print('No matching nodes found for query terms:', terms)
    sys.exit(0)

# BFS traversal
frontier = set(start_nodes)
subgraph_nodes = set(start_nodes)
subgraph_edges = []

for _ in range(3):
    next_frontier = set()
    for n in frontier:
        for neighbor in G.neighbors(n):
            if neighbor not in subgraph_nodes:
                next_frontier.add(neighbor)
                subgraph_edges.append((n, neighbor))
    subgraph_nodes.update(next_frontier)
    frontier = next_frontier

# Output results
lines = [f'Traversal: BFS | Start: {[G.nodes[n].get("label", n) for n in start_nodes]} | {len(subgraph_nodes)} nodes']
for nid in subgraph_nodes:
    d = G.nodes[nid]
    lines.append(f'  NODE {d.get("label", nid)} [src={d.get("source_file","")} loc={d.get("source_location","")}]')
for u, v in subgraph_edges:
    if u in subgraph_nodes and v in subgraph_nodes:
        d = G.edges[u, v]
        lines.append(f'  EDGE {G.nodes[u].get("label",u)} --{d.get("relation","")} [{d.get("confidence","")}]--> {G.nodes[v].get("label",v)}')

output = '\n'.join(lines)
print(output)
