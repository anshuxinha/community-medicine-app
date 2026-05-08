import re

with open(r"D:\The App\paper1_extracted.txt", "r", encoding="utf-8") as f:
    text = f.read()

text = re.sub(r'\[\d{4}\]', '', text)

pattern = re.compile(r'TOPIC\s+(\d+):\s*([A-Z\s/]+(?:\s*\([A-Z]+\))?)', re.IGNORECASE)
matches = list(pattern.finditer(text))

seen = {}
for m in matches:
    num = m.group(1)
    if num not in seen:
        seen[num] = m

# Get Topic 2
m = seen['2']
print(f"Topic 2 header: {repr(m.group(0))}")
print(f"Header end position: {m.end()}")

# Get content for Topic 2
content = text[m.end():]
# Find next topic
for num, mm in seen.items():
    if int(num) > 2:
        content = text[m.end():mm.start()]
        break

print(f"\nFirst 400 chars of Topic 2 content:")
print(repr(content[:400]))
print(f"\nDoes 'Frequency:' appear in content? {'Frequency:' in content}")
freq_match = re.search(r'Frequency:\s*(\d+)\s*Times', content, re.IGNORECASE)
print(f"Frequency match: {freq_match}")
if freq_match:
    print(f"Frequency value: {freq_match.group(1)}")
