import re
import json

# Read extracted text
with open(r"D:\The App\paper1_extracted.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Remove year citations
text = re.sub(r'$$\d{4}$$', '', text)

# Define topics with CORRECT metadata
topics_data = [
    ("1", "MALNUTRITION / PEM / NUTRITION", 20, "A"),
    ("2", "IEC / HEALTH COMMUNICATION / SKILLS FOR IPC", 13, "A"),
    ("3", "INDICATORS OF HEALTH", 13, "A"),
    ("4", "LEVELS OF PREVENTION / MODES OF INTERVENTION / NATURAL HISTORY OF DISEASE", 12, "A"),
    ("8", "ROLE OF FAMILY IN HEALTH AND DISEASE", 9, "A"),
    ("9", "DIMENSIONS / DEFINITION OF HEALTH / POSITIVE HEALTH", 8, "A"),
    ("10", "COLD CHAIN / IMMUNIZATION / VACCINES / AEFI / SURVEILLANCE", 9, "A"),
    ("11", "SOCIAL / CULTURAL FACTORS IN HEALTH", 9, "A"),
    ("12", "SAMPLING METHODS / PROBABILITY SAMPLING", 7, "B"),
    ("13", "SURVEILLANCE", 6, "B"),
    ("14", "SCREENING", 6, "B"),
    ("17", "DESCRIPTIVE EPIDEMIOLOGY / TIME TRENDS", 5, "B"),
    ("18", "DETERMINANTS OF HEALTH", 5, "B"),
    ("22", "HEALTH PROMOTION", 5, "B"),
    ("23", "MASLOW", 4, "B"),
    ("24", "ICD-11", 4, "B"),
    ("25", "ICEBERG PHENOMENON", 4, "B"),
    ("26", "CASE-CONTROL / COHORT / RCT STUDIES", 4, "B"),
    ("27", "MEASURES OF CENTRAL TENDENCY", 4, "B"),
    ("28", "MEDICAL SOCIOLOGY / SOCIAL STRUCTURE", 3, "B"),
]

def format_content(raw_text, topic_title):
    """Format content according to rules"""
    # Remove topic title if it appears at start
    if raw_text.startswith(topic_title):
        raw_text = raw_text[len(topic_title):].lstrip('\n')
    
    lines = raw_text.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        if not stripped:
            if result and result[-1] != '':
                result.append('')
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
            if result and result[-1] != '':
                result.append('')
            result.append(stripped)
            result.append('')
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
    
    while result and result[-1] == '':
        result.pop()
    
    return '\n'.join(result)

def extract_topic_content(text, topic_num):
    """Extract content for a topic from the text"""
    pattern = re.compile(rf'TOPIC\s+{topic_num}:', re.IGNORECASE)
    match = pattern.search(text)
    if not match:
        return ""
    
    start_pos = match.end()
    
    # Find next topic
    next_match = re.search(r'TOPIC\s+\d+:', text[start_pos:], re.IGNORECASE)
    if next_match:
        end_pos = start_pos + next_match.start()
        return text[start_pos:end_pos]
    else:
        return text[start_pos:]

# Process topics
topics = []
for num, title, freq, grade in topics_data:
    print(f"Processing Topic {num}: {title[:30]}...")
    
    # Extract content from PDF text
    content = extract_topic_content(text, num)
    
    # Format content
    formatted = format_content(content, title)
    
    topics.append({
        'id': f'pyq-paper1-t{num}',
        'title': f'{num}. {title}',
        'content': formatted,
        'grade': grade,
        'frequency': freq
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

print(f"\nRebuilt pyqData.json with {len(topics)} topics - FINAL VERSION!")
print("All bullets are now '- ' (not ●)")
print("All ALL CAPS headings have blank lines")
print("No year citations [YYYY]")
