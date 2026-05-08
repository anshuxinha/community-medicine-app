import fitz
import json
import re
import os

pdf_path = r"D:\Stroma Files\PYQs\Paper 1.pdf"
output_path = r"D:\The App\paper1_extracted.txt"

doc = fitz.open(pdf_path)

all_text = ""
for page_num in range(12, doc.page_count):
    page = doc[page_num]
    text = page.get_text()
    all_text += f"\n\n--- PAGE {page_num + 1} ---\n\n{text}"

with open(output_path, "w", encoding="utf-8") as f:
    f.write(all_text)

print(f"Extracted {doc.page_count - 12} pages starting from page 13")
print(f"Total characters: {len(all_text)}")
doc.close()
