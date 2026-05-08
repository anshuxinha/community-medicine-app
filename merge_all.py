import json
from pathlib import Path
from graphify.cache import save_semantic_cache

# Step 1: Merge chunk files into .graphify_semantic_new.json
chunks = []
for chunk_file in ['graphify-out/.graphify_chunk_01.json', 'graphify-out/.graphify_chunk_02.json', 'graphify-out/.graphify_chunk_03.json']:
    if Path(chunk_file).exists():
        chunks.append(json.loads(Path(chunk_file).read_text()))

merged_new = {'nodes': [], 'edges': [], 'hyperedges': []}
seen_nodes = set()
for chunk in chunks:
    for node in chunk.get('nodes', []):
        if node['id'] not in seen_nodes:
            seen_nodes.add(node['id'])
            merged_new['nodes'].append(node)
    merged_new['edges'].extend(chunk.get('edges', []))
    merged_new['hyperedges'].extend(chunk.get('hyperedges', []))

Path('graphify-out/.graphify_semantic_new.json').write_text(json.dumps(merged_new, indent=2))
print(f'Merged new semantic: {len(merged_new["nodes"])} nodes, {len(merged_new["edges"])} edges')

# Step 2: Save new results to cache
saved = save_semantic_cache(merged_new.get('nodes', []), merged_new.get('edges', []), merged_new.get('hyperedges', []))
print(f'Cached {saved} files')

# Step 3: Merge cached + new into .graphify_semantic.json
cached = json.loads(Path('graphify-out/.graphify_cached.json').read_text()) if Path('graphify-out/.graphify_cached.json').exists() else {'nodes':[],'edges':[],'hyperedges':[]}

all_nodes = cached['nodes'] + merged_new.get('nodes', [])
all_edges = cached['edges'] + merged_new.get('edges', [])
all_hyperedges = cached.get('hyperedges', []) + merged_new.get('hyperedges', [])
seen = set()
deduped = []
for n in all_nodes:
    if n['id'] not in seen:
        seen.add(n['id'])
        deduped.append(n)

semantic_merged = {
    'nodes': deduped,
    'edges': all_edges,
    'hyperedges': all_hyperedges,
    'input_tokens': merged_new.get('input_tokens', 0),
    'output_tokens': merged_new.get('output_tokens', 0),
}
Path('graphify-out/.graphify_semantic.json').write_text(json.dumps(semantic_merged, indent=2))
print(f'Semantic merged: {len(deduped)} nodes, {len(all_edges)} edges ({len(cached["nodes"])} cached, {len(merged_new.get("nodes",[]))} new)')

# Step 4: Merge AST + semantic into .graphify_extract.json (Step 3C)
ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text())
sem = json.loads(Path('graphify-out/.graphify_semantic.json').read_text())

seen_ast = {n['id'] for n in ast['nodes']}
merged_nodes = list(ast['nodes'])
for n in sem['nodes']:
    if n['id'] not in seen_ast:
        merged_nodes.append(n)
        seen_ast.add(n['id'])

merged_extract = {
    'nodes': merged_nodes,
    'edges': ast['edges'] + sem['edges'],
    'hyperedges': sem.get('hyperedges', []),
    'input_tokens': sem.get('input_tokens', 0),
    'output_tokens': sem.get('output_tokens', 0),
}
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged_extract, indent=2))
print(f'Final extraction: {len(merged_nodes)} nodes, {len(merged_extract["edges"])} edges ({len(ast["nodes"])} AST + {len(sem["nodes"])} semantic)')
