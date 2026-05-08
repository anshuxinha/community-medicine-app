import json
import re

RAW_PATH = r"D:\The App\pdf_raw_extracted.txt"
OUTPUT_PATH = r"D:\The App\src\data\pyqData.json"

# ─────────────────────────────────────────────────────────────
# 1. TOC PARSING — Extract grades & frequencies
# ─────────────────────────────────────────────────────────────

def parse_toc(lines):
    """
    Parse the table-of-contents lines (before the first TOPIC) to extract
    topic_number → (frequency, grade) mappings.
    The TOC lines look like:
        1 Malnutrition / PEM / Nutrition (incl. Nutritional 20x A MUST PREPARE ↑
        7 Air / Water Pollution & Safe Water Standards 9x A MUST PREPARE
        12 Sampling Methods / Probability Sampling 7x B HIGH PRIORITY ↑
    """
    toc = {}
    # Pattern: number, topic name, frequency like "20x", grade A/B/C/D, priority text
    toc_re = re.compile(
        r'^(\d+)\s+(.+?)\s+(\d+)x\s+([A-D])\s+(MUST PREPARE|HIGH PRIORITY|MODERATE|LOW PRIORITY)',
        re.IGNORECASE
    )
    for line in lines:
        m = toc_re.search(line)
        if m:
            num = int(m.group(1))
            freq = int(m.group(3))
            grade = m.group(4).upper()
            toc[num] = {"frequency": freq, "grade": grade}
    return toc


# ─────────────────────────────────────────────────────────────
# 2. CONTENT CLEANUP
# ─────────────────────────────────────────────────────────────

# Watermark / header lines that appear inside topic content
CONTENT_WATERMARK_PATTERNS = [
    r'^Page\s+\d+\s+of\s+\d+.*',
    r'^GOLD MEDAL MODEL ANSWERS.*',
    r'^For Academic Use Only.*',
    r'^Community Medicine\s*[·\-]\s*Preventive\s*&\s*Social\s*Medicine.*',
    r'^NTRUHS\s+Topics?\s+\d+.*',
    r'^SPM\s*—\s*GOLD MEDAL ANSWERS.*',
    r'^—\s*End of Document.*',
    r'^MD SPM\s*—\s*PAPER\s*I.*',
    r'^Detailed Model Answers for Q\d+.*',
    r'^Frequency:\s*\d+\s+Times?\s+Asked.*',
    r'^GRADE [A-C]\s*Priority.*',
    r'^PART\s*[AB].*',
    r'^#\s*TOPIC\s*FREQ\s*GR\.\s*PRIORITY.*',
    r'^\d+\s+swa[Dd]esh$',
    r'^★?\s*NEW\s+TOPICS added from.*',
    r'^Star ratings:.*',
    r'^Questions are ranked by frequency.*',
    r'^GRADE\s+FREQUENCY\s+PRIORITY\s+EXAM STRATEGY.*',
    r'^Prioritised by Exam Frequency.*',
    r'^COMPLETE QUESTION BANK.*',
    r'^SPM PAPER-I$',
    r'^Basic Sciences Applied to Social.*',
    r'^GRADING LEGEND.*',
    r'^END OF GOLD MEDAL MODEL ANSWERS.*',
    r'^GOLD MEDAL ANSWERS.*',
    r'^Prepared with Gold Medal Standard.*',
    r'^Best of [Ll]uck.*',
    r'^For Academic Use Only.*',
]

def is_content_watermark(line):
    # Strip whitespace, then common decorative/artifact chars including em-dash (—) and en-dash (–)
    s = line.strip().lstrip('—–�•◦→⇒►›»*-=| ')
    if not s:
        return False
    for pat in CONTENT_WATERMARK_PATTERNS:
        if re.search(pat, s, re.IGNORECASE):
            return True
    return False


def remove_year_tags(line):
    """Remove year tags like (2011), (2022, 2014), [Nov 2023], (Dec 2024 — NEW), (Apr/May 2026)"""
    # Patterns:
    # (2011)
    # (2022, 2014)
    # [Nov 2023]
    # (Dec 2024 — NEW) or (Dec 2024 - NEW)
    # (Oct 2025 — ) or (Oct 2025 - )
    # (Apr/May 2026)
    # (May 2024, May 2025)
    line = re.sub(r'\s*\(\s*\d{4}(?:\s*,\s*\d{4})*\s*\)\s*', ' ', line)
    line = re.sub(r'\s*\[\s*[A-Za-z]+\s+\d{4}\s*\]\s*', ' ', line)
    line = re.sub(r'\s*\(\s*[A-Za-z]+\s*\d{4}\s*[-—]\s*NEW\s*\)\s*', ' ', line, flags=re.IGNORECASE)
    line = re.sub(r'\s*\(\s*[A-Za-z]+\s*\d{4}\s*[-—]\s*\)\s*', ' ', line)
    line = re.sub(r'\s*\(\s*[A-Za-z/]+\s*\d{4}\s*\)\s*', ' ', line)
    line = re.sub(r'\s*\(\s*[A-Za-z]+\s+\d{4}\s*,\s*[A-Za-z]+\s+\d{4}\s*\)\s*', ' ', line)
    return line


def remove_stars_and_new(line):
    """Remove ★★★★★, ⭐⭐⭐⭐⭐, *, (NEW), and standalone NEW tags."""
    # Star ratings (4-5 stars of ★ or ⭐)
    line = re.sub(r'[★⭐]{3,}\s*', ' ', line)
    # Trailing asterisk patterns like "* *" or "***"
    line = re.sub(r'\s+\*+(\s+\*+)*\s*$', ' ', line)
    line = re.sub(r'\s*\*{2,}\s*', ' ', line)
    # (NEW) in various forms
    line = re.sub(r'\s*\(\s*NEW\s*\)\s*', ' ', line, flags=re.IGNORECASE)
    # Standalone NEW at start of line or after punctuation
    line = re.sub(r'\bNEW\b', ' ', line, flags=re.IGNORECASE)
    # Remove stray star symbols at start of line
    line = re.sub(r'^\s*[★⭐]\s*', ' ', line)
    return line


def merge_split_year_tags(lines):
    """Merge year tags that are split across lines, e.g. '(May\n2024)' -> removed."""
    merged = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # If line ends with something like '(May' or '(Dec' or '(WHO' or '(NHM'
        m = re.search(r'\([A-Za-z]+\s*$', line.rstrip())
        if m and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            # Check if next line starts with year and ends with )
            if re.match(r'^\d{4}\)', next_line):
                # Remove the year tag entirely
                prefix = re.sub(r'\([A-Za-z]+\s*$', '', line.rstrip())
                suffix = re.sub(r'^\d{4}\)\s*', '', next_line)
                merged.append(prefix + (' ' + suffix if suffix else ''))
                i += 2
                continue
            # Also handle ranges like "2005—2008)" or "2005-2008)"
            if re.match(r'^\d{4}\s*[-—]\s*\d{4}\)', next_line):
                prefix = re.sub(r'\([A-Za-z]+\s*$', '', line.rstrip())
                suffix = re.sub(r'^\d{4}\s*[-—]\s*\d{4}\)\s*', '', next_line)
                merged.append(prefix + (' ' + suffix if suffix else ''))
                i += 2
                continue
        merged.append(line)
        i += 1
    return merged


def clean_bullets(line):
    """Convert various bullet characters to standard '- ' bullet."""
    # Bullet at start of line: •, ◦, �, →, ⇒, ►, ›, »
    line = re.sub(r'^(\s*)[•◦�→⇒►›»•]', r'\1-', line)
    # Also handle unicode replacement character specifically
    line = line.replace('�', '-')
    return line


def clean_line(line):
    """Apply all single-line cleanups."""
    # Skip page break markers
    if line.strip() == '---PAGE_BREAK---':
        return None
    
    # Skip watermark lines
    if is_content_watermark(line):
        return None
    
    # Remove year tags
    line = remove_year_tags(line)
    
    # Remove stars and NEW
    line = remove_stars_and_new(line)
    
    # Clean bullets
    line = clean_bullets(line)
    
    # Remove # prefix (markdown header artifact from PDF)
    stripped = line.strip()
    if stripped.startswith('# ') and not stripped.startswith('# Criterion'):
        line = line.replace('# ', '', 1)
    elif stripped.startswith('# '):
        # For # Criterion Details etc., just remove the #
        line = line.replace('# ', '', 1)
    
    # Remove ** bold markers if any
    line = line.replace('**', '')
    
    # Replace em-dash surrounded by spaces with regular dash or keep as is
    # Actually, keep em-dashes, they're fine in text
    
    # Clean up multiple spaces (but preserve leading spaces for indentation)
    stripped = line.strip()
    if stripped:
        # Preserve leading spaces up to indentation level
        leading = line[:len(line) - len(line.lstrip())]
        line = leading + re.sub(r' {2,}', ' ', stripped)
    else:
        line = ''
    
    return line


def strip_excessive_leading_whitespace(lines):
    """For layout=True extraction, strip common leading whitespace while preserving relative indentation."""
    # Find the minimum leading whitespace among non-empty lines
    min_indent = None
    for line in lines:
        stripped = line.lstrip(' ')
        if stripped and not stripped.startswith('---PAGE_BREAK---'):
            indent = len(line) - len(line.lstrip(' '))
            if min_indent is None or indent < min_indent:
                min_indent = indent
    
    if min_indent is None or min_indent == 0:
        return lines
    
    result = []
    for line in lines:
        if line.strip() == '---PAGE_BREAK---':
            result.append(line)
        elif line.strip() == '':
            result.append('')
        else:
            # Strip the common leading whitespace
            stripped = line.lstrip(' ')
            if len(line) - len(stripped) >= min_indent:
                result.append(line[min_indent:])
            else:
                result.append(stripped)
    return result


def clean_topic_content(content):
    """Clean an entire topic content block."""
    lines = content.split('\n')
    # Merge year tags split across lines first
    lines = merge_split_year_tags(lines)
    cleaned = []
    prev_empty = False
    
    for line in lines:
        cleaned_line = clean_line(line)
        if cleaned_line is None:
            continue
        
        if cleaned_line.strip() == '':
            if not prev_empty:
                cleaned.append('')
                prev_empty = True
        else:
            cleaned.append(cleaned_line)
            prev_empty = False
    
    # Remove leading/trailing blank lines
    while cleaned and cleaned[0].strip() == '':
        cleaned.pop(0)
    while cleaned and cleaned[-1].strip() == '':
        cleaned.pop()
    
    return '\n'.join(cleaned)


# ─────────────────────────────────────────────────────────────
# 3. TABLE CONVERSION (best-effort)
# ─────────────────────────────────────────────────────────────

def try_convert_horizontal_tables(content):
    """
    Detect simple horizontal space-separated tables and convert to markdown pipe tables.
    This is a best-effort heuristic.
    
    We look for:
    1. A header line with 2-6 chunks separated by 3+ spaces
    2. Following lines that also have chunks separated by 3+ spaces
    3. Consistent number of columns across rows
    """
    lines = content.split('\n')
    result = []
    i = 0
    n = len(lines)
    
    while i < n:
        line = lines[i]
        stripped = line.strip()
        
        # Skip empty lines and non-table candidates
        if not stripped or len(stripped) > 120:
            result.append(line)
            i += 1
            continue
        
        # Try to detect a table header
        # Split by 3+ spaces
        chunks = re.split(r'\s{3,}', stripped)
        if len(chunks) < 2 or len(chunks) > 6:
            result.append(line)
            i += 1
            continue
        
        # Check if this looks like a table header
        # Header chunks should be relatively short (< 40 chars each)
        header_chunks = [c.strip() for c in chunks]
        if any(len(c) > 50 for c in header_chunks):
            result.append(line)
            i += 1
            continue
        
        # Look ahead for data rows
        rows = [header_chunks]
        j = i + 1
        while j < n:
            next_line = lines[j].strip()
            if not next_line:
                j += 1
                continue
            
            # Stop conditions
            if next_line.startswith('Q') and re.match(r'^Q\d+\.', next_line):
                break
            if next_line.startswith('- ') or next_line.startswith('1. ') or next_line.startswith('2. '):
                break
            if next_line in ('Introduction', 'Definition', 'Conclusion', 'INTRODUCTION', 'DEFINITION', 'CONCLUSION'):
                break
            if re.match(r'^[A-Z][a-z]+\s+\d+\s+of\s+\d+', next_line):
                break
            
            next_chunks = re.split(r'\s{3,}', next_line)
            next_chunks = [c.strip() for c in next_chunks]
            
            # If line has same number of chunks, it's a data row
            if len(next_chunks) == len(header_chunks):
                rows.append(next_chunks)
                j += 1
                continue
            
            # If line has fewer chunks (typically 1), it might be a continuation of the last cell
            if len(next_chunks) == 1 and len(rows) > 0:
                # Append to last cell of previous row
                rows[-1][-1] += ' ' + next_chunks[0]
                j += 1
                continue
            
            # If line has more chunks but first chunk is empty or very short, might be continuation
            if len(next_chunks) > len(header_chunks) and len(next_chunks[0]) < 3:
                # Merge extra chunks into last columns
                merged = next_chunks[:len(header_chunks)-1]
                merged.append(' '.join(next_chunks[len(header_chunks)-1:]))
                rows.append(merged)
                j += 1
                continue
            
            break
        
        # Need at least 2 rows (header + 1 data) to be a table
        if len(rows) >= 2:
            # Build markdown table
            result.append('')  # blank line before table
            result.append('| ' + ' | '.join(header_chunks) + ' |')
            result.append('| ' + ' | '.join(['---'] * len(header_chunks)) + ' |')
            for row in rows[1:]:
                # Pad row if needed
                while len(row) < len(header_chunks):
                    row.append('')
                result.append('| ' + ' | '.join(row[:len(header_chunks)]) + ' |')
            result.append('')  # blank line after table
            i = j
        else:
            result.append(line)
            i += 1
    
    return '\n'.join(result)


# ─────────────────────────────────────────────────────────────
# 4. TOPIC PARSING
# ─────────────────────────────────────────────────────────────

def parse_topics(lines):
    """Split raw text into topic blocks."""
    topics = []
    current_topic = None
    current_content = []
    
    i = 0
    n = len(lines)
    
    while i < n:
        line = lines[i]
        stripped = line.strip()
        
        topic_match = re.match(r'^TOPIC\s+(\d+):\s+(.*)$', stripped)
        if topic_match:
            # Save previous topic
            if current_topic:
                topics.append({
                    'pdf_number': current_topic['pdf_number'],
                    'title': current_topic['title'],
                    'content': '\n'.join(current_content)
                })
            
            pdf_num = int(topic_match.group(1))
            title = topic_match.group(2).strip()
            
            # Handle multi-line titles
            i += 1
            while i < n:
                next_line = lines[i].strip()
                # Stop if next line looks like a question, page break, or another topic
                if re.match(r'^Q\d+\.', next_line) or next_line == '---PAGE_BREAK---' or re.match(r'^TOPIC\s+\d+:', next_line):
                    break
                if is_content_watermark(next_line):
                    break
                # Stop if next line is just a year tag (like (2022, 2021, 2019, 2018))
                if re.match(r'^\(\d{4}(?:\s*,\s*\d{4})*\)$', next_line):
                    break
                # Stop at grade/priority metadata lines
                if re.match(r'^Grade\s+[A-D]\b', next_line, re.IGNORECASE):
                    break
                if re.match(r'^Asked\s+\d+\s+Times?\b', next_line, re.IGNORECASE):
                    break
                if re.match(r'^(MUST PREPARE|HIGH PRIORITY|MODERATE|LOW PRIORITY)\b', next_line, re.IGNORECASE):
                    break
                if re.match(r'^\(Frequency:', next_line, re.IGNORECASE):
                    break
                if re.match(r'^Frequency:', next_line, re.IGNORECASE):
                    break
                # Stop if next line is a single word already present in the title (duplicate heading)
                if re.match(r'^[A-Za-z\s/-]+$', next_line) and len(next_line.split()) <= 3:
                    # If this short phrase is already a substring of the title, skip it
                    if next_line.upper() in title.upper():
                        i += 1
                        continue
                # Otherwise append to title
                title += ' ' + next_line
                i += 1
            
            current_topic = {'pdf_number': pdf_num, 'title': title}
            current_content = []
            continue
        
        if current_topic is not None:
            current_content.append(line.rstrip('\n'))
        
        i += 1
    
    # Save last topic
    if current_topic:
        topics.append({
            'pdf_number': current_topic['pdf_number'],
            'title': current_topic['title'],
            'content': '\n'.join(current_content)
        })
    
    return topics


# ─────────────────────────────────────────────────────────────
# 5. BUILD JSON
# ─────────────────────────────────────────────────────────────

def build_json(topics, toc):
    """Build the pyqData.json structure."""
    topic_subsections = []
    
    for idx, topic in enumerate(topics, start=1):
        pdf_num = topic['pdf_number']
        title = topic['title']
        content = topic['content']
        
        # Clean content
        content = clean_topic_content(content)
        
        # Try table conversion
        content = try_convert_horizontal_tables(content)
        
        # Re-clean after table conversion (might introduce artifacts)
        content = clean_topic_content(content)
        
        # Get grade/frequency from TOC
        toc_info = toc.get(pdf_num, {})
        grade = toc_info.get('grade', 'C')
        frequency = toc_info.get('frequency', 3)
        
        # Renumber topics sequentially 1-30
        topic_id = f"pyq-paper1-t{idx}"
        
        topic_subsections.append({
            "id": topic_id,
            "title": f"{idx}. {title}",
            "content": content,
            "grade": grade,
            "frequency": frequency
        })
    
    output = {
        "id": "pyq",
        "title": "Previous Year Questions",
        "content": "Comprehensive question bank for NTRUHS MD SPM examinations (2010-2026), organized by topic frequency and grade.",
        "subsections": [
            {
                "id": "pyq-paper1",
                "title": "Paper I — SPM (Basic Sciences)",
                "content": "SPM Paper I covers Basic Sciences Applied to Social & Preventive Medicine.\nAll questions and model answers from 2010 to Apr/May 2026 are included.",
                "subsections": topic_subsections
            }
        ]
    }
    
    return output


# ─────────────────────────────────────────────────────────────
# 6. MAIN
# ─────────────────────────────────────────────────────────────

def main():
    with open(RAW_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Parse TOC from first ~500 lines
    toc = parse_toc(lines[:500])
    print(f"Parsed TOC entries: {len(toc)}")
    for num, info in sorted(toc.items())[:10]:
        print(f"  Topic {num}: grade={info['grade']}, freq={info['frequency']}x")
    
    # Parse topics
    topics = parse_topics(lines)
    print(f"\nParsed topics: {len(topics)}")
    for t in topics:
        print(f"  PDF Topic {t['pdf_number']}: {t['title'][:60]}")
    
    # Build JSON
    data = build_json(topics, toc)
    
    # Validate
    paper = data['subsections'][0]
    print(f"\nTotal topics in output: {len(paper['subsections'])}")
    
    # Check Topic 1 question count
    t1_content = paper['subsections'][0]['content']
    q_count = len(re.findall(r'Q\d+\.', t1_content))
    print(f"Topic 1 question count: {q_count}")
    
    # Check for duplicate Q prefixes
    dupes = re.findall(r'Q\d+\.\s+Q\d+\.', t1_content)
    print(f"Topic 1 duplicate Q prefixes: {len(dupes)}")
    
    # Write output
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nWritten to {OUTPUT_PATH}")


if __name__ == '__main__':
    main()
