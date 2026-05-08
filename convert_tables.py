#!/usr/bin/env python3
"""
Convert text-formatted tables in pyqData.json to markdown format with | delimiters.
Format:
- Headers: consecutive non-empty lines
- Data: non-empty lines separated by empty lines
- Rows = groups of len(headers) cells each
"""
import json
import re

def find_tables(content):
    """Find table structures in content"""
    lines = content.split('\n')
    n = len(lines)
    tables = []
    
    i = 0
    while i < n:
        line = lines[i].strip()
        
        # Skip empty lines and lines that are clearly not headers
        if not line or len(line) > 60:
            i += 1
            continue
        
        # Skip lines starting with special characters
        if line.startswith(('Q', 'A)', '#', '##', '!', '>', '|', '- ', '•', '◦')):
            i += 1
            continue
        
        # Found a potential header - collect consecutive non-empty lines
        header_start = i
        headers = []
        
        while i < n and lines[i].strip():
            h = lines[i].strip()
            # Stop if line is too long or starts with special chars
            if len(h) > 60 or h.startswith(('Q', 'A)', '#', '##', '!', '>', '|', '- ', '•')):
                break
            headers.append(h)
            i += 1
        
        # Need at least 2 headers to be a table
        if len(headers) < 2:
            i = header_start + 1
            continue
        
        # Now we should have empty lines, then data cells
        # Skip empty lines
        while i < n and not lines[i].strip():
            i += 1
        
        # Collect data cells (non-empty lines separated by empty lines)
        data_cells = []
        while i < n:
            line = lines[i].strip()
            
            # Stop if we hit a section header
            if not line:
                i += 1
                continue
            if line.startswith(('Q', 'A)', '#', '##', '!', '>')):
                break
            if re.match(r'^(Introduction|Detailed|Critical|Advantages|Limitations|Relevance)', line, re.IGNORECASE):
                break
            
            data_cells.append(line)
            i += 1
            
            # Skip empty line after cell
            if i < n and not lines[i].strip():
                i += 1
        
        # Validate: we need enough data cells (at least one row)
        if len(data_cells) >= len(headers):
            tables.append({
                'start': header_start,
                'headers': headers,
                'data_cells': data_cells
            })
    
    return tables

def table_to_markdown(headers, data_cells):
    """Convert headers and flat list of data cells to markdown table"""
    num_cols = len(headers)
    
    md_lines = []
    
    # Header row
    md_lines.append('| ' + ' | '.join(headers) + ' |')
    
    # Separator row
    md_lines.append('| ' + ' | '.join(['---'] * num_cols) + ' |')
    
    # Data rows - group cells into rows of num_cols each
    for i in range(0, len(data_cells), num_cols):
        row = data_cells[i:i+num_cols]
        # Pad if necessary
        while len(row) < num_cols:
            row.append('')
        md_lines.append('| ' + ' | '.join(row) + ' |')
    
    return md_lines

def process_content(content):
    """Process content to find and convert tables"""
    tables = find_tables(content)
    
    if not tables:
        return content
    
    lines = content.split('\n')
    new_lines = []
    last_end = 0
    
    for table in tables:
        # Add lines before the table
        new_lines.extend(lines[last_end:table['start']])
        
        # Add blank line before table if needed
        if new_lines and new_lines[-1].strip():
            new_lines.append('')
        
        # Convert table to markdown
        md_lines = table_to_markdown(table['headers'], table['data_cells'])
        new_lines.extend(md_lines)
        
        # Add blank line after table
        new_lines.append('')
        
        # Update last_end (approximate - we'll recalculate)
        last_end = table['start'] + len(table['headers']) + len(table['data_cells']) + 5
    
    # Add remaining lines (this is approximate)
    # Better approach: rebuild from scratch
    return content  # Placeholder

def process_content_v2(content):
    """Process content - rebuild with table conversions"""
    lines = content.split('\n')
    n = len(lines)
    
    # Find tables
    tables = find_tables(content)
    if not tables:
        return content
    
    # Build a set of line indices that belong to tables
    table_indices = set()
    table_map = {}  # start_index -> table_info
    
    for table in tables:
        start = table['start']
        # Mark header lines
        for j in range(len(table['headers'])):
            table_indices.add(start + j)
        # Mark data cell lines (approximate)
        # This is tricky because we need to track which original lines are data cells
        table_map[start] = table
    
    # Rebuild content
    new_lines = []
    i = 0
    while i < n:
        if i in table_map:
            table = table_map[i]
            
            # Add blank line before table if needed
            if new_lines and new_lines[-1].strip():
                new_lines.append('')
            
            # Add markdown table
            md_lines = table_to_markdown(table['headers'], table['data_cells'])
            new_lines.extend(md_lines)
            
            # Add blank line after table
            new_lines.append('')
            
            # Skip past the table in original content
            i = i + len(table['headers'])
            # Skip empty lines
            while i < n and not lines[i].strip():
                i += 1
            # Skip data cells (each separated by empty line)
            cells_seen = 0
            while cells_seen < len(table['data_cells']) and i < n:
                if lines[i].strip():
                    cells_seen += 1
                i += 1
        else:
            new_lines.append(lines[i])
            i += 1
    
    return '\n'.join(new_lines)

def main():
    input_path = r'D:\The App\src\data\pyqData.json'
    
    print(f"Reading {input_path}...")
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    def process_item(item):
        if 'content' in item and item['content']:
            item['content'] = process_content_v2(item['content'])
        if 'subsections' in item:
            for sub in item['subsections']:
                process_item(sub)
        return item
    
    print("Processing content to convert tables...")
    data = process_item(data)
    
    output_path = r'D:\The App\src\data\pyqData.json'
    print(f"Writing {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("Done! Tables converted to markdown format.")

if __name__ == '__main__':
    main()
