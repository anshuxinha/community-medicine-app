import re
import json

# Read extracted text
with open(r"D:\The App\paper1_extracted.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Remove year citations like [2011], [2012], etc.
text = re.sub(r'\[\d{4}\]', '', text)

# Find all TOPIC headers with positions
topic_pattern = re.compile(r'TOPIC\s+(\d+):\s*([A-Z\s/]+(?:\s*\([A-Z]+\))?)', re.IGNORECASE)
matches = list(topic_pattern.finditer(text))

print(f"Found {len(matches)} topics")

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
        
        # Detect ALL CAPS heading (section heading)
        is_heading = False
        if stripped == stripped.upper() and len(stripped) > 3:
            # Exclude things that are NOT headings
            if (not stripped.startswith('Q') and 
                not stripped.startswith('-') and 
                not re.match(r'^\d+\.', stripped) and
                not stripped.startswith('|') and
                not stripped.startswith('TOPIC')):
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
for idx in range(len(matches)):
    match = matches[idx]
    topic_num = match.group(1)
    topic_title = match.group(2).strip()
    
    # Get content (from after this header to before next topic)
    start_pos = match.end()
    if idx + 1 < len(matches):
        end_pos = matches[idx + 1].start()
        content = text[start_pos:end_pos]
    else:
        content = text[start_pos:]
    
    # Extract frequency
    freq_match = re.search(r'Frequency:\s*(\d+)\s*Times', content, re.IGNORECASE)
    frequency = int(freq_match.group(1)) if freq_match else 0
    
    # Extract grade
    grade_match = re.search(r'GRADE\s+([AB])', content, re.IGNORECASE)
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
