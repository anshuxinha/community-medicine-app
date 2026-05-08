import re
import json

def reformat_content(text, topic_title):
    """Reformat content according to ALL rules"""
    if not text:
        return text
    
    # Remove year citations like [2011], [2012], etc. - FIXED regex
    text = re.sub(r'\[\d{4}\]', '', text)
    
    # Remove metadata lines
    lines_to_skip = [
        r'Frequency:\s*\d+\s*Times.*',
        r'GRADE\s+[AB].*',
        r'Detailed Model Answers.*',
        r'NTRUHS MD.*',
    ]
    for pattern in lines_to_skip:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    # Remove topic title if it appears at start
    if text.startswith(topic_title):
        text = text[len(topic_title):].lstrip('\n')
    
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
            if any(c.isalpha() for c in stripped):  # Must have at least one letter
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

# Read current pyqData.json
with open(r"D:\The App\src\data\pyqData.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Process all topics recursively
def process_section(section):
    if 'subsections' in section:
        for sub in section['subsections']:
            process_section(sub)
    elif 'content' in section:
        title = section.get('title', '')
        # Extract just the topic name (e.g., "1. MALNUTRITION / PEM / NUTRITION")
        topic_name = title.split('.', 1)[1].strip() if '.' in title else title
        section['content'] = reformat_content(section['content'], topic_name)
        print(f"  Reformatted: {title[:40]}...")

print("Reformatting content fields (FINAL FIX)...")
process_section(data)
print(f"\nDone. Reformatted all content fields.")

# Write output
with open(r"D:\The App\src\data\pyqData.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
