import sys, json
from networkx.readwrite import json_graph
import networkx as nx
from pathlib import Path

data = json.loads(Path('graphify-out/graph.json').read_text())
G = json_graph.node_link_graph(data, edges='links')

question = 'opencode uninstall'
mode = 'bfs'
terms = [t.lower() for t in question.split() if len(t) > 3]

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

subgraph_nodes = set()
subgraph_edges = []

frontier = set(start_nodes)
subgraph_nodes = set(start_nodes)
for _ in range(3):
    next_frontier = set()
    for n in frontier:
        for neighbor in G.neighbors(n):
            if neighbor not in subgraph_nodes:
                next_frontier.add(neighbor)
                subgraph_edges.append((n, neighbor))
    subgraph_nodes.update(next_frontier)
    frontier = next_frontier

token_budget = 2000
char_budget = token_budget * 4

def relevance(nid):
    label = G.nodes[nid].get('label', '').lower()
    return sum(1 for t in terms if t in label)

ranked_nodes = sorted(subgraph_nodes, key=relevance, reverse=True)

lines = [f'Query: {question} | {len(subgraph_nodes)} nodes found']
for nid in ranked_nodes:
    d = G.nodes[nid]
    lines.append(f'  NODE: {d.get("label", nid)} [src={d.get("source_file","")} loc={d.get("source_location","")}]')
for u, v in subgraph_edges:
    if u in subgraph_nodes and v in subgraph_nodes:
        d = G.edges[u, v]
        lines.append(f'  EDGE: {G.nodes[u].get("label",u)} --{d.get("relation","")} [{d.get("confidence","")}]--> {G.nodes[v].get("label",v)}')

output = '\n'.join(lines)
if len(output) > char_budget:
    output = output[:char_budget] + '\n... (truncated)'
print(output)
