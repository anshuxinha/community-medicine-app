import json'

with open(r"D:\The App\src\data\pyqData.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Check Topic 1
t1 = data['subsections'][0]['subsections'][0]
content = t1['content']

print('1. swadesh in content?', 'swadesh' in content.lower())
print('2. PAGE markers?', '--- PAGE' in content)
print()

# Show first 1000 chars
print('First 1000 chars:')
print(repr(content[:1000]))
print()

# Check for tables (pipe characters)
if '|' in content:
    print('3. Pipe characters (table) found')
    # Show a table snippet
    lines = content.split('\n')
    for i, line in enumerate(lines[:50]):
        if '|' in line:
            print(f'Line {i}: {line[:80]}...')
            break
else:
    print('3. No pipe characters - tables may be formatted as plain text')
