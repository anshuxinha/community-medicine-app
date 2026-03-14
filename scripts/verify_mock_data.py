import json
import os
import re
import time
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Tuple

import requests  # type: ignore

GOOGLE_GEMINI_KEY = os.environ.get("GOOGLE_GEMINI_KEY")
if not GOOGLE_GEMINI_KEY:
    raise ValueError("GOOGLE_GEMINI_KEY environment variable is not set")

MODEL_CANDIDATES = [
    model.strip()
    for model in os.environ.get(
        "GEMINI_MODELS",
        "gemini-3-flash-preview,gemini-2.0-flash,gemini-1.5-flash",
    ).split(",")
    if model.strip()
]
API_VERSIONS = ["v1beta", "v1"]
REQUEST_TIMEOUT_SECONDS = int(os.environ.get("GEMINI_TIMEOUT_SECONDS", "60"))

MOCK_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "data", "mockData.json")
VERIFY_TARGET_ROOT_IDS = {
    item.strip()
    for item in os.environ.get("VERIFY_TARGET_ROOT_IDS", "7,8,15,16,21,23,25,27").split(",")
    if item.strip()
}
VERIFY_MAX_CLAIMS_PER_ITEM = int(os.environ.get("VERIFY_MAX_CLAIMS_PER_ITEM", "18"))
VERIFY_MAX_CLAIMS_PER_BATCH = int(os.environ.get("VERIFY_MAX_CLAIMS_PER_BATCH", "6"))
VERIFY_MAX_BATCHES_PER_ITEM = int(os.environ.get("VERIFY_MAX_BATCHES_PER_ITEM", "3"))
VERIFY_ENABLE_GROUNDING = os.environ.get("VERIFY_ENABLE_GROUNDING", "1") != "0"

TODAY_LABEL = datetime.utcnow().date().isoformat()
GEMINI_FATAL_ERROR: Optional[str] = None

GROUNDING_TOOL_VARIANTS = [
    {"googleSearch": {}},
    {"google_search": {}},
    {"googleSearchRetrieval": {}},
    {"google_search_retrieval": {}},
]

VOLATILE_KEYWORDS = (
    "who",
    "guideline",
    "guidelines",
    "policy",
    "programme",
    "program",
    "scheme",
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


def _build_gemini_url(model: str, api_version: str) -> str:
    return (
        f"https://generativelanguage.googleapis.com/{api_version}/models/"
        f"{model}:generateContent?key={GOOGLE_GEMINI_KEY}"
    )


def _extract_candidate_text(payload: Dict[str, Any]) -> Optional[str]:
    candidates = payload.get("candidates", [])
    if not candidates:
        return None
    content = candidates[0].get("content", {})
    parts = content.get("parts", [])
    if not parts:
        return None
    text = parts[0].get("text")
    return text if isinstance(text, str) else None


def _error_message_from_response(response: requests.Response) -> str:
    try:
        payload = response.json()
        return (
            payload.get("error", {}).get("message")
            or payload.get("error", {}).get("status")
            or response.text
        )
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


def _call_gemini_json(prompt: str, grounded: bool) -> Optional[Any]:
    global GEMINI_FATAL_ERROR

    if GEMINI_FATAL_ERROR:
        return None

    errors: List[str] = []
    tool_variants: List[Optional[Dict[str, Any]]] = [None]
    if grounded and VERIFY_ENABLE_GROUNDING:
        tool_variants = GROUNDING_TOOL_VARIANTS + [None]

    for api_version in API_VERSIONS:
        for model in MODEL_CANDIDATES:
            for tool in tool_variants:
                url = _build_gemini_url(model, api_version)
                request_body: Dict[str, Any] = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.1,
                    },
                }
                if tool is not None:
                    request_body["tools"] = [tool]

                try:
                    response = requests.post(
                        url,
                        headers={"Content-Type": "application/json"},
                        json=request_body,
                        timeout=REQUEST_TIMEOUT_SECONDS,
                    )
                except requests.RequestException as exc:
                    errors.append(f"{api_version}/{model}: request exception: {exc}")
                    continue

                if response.status_code == 200:
                    data = response.json()
                    text_response = _extract_candidate_text(data)
                    if not text_response:
                        errors.append(f"{api_version}/{model}: empty candidate response")
                        continue

                    payload = _extract_json_payload(text_response)
                    if payload is not None:
                        return payload

                    errors.append(f"{api_version}/{model}: could not parse JSON payload")
                    continue

                message = _error_message_from_response(response)
                errors.append(f"{api_version}/{model}: {response.status_code} {message}")

                if response.status_code in (429, 500, 503):
                    time.sleep(3)
                    try:
                        retry = requests.post(
                            url,
                            headers={"Content-Type": "application/json"},
                            json=request_body,
                            timeout=REQUEST_TIMEOUT_SECONDS,
                        )
                    except requests.RequestException as exc:
                        errors.append(f"{api_version}/{model} retry: request exception: {exc}")
                        continue

                    if retry.status_code == 200:
                        data = retry.json()
                        text_response = _extract_candidate_text(data)
                        if text_response:
                            payload = _extract_json_payload(text_response)
                            if payload is not None:
                                return payload
                    errors.append(
                        f"{api_version}/{model} retry: {retry.status_code} {_error_message_from_response(retry)}"
                    )

    if errors:
        print("Gemini API Error: all model/version attempts failed")
        for entry in errors[:4]:
            print(f"  - {entry}")
        if len(errors) > 4:
            print(f"  - ... and {len(errors) - 4} more failures")

        combined = " ".join(errors).lower()
        if (
            "api key not valid" in combined
            or "permission_denied" in combined
            or "service_disabled" in combined
        ):
            GEMINI_FATAL_ERROR = "Gemini authentication/service configuration error."
            print("Gemini is marked unavailable for the rest of this run due to configuration error.")

    return None


def _verify_claim_batch(item_title: str, claim_lines: List[str]) -> List[Dict[str, str]]:
    if not claim_lines:
        return []

    prompt = f"""
You are an expert Indian Community Medicine and Public Health editor.
Today is {TODAY_LABEL}.

TASK:
Verify the factual accuracy of the claim lines below for a medical learning app chapter titled "{item_title}".
Use grounded web search if available and prioritize official Indian government, programme portals, Gazette notifications, MoHFW, NTEP/Nikshay, NHM, ICMR, WHO, and UN sources.

RULES:
1. Return ONLY a JSON array.
2. Omit any line that is still accurate.
3. For each outdated or inaccurate line, return:
   {{
     "original": "exact original line from input",
     "replacement": "corrected line in the same concise style",
     "reason": "very short reason",
     "source": "one authoritative source name or URL"
   }}
4. Preserve exam-oriented wording and formatting style.
5. If unsure, do not guess. Omit that line.

Claim lines:
{json.dumps(claim_lines, ensure_ascii=False, indent=2)}
"""

    payload = _call_gemini_json(prompt, grounded=True)
    if payload is None:
        return []
    if isinstance(payload, dict):
        payload = payload.get("changes") or payload.get("updates") or []
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
        corrections.append(
            {
                "original": original,
                "replacement": replacement,
                "reason": reason,
                "source": source,
            }
        )
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

        leading_whitespace = matched_line[: len(matched_line) - len(matched_line.lstrip())]
        replacement_line = f"{leading_whitespace}{replacement}"
        updated_content = updated_content.replace(matched_line, replacement_line, 1)
        used_originals.add(original)
        applied.append(correction)

    return updated_content, applied


def _strip_recently_updated(items: List[Dict[str, Any]]) -> None:
    for item in items:
        if "recentlyUpdated" in item:
            del item["recentlyUpdated"]
        if "subsections" in item:
            _strip_recently_updated(item["subsections"])


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
        def verify_item_recursively(item: Dict[str, Any], index_str: str) -> None:
            nonlocal updates_made
            print(f"Verifying [{index_str}]: {item.get('title', 'Unknown')}")

            if "content" in item:
                original_content = item["content"]
                candidate_lines = _extract_claim_lines(original_content)
                if candidate_lines:
                    all_corrections: List[Dict[str, str]] = []
                    for batch_index, batch in enumerate(_batched(candidate_lines, VERIFY_MAX_CLAIMS_PER_BATCH)):
                        if batch_index >= VERIFY_MAX_BATCHES_PER_ITEM:
                            break
                        batch_corrections = _verify_claim_batch(item.get("title", "Unknown"), batch)
                        all_corrections.extend(batch_corrections)
                        time.sleep(1)

                    new_content, applied_corrections = _apply_corrections(original_content, all_corrections)
                    if new_content != original_content:
                        item["content"] = new_content
                        item["recentlyUpdated"] = True
                        updates_made += 1
                        print(f"  -> Applied {len(applied_corrections)} claim-level corrections.")
                        for correction in applied_corrections[:3]:
                            source_text = correction.get("source") or "authoritative source"
                            reason_text = correction.get("reason") or "claim updated"
                            print(f"     - {reason_text} [{source_text}]")
                else:
                    print("  -> No high-volatility claims detected; skipped to save cost.")

            if "subsections" in item:
                for sub_index, subsection in enumerate(item["subsections"]):
                    verify_item_recursively(subsection, f"{index_str}.{sub_index + 1}")

        for item in target_root_items:
            verify_item_recursively(item, str(item.get("id", "Unknown")))

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
    print("Starting claim-focused verification of mockData.json against current public-health guidance...")
    verify_and_update_all()
