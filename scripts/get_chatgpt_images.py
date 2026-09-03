import subprocess
import json

cmd = ['orca', 'eval', '--page', '99e64141-e6d6-40a3-b832-368e030e0e0c', '--expression', 'Array.from(document.images).map(i => i.src)']
proc = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
try:
    urls = json.loads(proc.stdout.strip())
    estuary_urls = []
    for u in urls:
        if 'estuary' in u and 'file_' in u and u not in estuary_urls:
            estuary_urls.append(u)
    print("Found unique estuary URLs:", len(estuary_urls))
    for i, u in enumerate(estuary_urls):
        print(f"[{i}] {u}")
except Exception as e:
    print("Error parsing:", e, proc.stdout[:200])
