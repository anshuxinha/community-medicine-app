import re
import json

def reformat_content(text):
    """Reformat content according to ALL rules"""
    if not text:
        return text
    
    # Remove year citations like [2011]
    text = re.sub(r'$$\d{4}$$', '', text)
    
    lines = text.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Skip empty lines (will add back strategically)
        if not stripped:
            i += 1
            continue
        
        # Detect ALL CAPS heading
        is_heading = False
        if stripped == stripped.upper() and len(stripped) > 3:
            if (not stripped.startswith('Q') and 
                not stripped.startswith('-') and 
                not re.match(r'^\d+\.', stripped) and
                not stripped.startswith('|')):
                is_heading = True
        
        if is_heading:
            # Add blank line before heading (if not start of content)
            if result and result[-1] != '':
                result.append('')
            result.append(stripped)  # ALL CAPS heading
            result.append('')  # blank line after
        else:
            # Handle bullets - convert various bullet chars to "- "
            # Check for bullet at start of line (with possible leading spaces)
            bullet_match = re.match(r'^(\s*)([●◆✓✔⚡★☆⭐•]+)\s*(.*)$', line)
            if bullet_match:
                spaces = bullet_match.group(1)
                content_text = bullet_match.group(3)
                # Skip empty bullets
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

# Read current pyqData.json
with open(r"D:\The App\src\data\pyqData.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Process all topics recursively
def process_section(section):
    if 'subsections' in section:
        for sub in section['subsections']:
            process_section(sub)
    elif 'content' in section:
        old = section['content']
        new = reformat_content(old)
        if old != new:
            print(f"  Reformatted: {section.get('title', 'Unknown')[:40]}...")
        section['content'] = new

print("Reformating all content fields...")
process_section(data)

# Write output
with open(r"D:\The App\src\data\pyqData.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("\nDone! All content reformatted with correct bullets and headings.")
