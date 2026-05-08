import pdfplumber
import re

pdf_path = r"D:\Stroma Files\PYQs\Paper 1.pdf"

def is_watermark_line(line):
    s = line.strip()
    if not s:
        return True
    patterns = [
        r'^\d+\s+swa[Dd]esh$',
        r'^SPM\s*—\s*GOLD MEDAL ANSWERS',
        r'^COMMUNITY MEDICINE\b.*GOLD MEDAL',
        r'^Prepared with Gold Standard',
        r'^—\s*End of Document',
        r'^NTRUHS\s+MD\s+Examination\s+Preparation',
        r'^Detailed Model Answers for Q\d',
        r'^Frequency:\s*\d+\s+Times?\s+Asked',
        r'^GRADE [A-C]\s*Priority',
        r'^★\s*NEW\s+TOPICS',
        r'^Star ratings:',
        r'^PART A',
        r'^# TOPIC FREQ GR\. PRIORITY',
        r'^\d+\s+[A-Z][A-Za-z\s/\(\)-]+\s+\d+x\s+[A-C]\s+MUST PREPARE',
        r'^SPM PAPER-I$',
        r'^COMPLETE QUESTION BANK$',
        r'^Prioritised by Exam Frequency',
        r'^Basic Sciences Applied to Social',
        r'^GRADING LEGEND',
        r'^Questions are ranked by frequency',
        r'^GRADE\s+FREQUENCY\s+PRIORITY\s+EXAM STRATEGY',
        r'^★?\s*NEW\s+TOPICS added from',
    ]
    for pat in patterns:
        if re.search(pat, s, re.IGNORECASE):
            return True
    return False

def clean_line(line):
    # Remove trailing year tags like [2011]
    line = re.sub(r'\s*\[\d{4}\]\s*$', '', line)
    # Remove star ratings
    line = re.sub(r'\s*★+\s*', ' ', line)
    # Remove "NEW" in parentheses/tags
    line = re.sub(r'\s*\(\s*NEW\s*\)\s*', ' ', line, flags=re.IGNORECASE)
    line = re.sub(r'\s*NEW\s*', ' ', line, flags=re.IGNORECASE)
    # Remove "Year: 2021" patterns
    line = re.sub(r'\s*Year:\s*\d{4}(?:,\s*\d{4})*', '', line)
    # Clean up double spaces
    line = re.sub(r'\s{2,}', ' ', line)
    return line.strip()

all_lines = []

with pdfplumber.open(pdf_path) as pdf:
    total = len(pdf.pages)
    for i in range(total):
        page = pdf.pages[i]
        text = page.extract_text()
        if not text:
            continue
        lines = text.split('\n')
        for line in lines:
            if is_watermark_line(line):
                continue
            cleaned = clean_line(line)
            if cleaned:
                all_lines.append(cleaned)
        # Add page break marker
        all_lines.append(f"\n---PAGE_BREAK---\n")

# Write raw extracted text
with open(r"D:\The App\pdf_raw_extracted.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(all_lines))

print(f"Extracted {len(all_lines)} lines from {total} pages")
print("Saved to pdf_raw_extracted.txt")
