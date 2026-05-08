import re
import json'

with open(r"D:\The App\src\data\pyqData.json", "r", encoding="utf-8") as f:
    data = json.load(f)

def fix_content(text, topic_title):
    """Fix all formatting issues in content"""
    if not text:
        return text
    
    # 1. Remove "swadesh" watermarks (case insensitive)
    text = re.sub(r'swadesh\s*', '', text, flags=re.IGNORECASE)
    
    # 2. Remove "--- PAGE N ---" markers
    text = re.sub(r'--- PAGE \d+ ---', '', text)
    
    # 3. Fix tables - convert pipe-delimited text to proper table format
    # Look for lines with multiple | characters (table rows)
    lines = text.split('\n')
    result = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Skip empty lines (will add back strategically)
        if not line.strip():
            if result and result[-1] != '':
                result.append('')
            i += 1
            continue
        
        # Check if this line is part of a table (has | chars)
        stripped = line.strip()
        if '|' in stripped and stripped.count('|') >= 2:
            # Collect all consecutive table lines
            table_lines = []
            while i < len(lines) and lines[i].strip() and '|' in lines[i]:
                table_lines.append(lines[i].strip())
                i += 1
            
            # Convert to readable table format
            # Simple approach: keep as readable text with proper spacing
            for tl in table_lines:
                # Clean up the table line
                cleaned = tl.replace('  ', ' ').strip()
                if cleaned:
                    result.append(cleaned)
            
            # Add blank line after table
            if result and result[-1] != '':
                result.append('')
            continue
        
        # Detect ALL CAPS heading
        is_heading = False
        if stripped == stripped.upper() and len(stripped) > 3:
            if any(c.isalpha() for c in stripped):
                if (not stripped.startswith('Q') and 
                    not stripped.startswith('- ') and 
                    not re.match(r'^\d+\.', stripped) and
                    not stripped.startswith('  - ')):
                    is_heading = True
        
        if is_heading:
            if result and result[-1] != '':
                result.append('')
            result.append(stripped)  # ALL CAPS heading
            result.append('')  # blank line after
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
        title = section.get('title', '')
        # Extract just the topic name
        topic_name = title.split('.', 1)[1].strip() if '.' in title else title
        section['content'] = fix_content(section['content'], topic_name)
        print(f"  Fixed: {title[:40]}...")

print("Fixing content (swadesh, PAGE markers, tables, headings)...")
process_section(data)
print(f"\nDone! All content fixed.")

# Write output
with open(r"D:\The App\src\data\pyqData.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
