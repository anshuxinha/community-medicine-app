import json
from pathlib import Path

# Load analysis and extraction
analysis = json.loads(Path('graphify-out/.graphify_analysis.json').read_text())
extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text())

# Map node id to label
node_labels = {n['id']: n['label'] for n in extraction['nodes']}

# Build community -> nodes mapping
communities = {int(k): v for k, v in analysis['communities'].items()}
comm_nodes = {}
for cid, node_ids in communities.items():
    comm_nodes[cid] = [node_labels.get(nid, nid) for nid in node_ids]

# Generate labels
labels = {}
for cid, nodes in comm_nodes.items():
    # Take top 3 keywords from node labels
    labels_str = ', '.join(nodes[:3])
    if len(labels_str) > 30:
        labels_str = labels_str[:27] + '...'
    labels[cid] = labels_str if labels_str else f'Community {cid}'

# Save labels
Path('graphify-out/.graphify_labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}), encoding='utf-8')
print(f'Generated {len(labels)} community labels')

# Regenerate report with real labels
from graphify.build import build_from_json
from graphify.cluster import score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate

G = build_from_json(extraction)
cohesion = {int(k): v for k, v in analysis['cohesion'].items()}
tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}
gods = analysis['gods']
surprises = analysis['surprises']
questions = suggest_questions(G, communities, labels)

report = generate(G, communities, cohesion, labels, gods, surprises, json.loads(Path('graphify-out/.graphify_detect.json').read_text()), tokens, '.', suggested_questions=questions)
Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')
print('Report updated with community labels')
