import re
import json

# Read extracted text
with open(r"D:\The App\paper1_extracted.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Remove year citations like [2011], [2012], etc.
text = re.sub(r'\[\d{4}\]', '', text)

# Find all topic headers with their positions
topic_pattern = r'(TOPIC\s+\d+:\s*[A-Z\s/]+(?:\s*\([A-Z]+\))?)'
matches = list(re.finditer(topic_pattern, text, re.IGNORECASE))

def format_content(content):
    """Format content according to rules"""
    lines = content.split('\n')
    result = []
    
    for line in lines:
        stripped = line.strip()
        
        # Skip page markers, swadesh, metadata
        if not stripped or stripped.startswith('--- PAGE') or stripped.startswith('swadesh'):
            continue
        if stripped.startswith('Frequency:') or 'Detailed Model Answers' in stripped or 'NTRUHS MD' in stripped:
            continue
        
        # Detect ALL CAPS heading
        is_heading = (
            stripped == stripped.upper() and 
            len(stripped) > 3 and
            not stripped.startswith('Q') and
            not stripped.startswith('-') and
            not re.match(r'^\d+\.', stripped) and
            not stripped.startswith('|')
        )
        
        if is_heading:
            if result and result[-1] != '':
                result.append('')
            result.append(stripped)  # ALL CAPS heading
            result.append('')  # blank line after
        else:
            # Handle bullets - convert various bullet chars to "- "
            bullet_match = re.match(r'^(\s*)([•◦◆✓✔⚡★☆⭐]+)\s*(.*)$', line)
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
    header = matches[idx].group(0)
    start_pos = matches[idx].end()
    
    # Get content until next topic or end
    if idx + 1 < len(matches):
        end_pos = matches[idx + 1].start()
        content = text[start_pos:end_pos]
    else:
        content = text[start_pos:]
    
    # Extract topic number and title
    num_match = re.search(r'TOPIC\s+(\d+):\s*([A-Z\s/]+)', header, re.IGNORECASE)
    if not num_match:
        continue
    
    topic_num = num_match.group(1)
    topic_title = num_match.group(2).strip()
    
    # Extract frequency and grade from content
    freq_match = re.search(r'Frequency:\s*(\d+)\s*Times', content, re.IGNORECASE)
    frequency = int(freq_match.group(1)) if freq_match else 0
    
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

print(f"Rebuilt pyqData.json with {len(topics)} topics")
for t in topics[:10]:
    print(f"  - {t['title']}: {t['frequency']}x, Grade {t['grade']}")
