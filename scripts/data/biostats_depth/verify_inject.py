import json
import re
from pathlib import Path

data = json.loads(Path(r"D:\The App\src\data\mockData.json").read_text(encoding="utf-8"))


def find(nodes, tid):
    for n in nodes:
        if str(n.get("id")) == str(tid):
            return n
        for k in ("subsections", "children"):
            if isinstance(n.get(k), list):
                found = find(n[k], tid)
                if found:
                    return found
    return None


ids = [
    "26-1",
    "26-2",
    "26-3",
    "26-4",
    "26-5",
    "26-6",
    "26-7",
    "26-8",
    "26-9",
    "21",
    "8-2",
    "3-1",
    "9-5",
    "8-7",
    "8-3",
]
total_ex = 0
for i in ids:
    n = find(data, i)
    c = n.get("content", "") if n else ""
    ex = len(re.findall(r"\[EX\]", c))
    ans = len(re.findall(r"\[ANS\]", c))
    total_ex += ex
    title = (n or {}).get("title", "")
    print(f"{i}: ok={n is not None} len={len(c)} EX={ex} ANS={ans} {title}")
print("total EX", total_ex)

for i in ids:
    n = find(data, i)
    t = n.get("content", "")
    if re.search(r"Mahajan", t, re.I):
        print("MAHAJAN in", i)
    if re.search(r"\bPark\b", t):
        print("PARK in", i)
    if "\u2014" in t or " -- " in t:
        print("EMDASH in", i)
    if "NEEDS_" in t or "verify latest" in t.lower():
        print("VERIFY PHRASE in", i)
