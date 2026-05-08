import re
import json

# Read original pyqData.json for structure
with open(r"D:\The App\src\data\pyqData.json", "r", encoding="utf-8") as f:
    original = json.load(f)

# Read extracted text from PDF
with open(r"D:\The App\paper1_extracted.txt", "r", encoding="utf-8") as f:
    pdf_text = f.read()

# Remove year citations like [2011], [2012], etc.
pdf_text = re.sub(r'\[\d{4}\]', '', pdf_text)

def clean_and_format_content(raw_content, topic_num):
    """Clean and format content according to rules"""
    # Find the topic in pdf_text
    topic_pattern = rf'TOPIC\s+{topic_num}[:\s]*[A-Z\s/]+'
    match = re.search(topic_pattern, pdf_text, re.IGNORECASE)
    
    if not match:
        return raw_content  # Fallback to original
    
    # Get content from this topic to next topic or end
    start_pos = match.end()
    next_topic = re.search(r'TOPIC\s+\d+:', pdf_text[match.end():], re.IGNORECASE)
    if next_topic:
        end_pos = start_pos + next_topic.start()
        content = pdf_text[start_pos:end_pos]
    else:
        content = pdf_text[start_pos:]
    
    # Clean the content
    lines = content.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip page markers, swadesh, metadata
        if (not line or 
            line.startswith('--- PAGE') or 
            line.startswith('swadesh') or
            line.startswith('Frequency:') or
            'Detailed Model Answers' in line or
            'NTRUHS MD' in line or
            line.startswith('TOPIC')):
            i += 1
            continue
        
        # Detect ALL CAPS heading (section heading)
        is_heading = False
        if line and line == line.upper() and len(line) > 3:
            if (not line.startswith('Q') and 
                not line.startswith('-') and 
                not re.match(r'^\d+\.', line) and
                not line.startswith('|')):
                is_heading = True
        
        if is_heading:
            if result and result[-1] != '':
                result.append('')
            result.append(line)  # ALL CAPS heading
            result.append('')  # blank line after
        else:
            # Handle bullets - convert ● to "- "
            if re.match(r'^[●◆✓✔⚡★☆⭐•]', line):
                line = re.sub(r'^[●◆✓✔⚡★☆⭐•]\s*', '- ', line)
            elif re.match(r'^\s+[●◆✓✔⚡★☆⭐•]', line):
                line = re.sub(r'^\s+[●◆✓✔⚡★☆⭐•]\s*', '  - ', line)
            
            result.append(line)
        
        i += 1
    
    # Remove trailing empty lines
    while result and result[-1] == '':
        result.pop()
    
    return '\n'.join(result)

# Process topics
paper1_section = original['subsections'][0]['subsections']
for topic in paper1_section:
    # Extract topic number from id (e.g., "pyq-paper1-t1" -> "1")
    topic_num = topic['id'].split('-t')[1]
    
    # Reformat content
    topic['content'] = clean_and_format_content(topic['content'], topic_num)

# Write output
with open(r"D:\The App\src\data\pyqData.json", "w", encoding="utf-8") as f:
    json.dump(original, f, indent=2, ensure_ascii=False)

print(f"Rebuilt pyqData.json with {len(paper1_section)} topics")
