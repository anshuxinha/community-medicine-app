import re
import json

with open(r"D:\The App\src\data\pyqData.json", "r", encoding="utf-8") as f:
    data = json.load(f)

t1 = data['subsections'][0]['subsections'][0]
content = t1['content']

print("1. swadesh in content?", 'swadesh' in content.lower())
print("2. PAGE marker in content?", '--- PAGE' in content)
print()
print("3. First 500 chars:")
print(repr(content[:500]))
print()
# Check for tables (pipe characters)
if '|' in content:
    print("4. Pipe characters (tables) found")
    lines = content.split('\n')
    for i, line in enumerate(lines[:50]):
        if '|' in line:
            print(f"Table line {i}: {line[:60]}...")
else:
    print("4. NO pipe characters - tables may be plain text")

# Check ALL CAPS headings have blank lines
print()
print("5. Checking ALL CAPS headings...")
lines = content.split('\n')
warnings = 0
for i, line in enumerate(lines):
    stripped = line.strip()
    if (stripped == stripped.upper() and len(stripped) > 3 and 
        any(c.isalpha() for c in stripped)):
        # Check blank before
        if i > 0 and lines[i-1].strip() != '':
            print(f"WARNING: No blank before: {stripped[:30]}...")
            warnings += 1
        # Check blank after
        if i < len(lines)-1 and lines[i+1].strip() != '':
            print(f"WARNING: No blank after: {stripped[:30]}...")
            warnings += 1

if warnings == 0:
    print("GOOD: All ALL CAPS headings have blank lines!")
