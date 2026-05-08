import re
import json'

with open(r"D:\The App\src\data\pyqData.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Check Topic 1
t1 = data['subsections'][0]['subsections'][0]
content = t1['content']

print('Topic 1 title:', t1['title'])
print('Frequency:', t1['frequency'])
print('Grade:', t1['grade'])
print()

# Check if [20XX] still exists
if re.search(r'$$\d{4}\]', content):
    print('WARNING: [20XX] still in content!')
else:
    print('GOOD: No [20XX] in content')

# Count questions
questions = re.findall(r'Q\d+\.', content)
print(f'Questions found: {len(questions)}')
if questions:
    print(f'First 5: {questions[:5]}')

# Check bullets
bullet_count = len([l for l in content.split('\n') if l.startswith('- ')])
nested_count = len([l for l in content.split('\n') if l.startswith('  - ')])
print(f'Top-level bullets (- ): {bullet_count}')
print(f'Nested bullets (  - ): {nested_count}')

# Check ALL CAPS headings have blank lines
print()
print('Checking ALL CAPS headings...')
lines = content.split('\n')
warnings = 0
for i, line in enumerate(lines):
    if line and line == line.upper() and len(line) > 3 and any(c.isalpha() for c in line):
        # Check blank before
        if i > 0 and lines[i-1] != '':
            print(f'WARNING: No blank before: {line[:30]}...')
            warnings += 1
        # Check blank after
        if i < len(lines)-1 and lines[i+1] != '':
            print(f'WARNING: No blank after: {line[:30]}...')
            warnings += 1

if warnings == 0:
    print('GOOD: All ALL CAPS headings have blank lines!')
else:
    print(f'WARNING: {warnings} heading(s) missing blank lines')
