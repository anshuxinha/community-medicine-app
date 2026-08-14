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
for i in ids:
    t = find(data, i)["content"]
    # check whole 26.x (we rewrote those). For others, only after last SOLVED EXERCISES
    if i.startswith("26"):
        block = t
    else:
        idx = t.rfind("SOLVED EXERCISES")
        block = t[idx:] if idx >= 0 else ""
    if re.search(r"Mahajan", block, re.I):
        print("MAHAJAN", i)
    if re.search(r"\bPark\b", block):
        print("PARK", i)
        for m in re.finditer(r".{0,40}Park.{0,40}", block):
            print(" ", m.group(0).replace("\n", " "))
    if "\u2014" in block:
        print("EMDASH", i)
    if " -- " in block:
        print("DASH", i)
print("done")
