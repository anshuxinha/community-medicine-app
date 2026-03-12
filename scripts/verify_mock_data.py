import json
import os
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests  # type: ignore

GOOGLE_GEMINI_KEY = os.environ.get("GOOGLE_GEMINI_KEY")
if not GOOGLE_GEMINI_KEY:
    raise ValueError("GOOGLE_GEMINI_KEY environment variable is not set")

MODEL_CANDIDATES = [
    model.strip()
    for model in os.environ.get(
        "GEMINI_MODELS",
        "gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash",
    ).split(",")
    if model.strip()
]
API_VERSIONS = ["v1beta", "v1"]
REQUEST_TIMEOUT_SECONDS = int(os.environ.get("GEMINI_TIMEOUT_SECONDS", "60"))

MOCK_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "data", "mockData.json")
PRACTICAL_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "data", "practical.json")
UPDATES_FEED_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "data", "updates.json")
VERIFY_TARGET_ROOT_IDS = {
    item.strip()
    for item in os.environ.get("VERIFY_TARGET_ROOT_IDS", "7,8").split(",")
    if item.strip()
}

GEMINI_FATAL_ERROR: Optional[str] = None


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


def call_gemini_to_verify(text_content: str) -> str:
    """
    Ask Gemini to verify and correct medical facts. If all Gemini calls fail,
    return the original text unchanged.
    """
    global GEMINI_FATAL_ERROR
    if GEMINI_FATAL_ERROR:
        return text_content

    prompt = f"""
You are an expert Indian Community Medicine and Public Health Editor.
I will provide you with a section of educational text from a medical app.

YOUR JOB:
Verify if the medical facts, national health program guidelines, financial incentives (like Nikshay Poshan Yojana amounts), and WHO definitions are completely up-to-date as of 2026.

RULES:
1. If the information is outdated or factually incorrect, CORRECT IT in the text.
2. DO NOT change the structure, headings, mnemonics, or tone unless strictly necessary for factual accuracy.
3. Keep the same formatting (newlines and ALL CAPS headings).
4. Return ONLY the corrected full text. No markdown, no explanations.

Text to verify:
{text_content}
"""
    request_body: Dict[str, Any] = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
        },
    }

    errors: List[str] = []

    for api_version in API_VERSIONS:
        for model in MODEL_CANDIDATES:
            url = _build_gemini_url(model, api_version)
            try:
                response = requests.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json=request_body,
                    timeout=REQUEST_TIMEOUT_SECONDS,
                )

                if response.status_code == 200:
                    data = response.json()
                    text_response = _extract_candidate_text(data)
                    if not text_response:
                        errors.append(f"{api_version}/{model}: empty candidate response")
                        continue
                    if text_response.startswith("```"):
                        text_response = "\n".join(text_response.split("\n")[1:-1])
                    return text_response.strip()

                message = _error_message_from_response(response)
                errors.append(f"{api_version}/{model}: {response.status_code} {message}")

                # Retry transient server/rate-limit issues with the same model once.
                if response.status_code in (429, 500, 503):
                    time.sleep(3)
                    retry = requests.post(
                        url,
                        headers={"Content-Type": "application/json"},
                        json=request_body,
                        timeout=REQUEST_TIMEOUT_SECONDS,
                    )
                    if retry.status_code == 200:
                        data = retry.json()
                        text_response = _extract_candidate_text(data)
                        if text_response:
                            if text_response.startswith("```"):
                                text_response = "\n".join(text_response.split("\n")[1:-1])
                            return text_response.strip()
                    errors.append(
                        f"{api_version}/{model} retry: {retry.status_code} {_error_message_from_response(retry)}"
                    )

            except requests.RequestException as exc:
                errors.append(f"{api_version}/{model}: request exception: {exc}")

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

    return text_content


def process_file_verification(file_path: str) -> None:
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            data: List[Dict[str, Any]] = json.load(file)

        filename = os.path.basename(file_path)
        if filename != "mockData.json":
            print(f"\n--- Skipping {filename}: only mockData IDs {sorted(VERIFY_TARGET_ROOT_IDS)} are verified in this workflow ---")
            return

        print(f"\n--- Verifying {filename} ({len(data)} chapters) ---")

        target_root_items = [item for item in data if str(item.get("id")) in VERIFY_TARGET_ROOT_IDS]
        if not target_root_items:
            print(f"No matching target IDs found in {filename}.")
            return

        print(
            "Target scope: "
            + ", ".join(f"{item.get('id')}: {item.get('title', 'Unknown')}" for item in target_root_items)
        )

        def strip_recently_updated(items: List[Dict[str, Any]]) -> None:
            for item in items:
                if "recentlyUpdated" in item:
                    del item["recentlyUpdated"]
                if "subsections" in item:
                    strip_recently_updated(item["subsections"])

        strip_recently_updated(target_root_items)

        updates_made = 0
        updated_titles: List[str] = []

        def verify_item_recursively(item: Dict[str, Any], index_str: str) -> None:
            nonlocal updates_made
            print(f"Verifying [{index_str}]: {item.get('title', 'Unknown')}")

            if "content" in item:
                original_content = item["content"]
                new_content = call_gemini_to_verify(original_content)
                if new_content and new_content != original_content and len(new_content) > 100:
                    item["content"] = new_content
                    item["recentlyUpdated"] = True
                    updates_made += 1
                    updated_titles.append(item.get("title", "Unknown"))
                    print(f"  -> Updates found and applied to {item.get('title', 'Unknown')}.")

                # Small delay per call to reduce API rate limiting.
                time.sleep(1)

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
            append_dashboard_update_entry(sorted(set(updated_titles)))
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
    process_file_verification(PRACTICAL_DATA_PATH)


def append_dashboard_update_entry(updated_titles: List[str]) -> None:
    try:
        if not updated_titles:
            return

        title_count = len(updated_titles)
        preview = ", ".join(updated_titles[:6])
        extra = title_count - min(title_count, 6)
        if extra > 0:
            preview = f"{preview}, +{extra} more"

        update_item = {
            "id": str(uuid.uuid4()),
            "date": datetime.utcnow().strftime("%Y-%m-%d"),
            "title": "Weekly Academic Update: Health Programmes and Family Planning",
            "summary": (
                f"{title_count} section(s) were revised under Chapter 7 (Health Programmes in India) "
                f"and Chapter 8 (Demography and Family Planning). Key revised topics: {preview}. "
                "This update is intended for MD Community Medicine learners for rapid revision of policy- and programme-linked content."
            ),
            "source": "Automated weekly verification pipeline using current public-health guidance available at verification time.",
            "category": "Academic Content Update",
            "updatedItems": updated_titles,
        }

        existing_updates: List[Dict[str, Any]] = []
        if os.path.exists(UPDATES_FEED_PATH):
            with open(UPDATES_FEED_PATH, "r", encoding="utf-8") as file:
                existing_updates = json.load(file)

        existing_updates = [u for u in existing_updates if u.get("title") != update_item["title"]]
        existing_updates.insert(0, update_item)

        with open(UPDATES_FEED_PATH, "w", encoding="utf-8") as file:
            json.dump(existing_updates, file, indent=4, ensure_ascii=False)

        print(f"Dashboard updates feed refreshed at {UPDATES_FEED_PATH}.")
    except Exception as exc:
        print(f"Failed to append dashboard update entry: {exc}")


if __name__ == "__main__":
    print("Starting automated verification of data files against current medical guidelines...")
    verify_and_update_all()
