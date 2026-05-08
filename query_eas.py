import json
import networkx as nx
from networkx.readwrite import json_graph
from pathlib import Path

data = json.loads(Path('graphify-out/graph.json').read_text())
G = json_graph.node_link_graph(data, edges='links')

# Search for EAS update related nodes
search_terms = ['eas', 'update', 'ota', 'over', 'air']
for nid, ndata in G.nodes(data=True):
    label = ndata.get('label', '').lower()
    if any(term in label for term in search_terms):
        print(f'NODE: {nid} -> {ndata.get("label", nid)}')
        # Show connections
        for neigh in G.neighbors(nid):
            edge = G.edges[nid, neigh]
            print(f'  -> {G.nodes[neigh].get("label", neigh)} [{edge.get("relation", "?")}]')
