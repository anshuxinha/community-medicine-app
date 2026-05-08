import re
import json'

with open(r'D:\The App\src\data\pyqData.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

t1 = data['subsections'][0]['subsections'][0]
content = t1['content']

print('1. swadesh in content?', 'swadesh' in content.lower())
print('2. PAGE marker in content?', '--- PAGE' in content)
print()
print('3. First 500 chars:')
print(repr(content[:500]))
print()
# Check for tables (pipe chars)
if '|' in content:
    print('4. Pipe characters (tables) found')
    lines = content.split('\n')
    for i, line in enumerate(lines[:50]):
        if '|' in line:
            print(f'Table line {i}: {line[:60]}...')
else:
    print('4. NO pipe characters - tables may be plain text')
