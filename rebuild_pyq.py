import re
import json

# Read extracted text
with open(r"D:\The App\paper1_extracted.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Remove year citations like [2011], [2012], etc.
text = re.sub(r'\[\d{4}\]', '', text)

# Split by topics (TOPIC 1:, TOPIC 2:, etc.)
topic_blocks = re.split(r'(?=TOPIC\s+\d+:)', text)

def clean_line(line):
    """Clean a single line - remove page markers, swaDesh, fix bullets"""
    line = line.strip()
    if not line:
        return ''
    if line.startswith('--- PAGE') or line.startswith('swaDesh'):
        return ''
    # Convert • bullets to "- "
    if line.startswith('•'):
        return '- ' + line[1:].strip()
    return line

def format_content_block(block):
    """Format a block of text with proper rules"""
    lines = block.split('\n')
    formatted = []
    i = 0
    while i < len(lines):
        line = clean_line(lines[i])
        if not line:
            i += 1
            continue
        
        # Check if this is an ALL CAPS heading
        # A heading is ALL CAPS, not a question (Q\d), not a bullet, not numbered
        is_heading = (
            line == line.upper() and 
            len(line) > 3 and
            not line.startswith('Q') and
            not line.startswith('-') and
            not re.match(r'^\d+\.', line) and
            not line.startswith('|')
        )
        
        if is_heading:
            # Heading: blank line before, heading line, blank line after
            if formatted and formatted[-1] != '':
                formatted.append('')
            formatted.append(line)
            formatted.append('')
        else:
            formatted.append(line)
        
        i += 1
    
    # Remove trailing empty lines
    while formatted and formatted[-1] == '':
        formatted.pop()
    
    return '\n'.join(formatted)

# Process topics
topics = []
for block in topic_blocks:
    if not block.strip():
        continue
    
    # Extract topic number and title
    topic_match = re.search(r'TOPIC\s+(\d+):\s*([A-Z\s/]+(?:\s*\([A-Z]+\))?)', block, re.IGNORECASE)
    if not topic_match:
        continue
    
    topic_num = topic_match.group(1)
    topic_title = topic_match.group(2).strip()
    
    # Extract frequency and grade
    freq_match = re.search(r'Frequency:\s*(\d+)\s*Times.*?GRADE\s*([A-Z]+)', block, re.IGNORECASE)
    frequency = int(freq_match.group(1)) if freq_match else 0
    grade = freq_match.group(2) if freq_match else 'B'
    
    # Remove the topic header from content
    content_start = topic_match.end()
    content = block[content_start:].strip()
    
    # Format the content
    formatted_content = format_content_block(content)
    
    topics.append({
        'id': f'pyq-paper1-t{topic_num}',
        'title': f'{topic_num}. {topic_title}',
        'content': formatted_content,
        'grade': grade,
        'frequency': frequency
    })

# Build the final JSON structure
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
for t in topics[:5]:
    print(f"  - {t['title']}: {t['frequency']}x, Grade {t['grade']}")
