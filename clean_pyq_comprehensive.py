import json
import re
import copy

# Load the data
with open(r"D:\The App\src\data\pyqData.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# ============================================================
# STEP 1: Utility functions
# ============================================================

def is_pipe_line(line):
    """Check if a line is a pipe-table row (starts and ends with |)"""
    s = line.strip()
    return s.startswith("|") and s.endswith("|")

def is_separator_row(line):
    """Check if a pipe-table row is ALL separator characters like |---|:--|"""
    s = line.strip()
    if not (s.startswith("|") and s.endswith("|")):
        return False
    # Split by |, check each cell
    parts = [p.strip() for p in s.split("|")]
    # Remove first and last empty parts
    parts = [p for p in parts if p]
    if not parts:
        return False
    return all(re.match(r'^[-:]+$', p) for p in parts)

def parse_pipe_cells(line):
    """Parse a pipe line into cell values (without leading/trailing pipes)"""
    parts = line.strip().split("|")
    # Remove first and last empty entries (from leading/trailing |)
    if parts and parts[0].strip() == "":
        parts = parts[1:]
    if parts and parts[-1].strip() == "":
        parts = parts[:-1]
    return [p.strip() for p in parts]

def is_question_header(line):
    """Check if line is a question header like 'Q1. ...' or 'Q2. Q1. ...'"""
    return bool(re.match(r'^Q\d+\.?\s', line.strip()))

def is_section_heading(line):
    """Detect ALL CAPS section headings on their own line"""
    stripped = line.strip()
    if not stripped or len(stripped) < 3:
        return False
    # Must be mostly uppercase (allowing / and - and digits)
    cleaned = re.sub(r'[\d\s/\-–—,&\(\)\.!?\'\"]', '', stripped)
    if len(cleaned) < 2:
        return False
    return cleaned.upper() == cleaned and any(c.isalpha() for c in cleaned)

def is_metadata_line(line):
    """Check if a line is metadata/watermark that should be removed"""
    stripped = line.strip()
    if not stripped:
        return False
    
    patterns = [
        r'^\s*\(?\s*Frequency:\s*\d+',
        r'^\s*\(?\s*Asked\b',
        r'NTRUHS',
        r'^Detailed Model Answers',
        r'^GRADE [A-C]\s*Priority',
        r'^Prepared with Gold Standard',
        r'^Prepared with Gold Medal Standard',
        r'^COMMUNITY MEDICINE\b.*GOLD MEDAL',
        r'^—\s*End of Document',
        r'^\|\s*Prepared with Gold Standard',
        r'^\|\s*Prepared with Gold Medal Standard',
        r'\bSPM\s*—\s*GOLD MEDAL ANSWERS\b',
        r'^n swadesh',
        r'^\|\s*SPM\b.*?GOLD MEDAL',
        r'^\d+\s+swadesh$',
        r'^\d+\s+swaDesh$',
        r'^Years:\s*\d{4}',
        r'^\*\s*Years:',
        r'^\(\s*Years:',
        r'^— END OF GOLD MEDAL',
        r'^\|\s*GOLD MEDAL ANSWERS\s*\|$',
        r'^\|\s*GOLD MEDAL ESSAY ANSWERS\s*\|$',
        r'^GOLD MEDAL ANSWERS$',
        r'^GOLD MEDAL ESSAY ANSWERS$',
        r'^COMMUNITY MEDICINE [–—] PSM$',
        r'^Grade [A-C] & Grade [A-C] High Priority',
        r'^Topic \d+:.*\| Topic \d+:',
    ]
    
    for pat in patterns:
        if re.search(pat, stripped, re.IGNORECASE):
            return True
    
    return False

def is_watermark_body(line):
    """Check additional watermark patterns that appear as body text"""
    stripped = line.strip()
    patterns = [
        r'^Prepared with Gold Standard Content',
        r'^COMMUNITY MEDICINE$',
        r'^GOLD MEDAL ESSAY-TYPE LONG ANSWERS$',
        r'^— PAGE \d+ —$',
        r'^n swadesh$',
        r'^\d+\s+swadesh$',
        r'^\d+\s+swaDesh$',
        r'^\|\s*— End of Document\s*\|$',
        r'^— END OF GOLD MEDAL',
    ]
    for pat in patterns:
        if re.match(pat, stripped):
            return True
    return False

def has_year_reference(line):
    """Check if line contains year references to remove"""
    return bool(re.search(r'Year:\s*\d{4}', line) or re.search(r'\[\d{4}\]', line))

def clean_year_references(line):
    """Remove year references from a line, preserving rest of content"""
    # Remove "Year: 2021, 2018" type patterns
    line = re.sub(r'Year:\s*\d{4}(?:,\s*\d{4})*(?:\s*\|\s*Frequency:.*?)?', '', line)
    # Remove "[2011]" type patterns (but keep content around them)
    line = re.sub(r'\s*\[\d{4}\]\s*', ' ', line)
    # Remove standalone year in pipe format "| 2025 |"
    # Clean up extra spaces and separators
    line = re.sub(r'\s+\|\s*$', '', line)
    line = re.sub(r'^\s*\|\s*', '', line)
    line = re.sub(r'\s{2,}', ' ', line).strip()
    return line

# ============================================================
# STEP 2: Fix pipe tables in content
# ============================================================

def fix_pipe_tables_in_text(content):
    """Fix all broken pipe-table artifacts in a text block"""
    lines = content.split("\n")
    result_lines = []
    i = 0
    n = len(lines)
    
    while i < n:
        line = lines[i]
        
        if is_pipe_line(line) and not is_separator_row(line):
            # Start of a pipe-table block
            table_block = []
            while i < n and is_pipe_line(lines[i]):
                table_block.append(lines[i])
                i += 1
            
            # Process the table block
            fixed_block = fix_single_pipe_table(table_block)
            result_lines.extend(fixed_block)
            result_lines.append("")  # Blank line after table
        else:
            # Skip separators that are orphaned (no preceding non-sep pipe line)  
            if is_separator_row(line):
                i += 1
                continue
            result_lines.append(line)
            i += 1
    
    return "\n".join(result_lines)

def fix_single_pipe_table(lines):
    """Fix a single pipe-table block. Handles:
    - Extra separator rows (keep only 1 after header)
    - Continuation rows (single cell text that belongs to previous row)
    - Merges split cells
    """
    if not lines:
        return []
    
    # Separate headers, separators, and data rows
    header_line = None
    data_rows = []
    
    for line in lines:
        stripped = line.strip()
        if not (stripped.startswith("|") and stripped.endswith("|")):
            continue
        
        if is_separator_row(line):
            continue  # Skip all separator rows
        
        cells = parse_pipe_cells(line)
        
        if header_line is None:
            header_line = line
        else:
            data_rows.append(cells)
    
    if header_line is None:
        return []
    
    headers = parse_pipe_cells(header_line)
    num_cols = len(headers)
    
    if num_cols == 0:
        return []
    
    # Merge continuation rows
    merged_rows = []
    for cells in data_rows:
        # Check if this is a continuation (fewer non-empty cells than expected)
        non_empty = [c for c in cells if c]
        
        # Handle question wrapper tables (3 cols, all headers empty)
        if num_cols == 3 and all(h == "" for h in headers) and len(cells) >= 1:
            # Just collect the middle cell text
            if cells[1] if len(cells) > 1 else cells[0]:
                merged_rows.append(cells)
            continue
        
        if len(non_empty) <= 1 and merged_rows:
            # Likely continuation of previous row's last cell
            prev = merged_rows[-1]
            if non_empty:
                continuation_text = non_empty[0]
                if prev[-1]:
                    prev[-1] += " " + continuation_text
                else:
                    prev[-1] = continuation_text
        else:
            # Ensure row has correct number of columns
            while len(cells) < num_cols:
                cells.append("")
            merged_rows.append(cells[:num_cols])
    
    # Filter out completely empty rows
    merged_rows = [r for r in merged_rows if any(c for c in r)]
    
    if not merged_rows:
        return []
    
    # Rebuild clean pipe table
    col_widths = [0] * num_cols
    all_rows = [headers] + merged_rows
    for row in all_rows:
        for ci in range(min(len(row), num_cols)):
            col_widths[ci] = max(col_widths[ci], len(str(row[ci])))
    
    result = []
    # Header row
    result.append("| " + " | ".join(str(headers[ci]).ljust(col_widths[ci]) if ci < len(headers) else " ".ljust(col_widths[ci]) for ci in range(num_cols)) + " |")
    # Single separator row
    result.append("| " + " | ".join("-" * max(w, 3) for w in col_widths) + " |")
    # Data rows
    for row in merged_rows:
        padded = [str(row[ci]).ljust(col_widths[ci]) if ci < len(row) else " ".ljust(col_widths[ci]) for ci in range(num_cols)]
        result.append("| " + " | ".join(padded) + " |")
    
    return result


# ============================================================
# STEP 3: Convert text tables to pipe tables
# ============================================================

def convert_text_tables_to_pipe(content):
    """Detect and convert text-based tables to markdown pipe tables."""
    lines = content.split("\n")
    
    # Strategy: detect patterns like:
    # HEADER1 HEADER2 HEADER3
    # value1  value2  value3
    # value1  value2  value3
    # (two or more header lines followed by data lines)
    
    # This is complex and error-prone. Skip for now - the parser in ReadingView.js
    # handles this reasonably via preprocessTextTables.
    
    return content


# ============================================================
# STEP 4: Clean individual content
# ============================================================

def clean_content(content):
    """Clean a single content string: fix pipes, remove metadata, strip years"""
    # Fix pipe tables first
    content = fix_pipe_tables_in_text(content)
    
    lines = content.split("\n")
    cleaned = []
    
    for line in lines:
        stripped = line.strip()
        
        # Skip metadata/watermark lines
        if is_metadata_line(line) or is_watermark_body(line):
            continue
        
        # Clean year references if present
        if has_year_reference(line):
            cleaned_line = clean_year_references(line)
            if cleaned_line:
                cleaned.append(cleaned_line)
            continue
        
        # Skip lines that are just "---" or "===" (watermarks)
        if re.match(r'^[-=]{3,}$', stripped) and not stripped.startswith("|"):
            continue
        
        cleaned.append(line)
    
    # Remove consecutive blank lines (max 1 blank line between sections)
    result = []
    prev_blank = False
    for line in cleaned:
        is_blank = line.strip() == ""
        if is_blank and prev_blank:
            continue
        result.append(line)
        prev_blank = is_blank
    
    return "\n".join(result)


# ============================================================
# STEP 5: Process all topics
# ============================================================

topics = data["subsections"][0]["subsections"]

print(f"Processing {len(topics)} topics...")

for topic in topics:
    original_len = len(topic["content"])
    topic["content"] = clean_content(topic["content"])
    new_len = len(topic["content"])
    if original_len != new_len:
        print(f"  {topic['id']}: {original_len} -> {new_len} chars ({'+' if new_len > original_len else ''}{new_len - original_len})")

# ============================================================
# STEP 6: Merge paired topics
# ============================================================

def normalize_title(title):
    """Normalize title for comparison (strip number prefix, normalize spaces/slashes)"""
    # Remove leading number like "6. " or "6."
    t = re.sub(r'^\d+\.\s*', '', title).strip()
    # Normalize spaces
    t = re.sub(r'\s+', ' ', t)
    # Normalize the em-dash variant (various unicode dash characters)
    t = t.replace('\u2014', '-').replace('\u2013', '-').replace('\u2012', '-')
    return t.lower()

# Group topics by normalized title
groups = {}
for topic in topics:
    key = normalize_title(topic["title"])
    if key not in groups:
        groups[key] = []
    groups[key].append(topic)

# Merge groups with multiple topics
merged_topics = []
for key, group in groups.items():
    if len(group) == 1:
        merged_topics.append(group[0])
    else:
        # Merge - take the first topic as base, append content from others
        base = group[0]
        # Combine all content, with deduplication
        all_lines = base["content"].split("\n")
        seen = set()
        unique = []
        for line in all_lines:
            stripped = line.strip()
            if stripped and stripped not in seen:
                seen.add(stripped)
            unique.append(line)
        base_content = "\n".join(unique)
        
        for other in group[1:]:
            other_lines = other["content"].split("\n")
            for line in other_lines:
                stripped = line.strip()
                if stripped and stripped not in seen:
                    seen.add(stripped)
                    base_content += "\n" + line
        
        base["content"] = base_content.strip()
        
        # Renumber: use lower number from the pair
        num1 = int(re.search(r'^pyq-paper1-t(\d+)', group[0]["id"]).group(1))
        for other in group[1:]:
            num2 = int(re.search(r'^pyq-paper1-t(\d+)', other["id"]).group(1))
            if num2 < num1:
                # Swap - use the lower numbered one as base
                pass  # base already is group[0]
        
        # Update title to use lower number
        min_num = min(int(re.search(r'^pyq-paper1-t(\d+)', t["id"]).group(1)) for t in group)
        base["id"] = f"pyq-paper1-t{min_num}"
        base["title"] = f"{min_num}. " + re.sub(r'^\d+\.\s*', '', group[0]["title"])
        
        merged_topics.append(base)
        print(f"  Merged {len(group)} topics into: {base['id']} - {base['title']} (combined {len(base['content'])} chars)")

# Sort by topic number
merged_topics.sort(key=lambda t: int(re.search(r'pyq-paper1-t(\d+)', t["id"]).group(1)))

# Renumber sequentially after merging
for i, topic in enumerate(merged_topics, 1):
    old_id = topic["id"]
    topic["id"] = f"pyq-paper1-t{i}"
    # Update title number
    topic["title"] = re.sub(r'^\d+\.\s*', f'{i}. ', topic["title"])
    if old_id != topic["id"]:
        print(f"  Renumbered: {old_id} -> {topic['id']}")

# Fix title/content splitting: if content starts with title continuation
# (ALL CAPS line that looks like it's part of the title), merge into title
for topic in merged_topics:
    content_lines = topic["content"].lstrip().split("\n", 1)
    if len(content_lines) >= 2:
        first_line = content_lines[0].strip()
        # Check if first line looks like a title continuation:
        # - ALL CAPS or proper-name-like
        # - Short (< 80 chars)
        # - Not starting with Q (question) or common section headers
        is_continuation = (
            first_line and
            len(first_line) < 80 and
            not re.match(r'^Q\d+\.?\s', first_line) and
            not first_line.startswith("INTRODUCTION") and
            not first_line.startswith("DEFINITION") and
            not first_line.startswith("CLASSIFICATION") and
            not first_line.startswith("Frequency") and
            first_line.upper() == first_line and
            any(c.isalpha() for c in first_line)
        )
        if is_continuation:
            topic["title"] = topic["title"].rstrip() + " " + first_line
            topic["content"] = content_lines[1].lstrip()
            print(f"  Fixed title continuation: {topic['id']} -> {topic['title'][:100]}")

# Update the data
data["subsections"][0]["subsections"] = merged_topics

print(f"\nAfter merging: {len(merged_topics)} topics")

# ============================================================
# STEP 7: Save cleaned data
# ============================================================

with open(r"D:\The App\src\data\pyqData.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("\nCleaned pyqData.json saved successfully!")
print(f"Topics reduced from {len(topics)} to {len(merged_topics)}")
