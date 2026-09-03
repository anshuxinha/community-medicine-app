#!/usr/bin/env python3
"""
verify_directorate_gate.py
Automated Preflight Audit Gate for the Lead Directorate:
- Dr. Aris (Voice, Register, Meta-Language Purge)
- Dr. Maya (Three-Tier Hierarchy, In-text Author Name Purge)
- Alex (Mobile Paragraph Ceiling, Bold Bullet Anchors, Tag Spacing, Em-dash Purge)
"""

import sys
import os
import json
import re
import argparse

# 1. Banned Conversational / Tuition Phrases (Dr. Aris)
BANNED_CONVERSATIONAL_PATTERNS = [
    r"\bresidents should\b",
    r"\bwrite this\b",
    r"\bexaminers? accept\b",
    r"\bin the exam\b",
    r"\bfor [0-9]+ marks\b",
    r"\bdo not write\b",
    r"\bdo not confuse\b",
    r"\bIndia hook\b",
    r"\bIndia teaching\b",
    r"\bIndian teaching\b",
    r"\bolder PFA teaching\b",
    r"\buseful one-liner in a.*viva\b",
    r"\bexam sequence\b",
    r"\bexam contrast\b",
    r"\bcity plan content to write\b",
    r"\bGrade [A-C]\s*★+",
    r"\bNTRUHS\b",
    r"\bexam limbs?\b",
]

# 2. In-Text Author Name-Drops (Dr. Maya)
BANNED_AUTHOR_PATTERNS = [
    r"\bAccording to Park\b",
    r"\bPark states\b",
    r"\bPark defines\b",
    r"\bPark outlines\b",
    r"\bPark's classification\b",
    r"\bPark mentions\b",
    r"\b\(Park\)\b",
]

def check_leaf_content(leaf_id, title, content):
    issues = []
    lines = content.split("\n")
    
    # Check 1: Dr. Aris Meta-Language Audit
    for pat in BANNED_CONVERSATIONAL_PATTERNS:
        matches = re.finditer(pat, content, re.IGNORECASE)
        for m in matches:
            line_idx = content[:m.start()].count("\n") + 1
            matched_text = m.group(0)
            # Skip if inside > **EXAM TIP:** callout
            line_text = lines[line_idx - 1] if line_idx - 1 < len(lines) else ""
            if line_text.strip().startswith(">"):
                continue
            issues.append({
                "auditor": "Dr. Aris",
                "severity": "CRITICAL",
                "leaf": leaf_id,
                "line": line_idx,
                "message": f"Found banned conversational/coaching phrase: '{matched_text}' in body text.",
                "snippet": line_text.strip()[:100]
            })

    # Check 2: Dr. Maya In-Text Author Audit
    for pat in BANNED_AUTHOR_PATTERNS:
        matches = re.finditer(pat, content, re.IGNORECASE)
        for m in matches:
            line_idx = content[:m.start()].count("\n") + 1
            matched_text = m.group(0)
            line_text = lines[line_idx - 1] if line_idx - 1 < len(lines) else ""
            issues.append({
                "auditor": "Dr. Maya",
                "severity": "WARNING",
                "leaf": leaf_id,
                "line": line_idx,
                "message": f"Found in-text textbook attribution: '{matched_text}'. Neutralize to objective public health prose.",
                "snippet": line_text.strip()[:100]
            })

    # Check 3: Alex UX & Typography (Em-dashes, Tags, Bold Anchors, Paragraph Ceiling)
    in_overview = False
    overview_lines = 0
    
    for idx, line in enumerate(lines):
        line_num = idx + 1
        trimmed = line.strip()

        # Em-dash check
        if "\u2014" in line:
            issues.append({
                "auditor": "Alex",
                "severity": "CRITICAL",
                "leaf": leaf_id,
                "line": line_num,
                "message": "Found em-dash (U+2014). Replace with colons, commas, or parentheses.",
                "snippet": trimmed[:100]
            })

        # Tag dump before overview check
        if (trimmed.startswith("[SN]") or trimmed.startswith("[LAQ]")) and idx < 4 and not in_overview:
            # Check if OVERVIEW appears later
            if "OVERVIEW" in content[:1000]:
                issues.append({
                    "auditor": "Alex",
                    "severity": "CRITICAL",
                    "leaf": leaf_id,
                    "line": line_num,
                    "message": "Found [SN]/[LAQ] tag dumped before OVERVIEW. Relocate tags directly above answering sections.",
                    "snippet": trimmed[:100]
                })

        # Tag blank line check
        if (trimmed.startswith("[SN]") or trimmed.startswith("[LAQ]")) and "[/" not in trimmed:
            # Next line should be blank
            if idx + 1 < len(lines) and lines[idx + 1].strip() != "":
                issues.append({
                    "auditor": "Alex",
                    "severity": "CRITICAL",
                    "leaf": leaf_id,
                    "line": line_num,
                    "message": "Tag must be followed by a blank line for parser safety.",
                    "snippet": trimmed[:100]
                })

        # Bold semantic anchors on root bullets
        if re.match(r"^[*\u2022-]\s+", line) and not re.match(r"^\s{2,}", line):
            bullet_body = re.sub(r"^[*\u2022-]\s+", "", line).strip()
            # If bullet has text and doesn't start with **
            if bullet_body and not bullet_body.startswith("**"):
                # Exception: quotes or single words
                if not (bullet_body.startswith('"') or bullet_body.startswith("'")):
                    issues.append({
                        "auditor": "Alex",
                        "severity": "WARNING",
                        "leaf": leaf_id,
                        "line": line_num,
                        "message": "Root bullet point lacks bold semantic anchor `**Topic:**`.",
                        "snippet": trimmed[:100]
                    })

        # Track overview paragraphs
        if "OVERVIEW" in line:
            in_overview = True
        elif in_overview and (line.startswith("#") or (line.isupper() and len(line) > 5)):
            in_overview = False

        # Check 5: Marcus Visual Architecture Audit
        img_match = re.search(r"!\[(.*?)\]\((.*?)\)", line)
        if img_match:
            alt_text = img_match.group(1).strip()
            img_url = img_url_val = img_match.group(2).strip()
            
            # Sub-check: Image inside blockquote / Exam Tip
            if line.strip().startswith(">"):
                issues.append({
                    "auditor": "Marcus",
                    "severity": "CRITICAL",
                    "leaf": leaf_id,
                    "line": line_num,
                    "message": "Image must not be placed inside a blockquote or Exam Tip.",
                    "snippet": line[:100]
                })

            # Sub-check: Preceding blank line
            if idx > 0 and lines[idx - 1].strip() != "":
                issues.append({
                    "auditor": "Marcus",
                    "severity": "WARNING",
                    "leaf": leaf_id,
                    "line": line_num,
                    "message": "Image block must be preceded by a blank line.",
                    "snippet": line[:100]
                })

            # Sub-check: Trailing blank line
            if idx + 1 < len(lines) and lines[idx + 1].strip() != "":
                issues.append({
                    "auditor": "Marcus",
                    "severity": "WARNING",
                    "leaf": leaf_id,
                    "line": line_num,
                    "message": "Image block must be followed by a blank line.",
                    "snippet": line[:100]
                })

            # Sub-check: Alt text quality
            if len(alt_text) < 5:
                issues.append({
                    "auditor": "Marcus",
                    "severity": "WARNING",
                    "leaf": leaf_id,
                    "line": line_num,
                    "message": "Image alt text is missing or too brief (< 5 characters).",
                    "snippet": line[:100]
                })

            # Sub-check: Insecure HTTP
            if img_url_val.startswith("http://"):
                issues.append({
                    "auditor": "Marcus",
                    "severity": "WARNING",
                    "leaf": leaf_id,
                    "line": line_num,
                    "message": "Insecure HTTP image URL; use HTTPS for mobile app security.",
                    "snippet": line[:100]
                })

    return issues

def audit_file(file_path):
    print(f"[*] Directorate Preflight Audit on: {file_path}")
    if not os.path.exists(file_path):
        print(f"[!] Error: File not found: {file_path}")
        return False

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    all_issues = []
    
    # Handle array of chapters or single chapter dict
    chapters = data if isinstance(data, list) else [data]
    
    for ch in chapters:
        cid = str(ch.get("id", "unknown"))
        title = ch.get("title", "")
        subs = ch.get("subsections", [])
        
        if subs:
            for s in subs:
                sid = str(s.get("id", cid))
                stitle = s.get("title", "")
                content = s.get("content", "")
                all_issues.extend(check_leaf_content(sid, stitle, content))
        else:
            content = ch.get("content", "")
            all_issues.extend(check_leaf_content(cid, title, content))

    # Summarize findings
    criticals = [i for i in all_issues if i["severity"] == "CRITICAL"]
    warnings = [i for i in all_issues if i["severity"] == "WARNING"]
    
    print("\n" + "="*70)
    print("DIRECTORATE PREFLIGHT AUDIT SUMMARY")
    print("="*70)
    print(f"Total Leaves Audited: {len(chapters)}")
    print(f"Critical Violations : {len(criticals)}")
    print(f"Warnings / Polish   : {len(warnings)}")
    print("="*70)

    if criticals:
        print("\n[!] CRITICAL VIOLATIONS REQUIRING IMMEDIATE FIX BEFORE DIRECTORATE APPROVAL:")
        for c in criticals[:30]:
            print(f"  [{c['auditor']}] Leaf {c['leaf']} (L{c['line']}): {c['message']}")
            print(f"      Snippet: {c['snippet']}")
        if len(criticals) > 30:
            print(f"  ... and {len(criticals) - 30} more critical violations.")
        print("\n[-] Preflight Gate: FAILED (Directorate will reject until fixed)")
        return False
    else:
        print("\n[+] Preflight Gate: PASSED (Zero critical violations)")
        if warnings:
            print(f"[*] Note: {len(warnings)} non-blocking warnings found for directorate consideration.")
            for w in warnings[:10]:
                print(f"  [{w['auditor']}] Leaf {w['leaf']}: {w['message']}")
        return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Audit Library content against Lead Directorate standards.")
    parser.add_argument("file_path", help="Path to JSON file containing chapters or subsections")
    args = parser.parse_args()
    success = audit_file(args.file_path)
    sys.exit(0 if success else 1)
