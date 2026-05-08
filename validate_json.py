import json
import re

with open('src/data/pyqData.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

paper = data['subsections'][0]
issues = []

for idx, topic in enumerate(paper['subsections']):
    content = topic['content']
    title = topic['title']
    
    # Check for duplicate Q prefixes
    dupes = re.findall(r'Q\d+\.\s+Q\d+\.', content)
    if dupes:
        issues.append(f'Topic {idx+1} ({title[:40]}) has {len(dupes)} duplicate Q prefixes')
    
    # Check for year tags
    year_tags = re.findall(r'\(\d{4}\)|\[\w+\s+\d{4}\]|\(\w+\s+\d{4}\)', content)
    if year_tags:
        issues.append(f'Topic {idx+1} has year tags: {year_tags[:3]}')
    
    # Check for star ratings
    stars = re.findall(r'[★⭐]{3,}', content)
    if stars:
        issues.append(f'Topic {idx+1} has star ratings')
    
    # Check for NEW tags
    news = re.findall(r'\bNEW\b', content, re.IGNORECASE)
    if news:
        issues.append(f'Topic {idx+1} has NEW tags ({len(news)} occurrences)')
    
    # Check for # headers
    hash_headers = re.findall(r'^#\s+\w+', content, re.MULTILINE)
    if hash_headers:
        issues.append(f'Topic {idx+1} has # headers: {hash_headers[:3]}')
    
    # Check for ---PAGE_BREAK---
    if '---PAGE_BREAK---' in content:
        issues.append(f'Topic {idx+1} has page break markers')
    
    # Check for watermark artifacts
    if 'GOLD MEDAL MODEL ANSWERS' in content:
        issues.append(f'Topic {idx+1} has GOLD MEDAL watermark')
    if 'Page ' in content and 'of ' in content:
        issues.append(f'Topic {idx+1} might have page numbers')
    
    # Count questions
    qs = re.findall(r'Q\d+\.', content)
    print(f'Topic {idx+1}: {len(qs)} questions, title="{title[:50]}"')

print(f'\n=== ISSUES ({len(issues)}) ===')
for issue in issues[:30]:
    print(issue)
