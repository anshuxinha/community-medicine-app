import re
import json

with open(r"D:\The App\src\data\pyqData.json", "r", encoding="utf-8") as f:
    data = json.load(f)

def fix_content(text):
    """Fix all formatting issues"""
    if not text:
        return text
    
    # 1. Remove "swadesh" watermarks (case insensitive)
    text = re.sub(r'swadesh\s*', '', text, flags=re.IGNORECASE)
    
    # 2. Remove "--- PAGE N ---" markers
    text = re.sub(r'--- PAGE \d+ ---\s*', '', text)
    
    # 3. Fix tables - convert pipe-delimited text to proper format
    # Look for lines with multiple | chars (table rows)
    lines = text.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Skip empty lines (will add back strategically)
        if not stripped:
            if result and result[-1] != '':
                result.append('')
            i += 1
            continue
        
        # Detect ALL CAPS heading - MUST contain at least one letter
        is_heading = False
        if stripped == stripped.upper() and len(stripped) > 3:
            if any(c.isalpha() for c in stripped):
                if (not stripped.startswith('Q') and 
                    not stripped.startswith('- ') and 
                    not re.match(r'^\d+\.', stripped) and
                    not stripped.startswith('  - ')):
                    is_heading = True
        
        if is_heading:
            # Add blank line before heading (if not start of content)
            if result and result[-1] != '':
                result.append('')
            result.append(stripped)  # ALL CAPS heading
            result.append('')  # blank line after
        else:
            # Check if this is a table row (has | chars)
            if stripped.count('|') >= 2:
                # Keep table rows as-is for app to render
                result.append(stripped)
            else:
                # Handle bullets
                bullet_match = re.match(r'^(\s*)([●◆✓✔⚡★☆⭐•]+)\s*(.*)$', line)
                if bullet_match:
                    spaces = bullet_match.group(1)
                    content_text = bullet_match.group(3)
                    if not content_text.strip():
                        i += 1
                        continue
                    if len(spaces) >= 2:
                        result.append(f'  - {content_text}')
                    else:
                        result.append(f'- {content_text}')
                else:
                    result.append(line.rstrip())
        
        i += 1
    
    # Remove trailing empty lines
    while result and result[-1] == '':
        result.pop()
    
    return '\n'.join(result)

# Process all topics recursively
def process_section(section):
    if 'subsections' in section:
        for sub in section['subsections']:
            process_section(sub)
    elif 'content' in section:
        old = section['content']
        new = fix_content(old)
        if old != new:
            print(f"  Fixed: {section.get('title', 'Unknown')[:40]}...")
        section['content'] = new

print("Fixing content (swadesh, PAGE markers, tables, headings)...")
process_section(data)
print(f"\nDone! All content fixed.")

# Write output
with open(r"D:\The App\src\data\pyqData.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
