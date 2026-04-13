import json
import os
import re
import time
from datetime import datetime
from difflib import SequenceMatcher
from typing import Any, Dict, Iterable, List, Optional, Tuple

import requests  # type: ignore
from bs4 import BeautifulSoup  # type: ignore

# --- GEMINI CONFIGURATION ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
GEMINI_MODEL = "gemini-flash-latest"
REQUEST_TIMEOUT_SECONDS = int(os.environ.get("GEMINI_TIMEOUT_SECONDS", "90"))

# --- APP DATA SETTINGS ---
MOCK_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "data", "mockData.json")
VERIFY_TARGET_ROOT_IDS = {
    item.strip()
    for item in os.environ.get("VERIFY_TARGET_ROOT_IDS", "7,8,15,16,21,23,25,27").split(",")
    if item.strip()
}
VERIFY_MAX_CLAIMS_PER_ITEM = int(os.environ.get("VERIFY_MAX_CLAIMS_PER_ITEM", "18"))
VERIFY_MAX_CLAIMS_PER_BATCH = int(os.environ.get("VERIFY_MAX_CLAIMS_PER_BATCH", "6"))
VERIFY_MAX_BATCHES_PER_ITEM = int(os.environ.get("VERIFY_MAX_BATCHES_PER_ITEM", "3"))
MIN_SAFE_LINE_REPLACEMENT_SIMILARITY = float(os.environ.get("VERIFY_MIN_SAFE_REPLACEMENT_SIMILARITY", "0.72"))

TODAY_LABEL = datetime.utcnow().date().isoformat()
GEMINI_FATAL_ERROR: Optional[str] = None

VOLATILE_KEYWORDS = (
    "WHO",
    "guideline",
    "guidelines",
    "policy",
    "programme",
    "program",
    "scheme",
    "strategy",
    "mission",
    "yojana",
    "incentive",
    "benefit",
    "financial",
    "cash",
    "dbt",
    "surveillance",
    "notification",
    "vaccination",
    "vaccine",
    "schedule",
    "dose",
    "target",
    "goal",
    "launch",
    "launched",
    "implemented",
    "amended",
    "revised",
    "notifiable",
    "ihr",
    "icd",
    "iphs",
    "nhm",
    "ntep",
    "nacp",
    "nlep",
    "uip",
    "icmr",
    "mohfw",
    "ayushman",
    "family planning",
    "maternal",
    "child",
    "tb",
    "tuberculosis",
    "air pollution",
    "plastic waste",
    "waste management",
)

UPDATE_SENSITIVE_TOKEN_RE = re.compile(
    r"""
    (?:₹\s*\d[\d,]*(?:\.\d+)?)
    |(?:\b(?:rs\.?|inr)\s*\d[\d,]*(?:\.\d+)?)
    |(?:\b(?:<=|>=|<|>)?\s*\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s*
        (?:%|percent|mg|g|kg|mcg|ml|l|days?|weeks?|months?|years?|hrs?|hours?|minutes?|lakhs?|crores?|million|billion|beds?)\b)
    |(?:\b\d+(?:\.\d+)?/\d+(?:,\d{3})*(?:\.\d+)?\b)
    |(?:\b\d+(?:\.\d+)?[A-Za-z]{1,6}\b)
    |(?:\b[A-Za-z]+\d+[A-Za-z]*\b)
    |(?:\b(?:<=|>=|<|>)?\s*\d[\d,]*(?:\.\d+)?\b)
    """,
    re.IGNORECASE | re.VERBOSE,
)


def _call_openrouter(prompt: str) -> Optional[Any]:
    global GEMINI_FATAL_ERROR

    if GEMINI_FATAL_ERROR:
        return None

    try:
        response = requests.post(
            GEMINI_API_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {GEMINI_API_KEY}",
                "HTTP-Referer": "https://github.com",
                "X-Title": "Mock Data Verifier"
            },
            json={
                "model": GEMINI_MODEL,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        print(f"Gemini API request exception: {exc}")
        return None

    if response.status_code == 200:
        try:
            data = response.json()
        except (json.JSONDecodeError, ValueError) as exc:
            print(f"Gemini API returned non-JSON body (status 200): {exc}")
            return None
        text_response = _extract_candidate_text(data)
        if text_response:
            payload = _extract_json_payload(text_response)
            if payload is not None:
                return payload
        print(f"Gemini API: could not parse JSON payload from response")
        return None

    message = _error_message_from_response(response)
    print(f"Gemini API Error {response.status_code}: {message}")

    if response.status_code in (429, 500, 503):
        time.sleep(5)
        try:
            retry = requests.post(
                GEMINI_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {GEMINI_API_KEY}",
                    "HTTP-Referer": "https://github.com",
                    "X-Title": "Mock Data Verifier"
                },
                json={
                    "model": GEMINI_MODEL,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1,
                },
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:
            print(f"Gemini API retry failed: {exc}")
            return None

        if retry.status_code == 200:
            try:
                data = retry.json()
            except (json.JSONDecodeError, ValueError):
                return None
            text_response = _extract_candidate_text(data)
            if text_response:
                json_payload = _extract_json_payload(text_response)
                if json_payload is not None:
                    return json_payload
        elif retry.status_code == 401:
            print("Gemini API: Fatal Authentication Error (401).")
            GEMINI_FATAL_ERROR = "Gemini API authentication/configuration error."
        return None

    combined_error = f"{response.status_code} {message}".lower()
    if "api key" in combined_error or "unauthorized" in combined_error or "forbidden" in combined_error:
        GEMINI_FATAL_ERROR = "Gemini API authentication/configuration error."
        print("Gemini is marked unavailable for the rest of this run.")

    return None


def _extract_candidate_text(payload: Dict[str, Any]) -> Optional[str]:
    choices = payload.get("choices", [])
    if not choices:
        return None
    message = choices[0].get("message", {})
    content = message.get("content")
    return content if isinstance(content, str) else None


def _error_message_from_response(response: requests.Response) -> str:
    try:
        payload = response.json()
        error_obj = payload.get("error", {})
        if isinstance(error_obj, dict):
            return error_obj.get("message") or error_obj.get("status") or response.text
        return response.text
    except Exception:
        return response.text


def _strip_code_fence(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        return "\n".join(lines[1:-1]).strip()
    return stripped


def _extract_json_payload(text: str) -> Optional[Any]:
    candidate = _strip_code_fence(text)
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        match = re.search(r"(\[.*\]|\{.*\})", candidate, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            return None


def _normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _line_shape_without_sensitive_tokens(value: str) -> str:
    collapsed = UPDATE_SENSITIVE_TOKEN_RE.sub("<VALUE>", value)
    return _normalize_whitespace(collapsed).lower()


def _minimal_sensitive_token_update(original_line: str, replacement_line: str) -> Optional[str]:
    original_matches = list(UPDATE_SENSITIVE_TOKEN_RE.finditer(original_line))
    replacement_matches = list(UPDATE_SENSITIVE_TOKEN_RE.finditer(replacement_line))
    if not original_matches or len(original_matches) != len(replacement_matches):
        return None

    if _line_shape_without_sensitive_tokens(original_line) != _line_shape_without_sensitive_tokens(replacement_line):
        return None

    pieces: List[str] = []
    cursor = 0
    changed = False

    for original_match, replacement_match in zip(original_matches, replacement_matches):
        pieces.append(original_line[cursor:original_match.start()])
        replacement_token = replacement_match.group(0)
        pieces.append(replacement_token)
        if original_match.group(0) != replacement_token:
            changed = True
        cursor = original_match.end()

    pieces.append(original_line[cursor:])
    if not changed:
        return None

    return "".join(pieces)


def _is_safe_line_replacement(original_line: str, replacement_line: str) -> bool:
    original_normalized = _normalize_whitespace(original_line)
    replacement_normalized = _normalize_whitespace(replacement_line)
    if not original_normalized or not replacement_normalized:
        return False

    if original_normalized == replacement_normalized:
        return False

    similarity = SequenceMatcher(None, original_normalized, replacement_normalized).ratio()
    if similarity >= MIN_SAFE_LINE_REPLACEMENT_SIMILARITY:
        return True

    original_shape = _line_shape_without_sensitive_tokens(original_normalized)
    replacement_shape = _line_shape_without_sensitive_tokens(replacement_normalized)
    return bool(original_shape and replacement_shape and original_shape in replacement_shape)


def _is_heading_like(line: str) -> bool:
    normalized = _normalize_whitespace(line)
    if not normalized:
        return False
    letters = re.sub(r"[^A-Za-z]+", "", normalized)
    if not letters:
        return False
    return letters.isupper() and len(letters) >= 4


def _volatility_score(line: str) -> int:
    lowered = line.lower()
    score = 0

    if any(keyword in lowered for keyword in VOLATILE_KEYWORDS):
        score += 2
    if re.search(r"\b(rs\.?|inr)\b", lowered) or "\u20b9" in lowered:
        score += 4
    if re.search(r"\b\d{4}\b", lowered):
        score += 2
    if re.search(r"\b\d+(\.\d+)?\s*(%|percent|mg|ml|days?|weeks?|months?|years?)\b", lowered):
        score += 2
    if re.search(r"\b(by|target|goal|valid|effective|launched|implemented|notified)\b", lowered):
        score += 1
    if re.search(r"[<>]=?\s*\d", lowered):
        score += 1

    return score


def _extract_claim_lines(text_content: str) -> List[str]:
    seen: Dict[str, Dict[str, Any]] = {}

    for raw_line in text_content.splitlines():
        line = raw_line.strip()
        if not line or _is_heading_like(line):
            continue

        score = _volatility_score(line)
        if score <= 0:
            continue

        normalized = _normalize_whitespace(line)
        existing = seen.get(normalized)
        if existing is None or score > existing["score"]:
            seen[normalized] = {"line": line, "score": score}

    ranked = sorted(
        seen.values(),
        key=lambda item: (-item["score"], len(item["line"])),
    )
    return [item["line"] for item in ranked[:VERIFY_MAX_CLAIMS_PER_ITEM]]


def _batched(items: List[str], batch_size: int) -> Iterable[List[str]]:
    for index in range(0, len(items), batch_size):
        yield items[index:index + batch_size]


def _fetch_pib_notifications_for_programs(program_keywords: List[str]) -> str:
    """Fetch recent PIB notifications for MoHFW for the current month.

    Uses ASP.NET postback mechanism: the PIB AllRelease page has no submit
    button; selecting a ministry dropdown triggers a postback via __EVENTTARGET.
    MoHFW is value 31 in the ministry dropdown.
    """
    url = "https://www.pib.gov.in/AllRelease.aspx?MenuId=30&reg=3&lang=1"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.pib.gov.in/index.aspx"
    }

    # Stable ASP.NET control names (derived from page inspection)
    MINISTRY_FIELD = "ctl00$ContentPlaceHolder1$ddlMinistry"
    MOHFW_VALUE = "31"  # Ministry of Health and Family Welfare

    try:
        session = requests.Session()

        # Step 1: GET the page to extract ASP.NET hidden fields
        print("  PIB: Fetching AllRelease page...")
        response = session.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract required ASP.NET hidden fields
        def _hidden_val(field_id: str) -> str:
            tag = soup.find("input", {"id": field_id})
            return tag["value"] if tag else ""

        viewstate_val = _hidden_val("__VIEWSTATE")
        viewstategen_val = _hidden_val("__VIEWSTATEGENERATOR")
        eventvalidation_val = _hidden_val("__EVENTVALIDATION")

        if not viewstate_val:
            print("  PIB: WARNING - __VIEWSTATE not found on the page.")

        # Step 2: POST to filter by MoHFW using __EVENTTARGET postback
        # The PIB page has no submit button — dropdown selection triggers
        # an ASP.NET autopostback via __EVENTTARGET.
        print(f"  PIB: Posting ministry filter (MoHFW={MOHFW_VALUE})...")
        payload = {
            "__EVENTTARGET": MINISTRY_FIELD,
            "__EVENTARGUMENT": "",
            "__VIEWSTATE": viewstate_val,
            "__VIEWSTATEGENERATOR": viewstategen_val,
            "__EVENTVALIDATION": eventvalidation_val,
            "__VIEWSTATEENCRYPTED": "",
            MINISTRY_FIELD: MOHFW_VALUE,
        }

        post_response = session.post(url, data=payload, headers=headers, timeout=30)
        post_response.raise_for_status()
        post_soup = BeautifulSoup(post_response.text, 'html.parser')

        # Step 3: Extract press release links from the filtered results
        feed_items = []
        for a in post_soup.find_all('a'):
            href = a.get('href', '')
            text = a.text.strip()
            if text and 'PRID=' in href:
                prid = href.split('PRID=')[-1].split('&')[0]
                link = f"https://www.pib.gov.in/PressReleseDetail.aspx?PRID={prid}"
                if not any(i['link'] == link for i in feed_items):
                    feed_items.append({"title": text, "link": link})

        print(f"  PIB: Found {len(feed_items)} MoHFW press releases this month.")

        if not feed_items:
            return "No recent PIB notifications found for MoHFW this month."

        # Truncate to avoid massive context payloads if it's a busy month
        feed_items = feed_items[:40]

        filter_prompt = f"""
You are an expert in Indian Public Health policy.
Review these PIB press release titles from the Ministry of Health and Family Welfare. 
Select up to 5 that are highly relevant to these Community Medicine program areas:
{', '.join(program_keywords)}

Return ONLY a JSON array of objects with "title" and "link" for relevant items.
If none are relevant, return [].

Titles:
{json.dumps(feed_items, indent=2)}
"""
        selected = _call_openrouter(filter_prompt)
        if not selected or not isinstance(selected, list):
            return "No relevant PIB notifications found for the target programs."

        selected = selected[:5]
        notifications_text = []
        for item in selected:
            try:
                pr_response = requests.get(item['link'], headers=headers, timeout=15)
                pr_response.raise_for_status()
                pr_soup = BeautifulSoup(pr_response.text, 'html.parser')
                raw_text = " ".join(pr_soup.get_text(separator=' ', strip=True).split())
                notifications_text.append(f"TITLE: {item['title']}\nLINK: {item['link']}\nCONTENT: {raw_text[:4000]}")
            except Exception as e:
                print(f"  Error fetching {item['link']}: {e}")

        return "\n\n---\n\n".join(notifications_text) if notifications_text else "No relevant PIB notifications found."

    except Exception as e:
        print(f"Error fetching PIB feed: {e}")
        return "Could not fetch PIB notifications."


def _verify_claim_batch(item_title: str, item_id: str, claim_lines: List[str], pib_context: str) -> List[Dict[str, str]]:
    if not claim_lines:
        return []

    prompt = f"""
You are an expert Indian Community Medicine and Public Health editor.
Today is {TODAY_LABEL}.

TASK:
Verify the factual accuracy of claim lines for a medical learning app chapter titled "{item_title}" (ID: {item_id}).
Compare each line against the recent PIB notifications provided below.

RECENT PIB NOTIFICATIONS:
{pib_context}

RULES:
1. Return ONLY a JSON array of objects.
2. Omit any line that is still accurate and complete enough.
3. For each outdated, inaccurate, or materially incomplete line, return:
   {{
     "original": "exact original line from input",
     "replacement": "corrected line in the same concise style",
     "reason": "very short reason mentioning what changed (deadline, amount, eligibility, name, strategy, target, statistics, achievement etc.)",
     "source": "PIB title or URL"
   }}
4. Only update specific factual tokens like (but not limited to): amounts, target years, thresholds, doses, durations, coverage figures, age cutoffs, validity periods, program names, eligibility criteria, benefit amounts, or strategy changes.
5. Do NOT create new standalone bullets or new sections unless absolutely necessary.
Anchor every change to an existing input line.
6. Preserve the exam-oriented wording and formatting style.
7. If the correction is only a money amount, year, percentage, count, dose, or similar factual token, keep the rest of the line unchanged.
8. If unsure, do not guess. Ignore that line.
9. Focus on: deadlines, eligibility criteria, name changes, strategies, objectives, achievements, benefit amounts, coverage targets, and any other relevant data changes.
Claim lines to verify:
{json.dumps(claim_lines, ensure_ascii=False, indent=2)}
"""

    payload = _call_openrouter(prompt)
    if payload is None:
        return []
    if isinstance(payload, dict):
        payload = payload.get("changes") or payload.get("updates") or payload.get("corrections") or []
    if not isinstance(payload, list):
        return []

    corrections: List[Dict[str, str]] = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        original = str(item.get("original", "")).strip()
        replacement = str(item.get("replacement", "")).strip()
        reason = str(item.get("reason", "")).strip()
        source = str(item.get("source", "")).strip()
        if not original or not replacement:
            continue
        corrections.append({
            "original": original,
            "replacement": replacement,
            "reason": reason,
            "source": source,
        })
    return corrections


def _apply_corrections(text_content: str, corrections: List[Dict[str, str]]) -> Tuple[str, List[Dict[str, str]]]:
    updated_content = text_content
    applied: List[Dict[str, str]] = []
    used_originals = set()

    for correction in corrections:
        original = _normalize_whitespace(correction.get("original", ""))
        replacement = correction.get("replacement", "").strip()
        if not original or not replacement or original in used_originals:
            continue

        matched_line = None
        for existing_line in updated_content.splitlines():
            if _normalize_whitespace(existing_line) == original:
                matched_line = existing_line
                break

        if matched_line is None:
            continue

        minimal_replacement = _minimal_sensitive_token_update(matched_line, replacement)
        if minimal_replacement is not None:
            replacement_line = minimal_replacement
        else:
            if not _is_safe_line_replacement(matched_line, replacement):
                continue
            leading_whitespace = matched_line[: len(matched_line) - len(matched_line.lstrip())]
            replacement_line = f"{leading_whitespace}{replacement}"
        updated_content = updated_content.replace(matched_line, replacement_line, 1)
        used_originals.add(original)
        applied.append({
            **correction,
            "matched_line": matched_line.strip(),
            "replacement_line": replacement_line.strip(),
        })

    return updated_content, applied


def _strip_recently_updated(items: List[Dict[str, Any]]) -> None:
    for item in items:
        if "recentlyUpdated" in item:
            del item["recentlyUpdated"]
        if "updatedSegments" in item:
            del item["updatedSegments"]
        if "subsections" in item:
            _strip_recently_updated(item["subsections"])


def _get_program_keywords_for_item(item: Dict[str, Any]) -> List[str]:
    title = item.get("title", "").lower()
    content = item.get("content", "").lower()

    keywords = set()
    for kw in VOLATILE_KEYWORDS:
        if kw in title or kw in content:
            keywords.add(kw)

    title_words = title.split()
    for word in title_words:
        if len(word) > 3:
            keywords.add(word)

    return list(keywords)[:15]


def process_file_verification(file_path: str) -> None:
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            data: List[Dict[str, Any]] = json.load(file)

        filename = os.path.basename(file_path)
        if filename != "mockData.json":
            print(f"\n--- Skipping {filename}: this workflow only updates mockData.json ---")
            return

        target_root_items = [item for item in data if str(item.get("id")) in VERIFY_TARGET_ROOT_IDS]
        if not target_root_items:
            print(f"No matching target IDs found in {filename}.")
            return

        print(f"\n--- Verifying {filename} ({len(target_root_items)} targeted root chapters) ---")
        print(
            "Target scope: "
            + ", ".join(f"{item.get('id')}: {item.get('title', 'Unknown')}" for item in target_root_items)
        )
        _strip_recently_updated(target_root_items)

        updates_made = 0

        def verify_item_recursively(item: Dict[str, Any], index_str: str, pib_context: str) -> None:
            """Verify an item and its subsections against cached PIB context."""
            nonlocal updates_made

            if str(item.get("id")) == "7-0":
                print(f"Skipping [{index_str}]: {item.get('title', 'Unknown')} (excluded)")
                return

            print(f"Verifying [{index_str}]: {item.get('title', 'Unknown')}")

            if "content" in item:
                original_content = item["content"]
                candidate_lines = _extract_claim_lines(original_content)
                if candidate_lines:
                    all_corrections: List[Dict[str, str]] = []
                    for batch_index, batch in enumerate(_batched(candidate_lines, VERIFY_MAX_CLAIMS_PER_BATCH)):
                        if batch_index >= VERIFY_MAX_BATCHES_PER_ITEM:
                            break
                        batch_corrections = _verify_claim_batch(
                            item.get("title", "Unknown"),
                            str(item.get("id", "")),
                            batch,
                            pib_context
                        )
                        all_corrections.extend(batch_corrections)
                        time.sleep(2)

                    new_content, applied_corrections = _apply_corrections(original_content, all_corrections)
                    if new_content != original_content:
                        item["content"] = new_content
                        item["recentlyUpdated"] = True
                        item["updatedSegments"] = list(dict.fromkeys(
                            correction.get("replacement_line", "").strip()
                            for correction in applied_corrections
                            if correction.get("replacement_line", "").strip()
                        ))
                        updates_made += 1
                        print(f"  -> Applied {len(applied_corrections)} claim-level corrections.")
                        for correction in applied_corrections[:3]:
                            source_text = correction.get("source") or "PIB notification"
                            reason_text = correction.get("reason") or "claim updated"
                            print(f"     - {reason_text} [{source_text}]")
                    else:
                        print("  -> No changes needed based on current MoHFW notifications.")
                else:
                    print("  -> No high-volatility claims detected; skipped to save cost.")

            if "subsections" in item:
                for sub_index, subsection in enumerate(item["subsections"]):
                    verify_item_recursively(subsection, f"{index_str}.{sub_index + 1}", pib_context)

        for item in target_root_items:
            # Fetch PIB context ONCE per root chapter, then reuse for all subsections
            program_keywords = _get_program_keywords_for_item(item)
            print(f"\nFetching MoHFW PIB notifications for root chapter '{item.get('title', 'Unknown')}'...")
            cached_pib_context = _fetch_pib_notifications_for_programs(program_keywords)
            verify_item_recursively(item, str(item.get("id", "Unknown")), cached_pib_context)

        if updates_made > 0:
            print(f"\nVerification complete for {filename}. {updates_made} sections were updated.")
            with open(file_path, "w", encoding="utf-8") as file:
                json.dump(data, file, indent=4, ensure_ascii=False)
            print(f"Successfully wrote updated data to {filename}.")
        else:
            print(f"\nVerification complete for {filename}. No factual changes were needed.")

    except FileNotFoundError:
        print(f"Error: Could not find data file at {file_path}")
    except json.JSONDecodeError:
        print(f"Error: {file_path} is not valid JSON.")
    except Exception as exc:
        print(f"An unexpected error occurred: {exc}")


def verify_and_update_all() -> None:
    process_file_verification(MOCK_DATA_PATH)


if __name__ == "__main__":
    print("Starting MoHFW claim-focused verification of mockData.json against current monthly guidance...")
    print(f"Using Gemini API with model: {GEMINI_MODEL}")
    verify_and_update_all()