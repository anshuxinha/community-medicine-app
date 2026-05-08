import re
import json

# Read extracted text
with open(r"D:\The App\paper1_extracted.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Remove year citations like [2011], [2012], etc.
text = re.sub(r'\[\d{4}\]', '', text)

# Split into topics based on "TOPIC" pattern
topic_pattern = r'TOPIC\s+(\d+):\s*([A-Z\s/]+)'
topics = re.split(r'(?=TOPIC\s+\d+:)', text)

# Process each topic
results = []
for topic_block in topics:
    if not topic_block.strip():
        continue
    
    # Extract topic number and title
    topic_match = re.search(r'TOPIC\s+(\d+):\s*([A-Z\s/]+)', topic_block)
    if not topic_match:
        continue
    
    topic_num = topic_match.group(1)
    topic_title = topic_match.group(2).strip()
    
    # Extract frequency/grade info
    freq_match = re.search(r'Frequency:\s*(\d+)\s*Times.*?GRADE\s*([A-Z]+)', topic_block)
    frequency = int(freq_match.group(1)) if freq_match else 0
    grade = freq_match.group(2) if freq_match else "B"
    
    # Extract questions (Q1., Q2., etc.)
    questions = re.split(r'(?=Q\d+\.)', topic_block)
    
    content_parts = []
    for q_block in questions:
        if not q_block.strip() or 'TOPIC' in q_block[:20]:
            continue
        
        # Clean up the question block
        q_text = q_block.strip()
        
        # Format section headings: ALL CAPS lines become headings with blank line after
        lines = q_text.split('\n')
        formatted_lines = []
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Skip page markers
            if line.startswith('--- PAGE') or line.startswith('swaDesh'):
                i += 1
                continue
            
            # Detect ALL CAPS headings (section headings)
            # A line that's ALL CAPS (with possible numbers/punctuation) and not a bullet/number
            if (line and 
                line == line.upper() and 
                len(line) > 3 and
                not line.startswith('Q') and
                not line.startswith('-') and
                not re.match(r'^\d+\.', line)):
                formatted_lines.append('')  # blank line before heading
                formatted_lines.append(line)  # heading in ALL CAPS
                formatted_lines.append('')  # blank line after heading
            else:
                # Format bullets: convert • to "- " for top-level, handle nested
                if line.startswith('•'):
                    formatted_lines.append('- ' + line[1:].strip())
                elif re.match(r'^\d+\.', line):
                    formatted_lines.append(line)  # numbered list as-is
                else:
                    formatted_lines.append(line)
            
            i += 1
        
        formatted_q = '\n'.join(formatted_lines)
        content_parts.append(formatted_q)
    
    # Join all questions for this topic
    topic_content = '\n\n'.join(content_parts)
    
    results.append({
        'id': f'pyq-paper1-t{topic_num}',
        'title': f'{topic_num}. {topic_title}',
        'content': topic_content,
        'grade': grade,
        'frequency': frequency
    })

print(f"Parsed {len(results)} topics")
for r in results[:3]:
    print(f"  - {r['title']}: {r['frequency']}x, Grade {r['grade']}")
