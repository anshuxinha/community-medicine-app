import re
import json'

with open(r"D:\The App\src\data\pyqData.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Check Topic 1 for tables
t1 = data['subsections'][0]['subsections'][0]
content = t1['content']
lines = content.split('\n')

print("Checking tables in Topic 1...")
for i, line in enumerate(lines[:100]):
    if '|' in line:
        print(f"Line {i}: {line[:80]}...")
        # Show surrounding context
        if i > 0:
            print(f"  Previous: {lines[i-1][:60]}...")
        if i < len(lines)-1:
            print(f"  Next: {lines[i+1][:60]}...")
        print()
        break

# Count total pipe characters
pipe_count = content.count('|')
print(f"\nTotal pipe chars in Topic 1: {pipe_count}")

# Check if tables are properly formatted (consecutive pipe lines)
in_table = False
table_start = None
for i, line in enumerate(lines):
    if '|' in line and line.count('|') >= 2:
        if not in_table:
            table_start = i
            in_table = True
    elif in_table:
        print(f"\nTable found at line {table_start}:")
        for j in range(table_start, min(i, table_start + 5)):
            print(f"  {j}: {lines[j][:60]}...")
        in_table = False
        table_start = None
