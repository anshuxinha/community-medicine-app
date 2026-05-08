import re
import json

# Read extracted text
with open(r"D:\The App\paper1_extracted.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Remove year citations like [2011], [2012], etc.
text = re.sub(r'\[\d{4}\]', '', text)

# Find all TOPIC headers with positions - deduplicate by topic number
topic_pattern = re.compile(r'TOPIC\s+(\d+):\s*([A-Z\s/]+(?:\s*\([A-Z]+\))?)', re.IGNORECASE)
matches = list(topic_pattern.finditer(text))

# Deduplicate: keep only first occurrence of each topic number
seen_topics = {}
for match in matches:
    topic_num = match.group(1)
    if topic_num not in seen_topics:
        seen_topics[topic_num] = match

print(f"Found {len(seen_topics)} unique topics")

def format_content(content):
    """Format content according to rules"""
    lines = content.split('\n')
    result = []
    
    for line in lines:
        stripped = line.strip()
        
        # Skip page markers, swadesh, metadata
        if not stripped:
            continue
        if stripped.startswith('--- PAGE'):
            continue
        if stripped.lower().startswith('swadesh'):
            continue
        if stripped.startswith('Frequency:'):
            continue
        if 'Detailed Model Answers' in stripped:
            continue
        if 'NTRUHS MD' in stripped:
            continue
        if stripped.startswith('TOPIC'):
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
                if len(spaces) >= 2:
                    result.append(f'  - {content_text}')
                else:
                    result.append(f'- {content_text}')
            else:
                result.append(line.rstrip())
    
    # Remove trailing empty lines
    while result and result[-1] == '':
        result.pop()
    
    return '\n'.join(result)

# Process topics
topics = []
for topic_num, match in sorted(seen_topics.items()):
    header = match.group(0)
    start_pos = match.end()
    
    # Get content until next topic or end
    next_match = None
    for num, m in seen_topics.items():
        if int(num) > int(topic_num):
            if next_match is None or m.start() < next_match.start():
                next_match = m
    
    if next_match:
        content = text[start_pos:next_match.start()]
    else:
        content = text[start_pos:]
    
    # Extract topic title
    topic_title = match.group(2).strip()
    
    # Extract frequency - search in header + beginning of content
    search_text = header + content[:500]  # Check header and first 500 chars
    freq_match = re.search(r'Frequency:\s*(\d+)\s*Times', search_text, re.IGNORECASE)
    frequency = int(freq_match.group(1)) if freq_match else 0
    
    # Extract grade
    grade_match = re.search(r'GRADE\s+([AB])', search_text, re.IGNORECASE)
    grade = grade_match.group(1).upper() if grade_match else 'B'
    
    # Format content
    formatted_content = format_content(content)
    
    topics.append({
        'id': f'pyq-paper1-t{topic_num}',
        'title': f'{topic_num}. {topic_title}',
        'content': formatted_content,
        'grade': grade,
        'frequency': frequency
    })
    print(f"  Topic {topic_num}: {topic_title[:30]}... (freq={frequency}, grade={grade})")

# Build JSON structure
output = {
    "id": "pyq",
    "title": "Previous Year Questions",
    "content": "Comprehensive question bank for NTRUHS MD SPM examinations (2010-2026), organized by topic frequency and grade.",
    "subsections": [
        {
            "id": "pyq-paper1",
            "title": "Paper I — SPM (Basic Sciences)",
            "content": "SPM Paper I covers Basic Sciences Applied to Social & Preventive Medicine.\nAll questions and model answers from 2010 to Apr/May 2026 are included.",
            "subsections": topics
        }
    ]
}

# Write output
with open(r"D:\The App\src\data\pyqData.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"\nRebuilt pyqData.json with {len(topics)} topics")
