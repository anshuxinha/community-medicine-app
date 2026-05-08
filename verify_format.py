import json

with open(r"D:\The App\src\data\pyqData.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Get Topic 1 content
t1 = data['subsections'][0]['subsections'][0]
content = t1['content']
print("Topic 1 content (first 400 chars):")
print(repr(content[:400]))
print()

# Check if ● still exists
if '●' in content:
    print("WARNING: ● still in content!")
else:
    print("GOOD: No ● in content")

# Check if -  exists (nested bullet)
nested = [l for l in content.split('\n') if l.startswith('  - ')]
print(f"Nested bullets (  - ): {len(nested)}")

# Check if - exists (top-level bullet)
top = [l for l in content.split('\n') if l.startswith('- ') and not l.startswith('  ')]
print(f"Top-level bullets (- ): {len(top)}")

# Check ALL CAPS headings have blank lines
lines = content.split('\n')
for i, line in enumerate(lines):
    if line and line == line.upper() and len(line) > 3:
        # Check blank line before
        if i > 0 and lines[i-1] != '':
            print(f"WARNING: No blank line before heading: {line[:30]}...")
        # Check blank line after
        if i < len(lines)-1 and lines[i+1] != '':
            print(f"WARNING: No blank line after heading: {line[:30]}...")
