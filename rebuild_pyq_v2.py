import re
import json

# Read extracted text
with open(r"D:\The App\paper1_extracted.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Remove year citations like [2011], [2012], etc.
text = re.sub(r'\[\d{4}\]', '', text)

# Split by topics (TOPIC 1:, TOPIC 2:, etc.)
# We need to find all topic boundaries
topic_pattern = r'(TOPIC\s+\d+:\s*[A-Z\s/]+(?:\s*\([A-Z]+\))?)'
topic_matches = list(re.finditer(topic_pattern, text))

def clean_content(raw_text):
    """Clean and format content according to rules"""
    lines = raw_text.split('\n')
    formatted = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip page markers and swaDesh headers
        if not line or line.startswith('--- PAGE') or line.startswith('swaDesh'):
            i += 1
            continue
        
        # Skip "Frequency:" and "Detailed Model Answers" lines (metadata)
        if line.startswith('Frequency:') or 'Detailed Model Answers' in line or 'NTRUHS MD Examination' in line:
            i += 1
            continue
        
        # Detect ALL CAPS heading (section heading)
        # A heading is ALL CAPS, length > 3, not a question, not a bullet, not numbered
        is_heading = False
        if line and line == line.upper() and len(line) > 3:
            # Exclude lines that are obviously not headings
            if (not line.startswith('Q') and 
                not line.startswith('-') and 
                not re.match(r'^\d+\.', line) and
                not line.startswith('|')):
                is_heading = True
        
        if is_heading:
            # Add blank line before heading (if not at start)
            if formatted and formatted[-1] != '':
                formatted.append('')
            formatted.append(line)  # heading in ALL CAPS
            formatted.append('')  # blank line after heading
        else:
            # Handle bullets - convert various bullet chars to "- "
            if re.match(r'^[•◦◆✓✔⚡★☆⭐]\s*', line):
                line = re.sub(r'^[•◦◆✓✔⚡★☆⭐]+\s*', '- ', line)
            
            # Handle nested bullets (lines that start with spaces then bullet)
            elif re.match(r'^\s+[•◦◆✓✔⚡★☆⭐]\s*', line):
                line = re.sub(r'^\s+[•◦◆✓✔⚡★☆⭐]+\s*', '  - ', line)
            
            formatted.append(line)
        
        i += 1
    
    # Remove trailing empty lines
    while formatted and formatted[-1] == '':
        formatted.pop()
    
    return '\n'.join(formatted)

def extract_frequency_and_grade(topic_text):
    """Extract frequency and grade from topic text"""
    freq = 0
    grade = 'B'
    
    # Pattern: "Frequency: 20 Times Asked — Highest Frequency Topic | GRADE A Priority"
    freq_match = re.search(r'Frequency:\s*(\d+)\s*Times', topic_text, re.IGNORECASE)
    if freq_match:
        freq = int(freq_match.group(1))
    
    grade_match = re.search(r'GRADE\s*([A-Z])', topic_text, re.IGNORECASE)
    if grade_match:
        grade = grade_match.group(1).upper()
    
    return freq, grade

# Process topics
topics = []
for idx in range(len(topic_matches)):
    topic_match = topic_matches[idx]
    topic_header = topic_match.group(0)
    
    # Get topic number and title
    num_match = re.search(r'TOPIC\s+(\d+):\s*([A-Z\s/]+)', topic_header)
    if not num_match:
        continue
    
    topic_num = num_match.group(1)
    topic_title = num_match.group(2).strip()
    
    # Get content (from this topic to next topic or end)
    start_pos = topic_match.end()
    if idx + 1 < len(topic_matches):
        end_pos = topic_matches[idx + 1].start()
        topic_text = text[start_pos:end_pos]
    else:
        topic_text = text[start_pos:]
    
    # Extract frequency and grade
    freq, grade = extract_frequency_and_grade(topic_text)
    
    # Format content
    formatted_content = clean_content(topic_text)
    
    topics.append({
        'id': f'pyq-paper1-t{topic_num}',
        'title': f'{topic_num}. {topic_title}',
        'content': formatted_content,
        'grade': grade,
        'frequency': freq
    })

# Build final JSON
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
