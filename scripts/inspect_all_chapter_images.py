import json
import re

with open('src/data/mockData.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

chapters = data if isinstance(data, list) else data.get('chapters', [])

for ch_id in ['31', '32']:
    ch = next((c for c in chapters if str(c.get('id')) == ch_id), None)
    if not ch:
        print(f"Chapter {ch_id} not found")
        continue
    print(f"\n=======================================================")
    print(f"CHAPTER {ch_id}: {ch.get('title')}")
    print(f"=======================================================")
    for sub in ch.get('subsections', []):
        sub_id = sub.get('id')
        sub_title = sub.get('title')
        content = sub.get('content', '')
        imgs = re.findall(r'!\[([^\]]*)\]\(([^)]+)\)', content)
        if imgs:
            for cap, url in imgs:
                print(f"[{sub_id}] {sub_title}")
                print(f"   Caption: {cap}")
                print(f"   URL: {url}")
        else:
            print(f"[{sub_id}] {sub_title} -> (No images)")
