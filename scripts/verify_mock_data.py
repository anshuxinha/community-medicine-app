import json
import os
import re
import time
import hashlib
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher, unified_diff
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import requests  # type: ignore
from bs4 import BeautifulSoup  # type: ignore

try:
    from google.auth.transport.requests import Request as GoogleAuthRequest  # type: ignore
    from google.oauth2 import service_account  # type: ignore
except ImportError:  # pragma: no cover - optional local dependency
    GoogleAuthRequest = None
    service_account = None


ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "src" / "data"
MOCK_DATA_PATH = DATA_DIR / "mockData.json"
UPDATES_PATH = DATA_DIR / "updates.json"
REVIEW_ROOT = ROOT_DIR / "dist" / "library_update_reviews"
GOOGLE_CLOUD_PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT", "community-med-app")
FIRESTORE_API_ROOT = (
    f"https://firestore.googleapis.com/v1/projects/{GOOGLE_CLOUD_PROJECT}"
    "/databases/(default)/documents"
)
REVIEW_QUEUE_COLLECTION = os.environ.get(
    "LIBRARY_REVIEW_QUEUE_COLLECTION", "libraryReviewSuggestions"
)


def load_env() -> None:
    env_path = ROOT_DIR / ".env"
    if not env_path.exists():
        return

    with env_path.open("r", encoding="utf-8") as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ[key.strip()] = value.strip()


load_env()

OLLAMA_API_KEY = os.environ.get("OLLAMA_API_KEY")
if not OLLAMA_API_KEY:
    raise ValueError("OLLAMA_API_KEY environment variable is not set")

OLLAMA_API_URL = os.environ.get("OLLAMA_API_URL", "https://ollama.com/api/chat")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "gemma4:31b-cloud")
REQUEST_TIMEOUT_SECONDS = int(os.environ.get("VERIFY_REQUEST_TIMEOUT_SECONDS", "120"))
MAX_RETRIES = int(os.environ.get("VERIFY_MAX_RETRIES", "2"))
RETRY_DELAY_SECONDS = int(os.environ.get("VERIFY_RETRY_DELAY_SECONDS", "5"))

LOOKBACK_DAYS = int(os.environ.get("VERIFY_LOOKBACK_DAYS", "7"))
MAX_SOURCE_UPDATES = int(os.environ.get("VERIFY_MAX_SOURCE_UPDATES", "6"))
MAX_CANDIDATES_PER_UPDATE = int(os.environ.get("VERIFY_MAX_CANDIDATES_PER_UPDATE", "6"))
MAX_ITEMS_TO_VERIFY = int(os.environ.get("VERIFY_MAX_ITEMS_TO_VERIFY", "12"))
MIN_CANDIDATE_SCORE = int(os.environ.get("VERIFY_MIN_CANDIDATE_SCORE", "2"))

VERIFY_MAX_CLAIMS_PER_ITEM = int(os.environ.get("VERIFY_MAX_CLAIMS_PER_ITEM", "18"))
VERIFY_MAX_CLAIMS_PER_BATCH = int(os.environ.get("VERIFY_MAX_CLAIMS_PER_BATCH", "6"))
VERIFY_MAX_BATCHES_PER_ITEM = int(os.environ.get("VERIFY_MAX_BATCHES_PER_ITEM", "3"))
MIN_SAFE_LINE_REPLACEMENT_SIMILARITY = float(
    os.environ.get("VERIFY_MIN_SAFE_REPLACEMENT_SIMILARITY", "0.72")
)

RAW_TARGET_ROOT_IDS = os.environ.get("VERIFY_TARGET_ROOT_IDS", "").strip()
VERIFY_TARGET_ROOT_IDS = {
    item.strip() for item in RAW_TARGET_ROOT_IDS.split(",") if item.strip()
}

HTTP_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36"
    )
}

TODAY = datetime.now().astimezone()
TODAY_LABEL = TODAY.date().isoformat()
WINDOW_START = (TODAY - timedelta(days=max(LOOKBACK_DAYS - 1, 0))).date()

STOPWORDS = {
    "about",
    "after",
    "again",
    "against",
    "being",
    "between",
    "chapter",
    "community",
    "content",
    "current",
    "disease",
    "during",
    "exact",
    "family",
    "from",
    "government",
    "health",
    "india",
    "indian",
    "information",
    "library",
    "medical",
    "medicine",
    "national",
    "programme",
    "program",
    "public",
    "release",
    "releases",
    "scheme",
    "their",
    "there",
    "these",
    "this",
    "under",
    "update",
    "updates",
    "using",
    "week",
    "with",
}

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
    "polio",
    "sanitation",
    "water",
)

UPDATE_SENSITIVE_TOKEN_RE = re.compile(
    r"""
    (?:₹\s*\d[\d,]*(?:\.\d+)?)
    |(?:\b(?:rs\.?|inr)\s*\d[\d,]*(?:\.\d+)?)
    |(?:\b(?:<=|>=|<|>)?\s*\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s*
        (?:%|percent|mg|g|kg|mcg|ml|l|days?|weeks?|months?|years?|hrs?|hours?|minutes?|lakhs?|crores?|million|billion|beds?|lpcd)\b)
    |(?:\b\d+(?:\.\d+)?/\d+(?:,\d{3})*(?:\.\d+)?\b)
    |(?:\b\d+(?:\.\d+)?[A-Za-z]{1,6}\b)
    |(?:\b[A-Za-z]+\d+[A-Za-z]*\b)
    |(?:\b(?:<=|>=|<|>)?\s*\d[\d,]*(?:\.\d+)?\b)
    """,
    re.IGNORECASE | re.VERBOSE,
)


def _normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _extract_candidate_text(payload: Dict[str, Any]) -> Optional[str]:
    message = payload.get("message", {})
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


def call_ollama(prompt: str) -> Optional[Any]:
    last_error = None

    for attempt in range(1 + MAX_RETRIES):
        try:
            response = requests.post(
                OLLAMA_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {OLLAMA_API_KEY}",
                },
                json={
                    "model": OLLAMA_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                    "options": {"temperature": 0.1},
                },
                timeout=REQUEST_TIMEOUT_SECONDS,
            )

            if response.status_code == 200:
                data = response.json()
                text_response = _extract_candidate_text(data)
                if text_response:
                    payload = _extract_json_payload(text_response)
                    if payload is not None:
                        return payload
                last_error = "empty or unparseable response body"
            elif response.status_code in (429, 500, 503):
                last_error = f"HTTP {response.status_code}: {response.text[:200]}"
                print(f"Ollama retryable error (attempt {attempt + 1}): {last_error}")
            else:
                print(
                    f"Ollama API Error {response.status_code}: "
                    f"{_error_message_from_response(response)[:300]}"
                )
                return None
        except (requests.RequestException, ValueError, json.JSONDecodeError) as exc:
            last_error = str(exc)
            print(f"Ollama request exception (attempt {attempt + 1}): {last_error}")

        if attempt < MAX_RETRIES:
            time.sleep(RETRY_DELAY_SECONDS)

    print(f"Ollama API failed after retries. Last error: {last_error}")
    return None


def _line_shape_without_sensitive_tokens(value: str) -> str:
    collapsed = UPDATE_SENSITIVE_TOKEN_RE.sub("<VALUE>", value)
    return _normalize_whitespace(collapsed).lower()


def _minimal_sensitive_token_update(original_line: str, replacement_line: str) -> Optional[str]:
    original_matches = list(UPDATE_SENSITIVE_TOKEN_RE.finditer(original_line))
    replacement_matches = list(UPDATE_SENSITIVE_TOKEN_RE.finditer(replacement_line))
    if not original_matches or len(original_matches) != len(replacement_matches):
        return None

    if _line_shape_without_sensitive_tokens(original_line) != _line_shape_without_sensitive_tokens(
        replacement_line
    ):
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
    if re.search(r"\b(rs\.?|inr)\b", lowered) or "₹" in lowered:
        score += 4
    if re.search(r"\b\d{4}\b", lowered):
        score += 2
    if re.search(r"\b\d+(\.\d+)?\s*(%|percent|mg|ml|days?|weeks?|months?|years?|lpcd)\b", lowered):
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

    ranked = sorted(seen.values(), key=lambda item: (-item["score"], len(item["line"])))
    return [item["line"] for item in ranked[:VERIFY_MAX_CLAIMS_PER_ITEM]]


def _batched(items: List[str], batch_size: int) -> Iterable[List[str]]:
    for index in range(0, len(items), batch_size):
        yield items[index:index + batch_size]


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2, ensure_ascii=False)


def _load_service_account_info() -> Optional[Dict[str, Any]]:
    raw_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if raw_json:
        try:
            return json.loads(raw_json)
        except json.JSONDecodeError as exc:
            print(f"FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON: {exc}")
            return None

    credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if credentials_path and os.path.exists(credentials_path):
        try:
            with open(credentials_path, "r", encoding="utf-8") as file:
                return json.load(file)
        except Exception as exc:
            print(f"Could not read GOOGLE_APPLICATION_CREDENTIALS file: {exc}")
            return None

    local_path = ROOT_DIR / "serviceAccountKey.json"
    if local_path.exists():
        try:
            return json.loads(local_path.read_text(encoding="utf-8"))
        except Exception as exc:
            print(f"Could not read local serviceAccountKey.json: {exc}")
            return None

    return None


def _get_firestore_access_token() -> Optional[str]:
    if GoogleAuthRequest is None or service_account is None:
        print("google-auth is not installed; skipping Firestore review queue sync.")
        return None

    service_account_info = _load_service_account_info()
    if not service_account_info:
        print("No Firebase service account credentials found; skipping Firestore review queue sync.")
        return None

    try:
        credentials = service_account.Credentials.from_service_account_info(
            service_account_info,
            scopes=["https://www.googleapis.com/auth/datastore"],
        )
        credentials.refresh(GoogleAuthRequest())
        return credentials.token
    except Exception as exc:
        print(f"Failed to mint Firestore access token: {exc}")
        return None


def _to_firestore_value(value: Any) -> Dict[str, Any]:
    if value is None:
        return {"nullValue": None}
    if isinstance(value, bool):
        return {"booleanValue": value}
    if isinstance(value, int) and not isinstance(value, bool):
        return {"integerValue": str(value)}
    if isinstance(value, float):
        return {"doubleValue": value}
    if isinstance(value, str):
        return {"stringValue": value}
    if isinstance(value, list):
        return {"arrayValue": {"values": [_to_firestore_value(item) for item in value]}}
    if isinstance(value, dict):
        return {
            "mapValue": {
                "fields": {
                    key: _to_firestore_value(item)
                    for key, item in value.items()
                }
            }
        }
    return {"stringValue": json.dumps(value, ensure_ascii=False)}


def _from_firestore_value(value: Dict[str, Any]) -> Any:
    if "stringValue" in value:
        return value["stringValue"]
    if "integerValue" in value:
        try:
            return int(value["integerValue"])
        except (TypeError, ValueError):
            return value["integerValue"]
    if "doubleValue" in value:
        return value["doubleValue"]
    if "booleanValue" in value:
        return value["booleanValue"]
    if "nullValue" in value:
        return None
    if "arrayValue" in value:
        values = value.get("arrayValue", {}).get("values", [])
        return [_from_firestore_value(item) for item in values]
    if "mapValue" in value:
        fields = value.get("mapValue", {}).get("fields", {})
        return {key: _from_firestore_value(item) for key, item in fields.items()}
    return None


def _document_url(collection_name: str, document_id: str) -> str:
    return f"{FIRESTORE_API_ROOT}/{collection_name}/{document_id}"


def _fetch_firestore_document(
    access_token: str,
    collection_name: str,
    document_id: str,
) -> Optional[Dict[str, Any]]:
    response = requests.get(
        _document_url(collection_name, document_id),
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=20,
    )
    if response.status_code == 404:
        return None
    if response.status_code != 200:
        print(
            f"Failed to fetch Firestore document {collection_name}/{document_id} "
            f"({response.status_code}): {response.text[:200]}"
        )
        return None

    payload = response.json()
    fields = payload.get("fields", {})
    return {key: _from_firestore_value(value) for key, value in fields.items()}


def _write_firestore_document(
    access_token: str,
    collection_name: str,
    document_id: str,
    payload: Dict[str, Any],
) -> bool:
    response = requests.patch(
        _document_url(collection_name, document_id),
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json={"fields": {key: _to_firestore_value(value) for key, value in payload.items()}},
        timeout=30,
    )

    if response.status_code not in (200, 201):
        print(
            f"Failed to write Firestore document {collection_name}/{document_id} "
            f"({response.status_code}): {response.text[:200]}"
        )
        return False

    return True


def sync_review_bundle_to_firestore(review_bundle: Dict[str, Any]) -> None:
    access_token = _get_firestore_access_token()
    if not access_token:
        return

    proposals = review_bundle.get("proposals", [])
    synced = 0

    for proposal in proposals:
        proposal_id = str(proposal.get("proposalId", "")).strip()
        if not proposal_id:
            continue

        existing = _fetch_firestore_document(
            access_token,
            REVIEW_QUEUE_COLLECTION,
            proposal_id,
        ) or {}

        payload = {
            "proposalId": proposal_id,
            "status": existing.get("status", proposal.get("status", "pending")),
            "libraryId": str(proposal.get("libraryId", "")),
            "libraryTitle": proposal.get("libraryTitle", ""),
            "rootChapterId": str(proposal.get("rootChapterId", "")),
            "rootChapterTitle": proposal.get("rootChapterTitle", ""),
            "aggregateRelevanceScore": int(proposal.get("aggregateRelevanceScore", 0)),
            "summaryReason": existing.get(
                "summaryReason",
                proposal.get("summaryReason", ""),
            ),
            "sourceUpdates": proposal.get("sourceUpdates", []),
            "changes": proposal.get("changes", []),
            "originalContent": proposal.get("originalContent", ""),
            "proposedContent": existing.get(
                "proposedContent",
                proposal.get("proposedContent", ""),
            ),
            "updatedSegments": proposal.get("updatedSegments", []),
            "diff": proposal.get("diff", ""),
            "generatedAt": review_bundle.get("generatedAt", ""),
            "windowStart": review_bundle.get("windowStart", ""),
            "windowEnd": review_bundle.get("windowEnd", ""),
            "model": review_bundle.get("model", ""),
            "sourceUpdateCount": int(review_bundle.get("sourceUpdateCount", 0)),
            "sourceReviewWindow": (
                f"{review_bundle.get('windowStart', '')} to "
                f"{review_bundle.get('windowEnd', '')}"
            ).strip(),
            "approvedAt": existing.get("approvedAt"),
            "approvedBy": existing.get("approvedBy"),
            "lastEditedAt": existing.get("lastEditedAt"),
            "editedBy": existing.get("editedBy"),
        }

        if _write_firestore_document(
            access_token,
            REVIEW_QUEUE_COLLECTION,
            proposal_id,
            payload,
        ):
            synced += 1

    meta_payload = {
        "generatedAt": review_bundle.get("generatedAt", ""),
        "windowStart": review_bundle.get("windowStart", ""),
        "windowEnd": review_bundle.get("windowEnd", ""),
        "model": review_bundle.get("model", ""),
        "sourceUpdateCount": int(review_bundle.get("sourceUpdateCount", 0)),
        "proposalCount": int(review_bundle.get("proposalCount", 0)),
    }
    _write_firestore_document(access_token, "libraryReviewMeta", "latest", meta_payload)
    print(f"Synced {synced} review proposal(s) to Firestore collection {REVIEW_QUEUE_COLLECTION}.")


def flatten_leaf_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    flattened: List[Dict[str, Any]] = []

    def walk(item: Dict[str, Any], root_item: Dict[str, Any]) -> None:
        if VERIFY_TARGET_ROOT_IDS and str(root_item.get("id")) not in VERIFY_TARGET_ROOT_IDS:
            return

        subsections = item.get("subsections") or []
        if subsections:
            for subsection in subsections:
                walk(subsection, root_item)
            return

        content = str(item.get("content", "")).strip()
        if not content:
            return

        flattened.append(
            {
                "id": str(item.get("id", "")),
                "title": str(item.get("title", "")),
                "content": content,
                "rootId": str(root_item.get("id", "")),
                "rootTitle": str(root_item.get("title", "")),
                "searchBlob": _normalize_whitespace(
                    f"{item.get('title', '')} {root_item.get('title', '')} {content[:12000]}"
                ).lower(),
            }
        )

    for root in items:
        walk(root, root)

    return flattened


def parse_update_date(value: str) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def load_recent_updates() -> List[Dict[str, Any]]:
    if not UPDATES_PATH.exists():
        return []

    data = load_json(UPDATES_PATH)
    if not isinstance(data, list):
        return []

    recent: List[Dict[str, Any]] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        update_date = parse_update_date(str(item.get("date", "")))
        if update_date is None:
            continue
        if update_date.date() < WINDOW_START:
            continue
        recent.append(
            {
                "id": str(item.get("id", "")),
                "date": update_date.date().isoformat(),
                "title": str(item.get("title", "")).strip(),
                "summary": str(item.get("summary", "")).strip(),
                "link": str(item.get("link", "")).strip(),
            }
        )

    recent.sort(key=lambda item: item.get("date", ""), reverse=True)
    return recent[:MAX_SOURCE_UPDATES]


def fetch_article_text(update: Dict[str, Any]) -> str:
    link = update.get("link", "")
    if not link:
        return update.get("summary", "")

    try:
        response = requests.get(link, headers=HTTP_HEADERS, timeout=20)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        raw_text = " ".join(soup.get_text(separator=" ", strip=True).split())
        return raw_text[:12000]
    except requests.RequestException as exc:
        print(f"Failed to fetch source article {link}: {exc}")
        return update.get("summary", "")


def enrich_updates_with_source_text(updates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    enriched: List[Dict[str, Any]] = []
    for update in updates:
        source_text = fetch_article_text(update)
        if not source_text:
            continue
        enriched.append({**update, "sourceText": source_text})
    return enriched


def extract_keywords(*chunks: str) -> List[str]:
    keyword_scores: Dict[str, int] = {}

    for chunk in chunks:
        text = chunk.lower()
        for phrase in VOLATILE_KEYWORDS:
            if phrase in text:
                keyword_scores[phrase] = keyword_scores.get(phrase, 0) + 4

        for token in re.findall(r"[a-z][a-z0-9\-]{2,}", text):
            if token in STOPWORDS:
                continue
            score = 1
            if token in {"tb", "hiv", "iphs", "icmr", "nhm", "nacp", "nlep", "ntep", "uip"}:
                score = 4
            elif len(token) >= 8:
                score = 2
            keyword_scores[token] = keyword_scores.get(token, 0) + score

    ranked = sorted(keyword_scores.items(), key=lambda item: (-item[1], item[0]))
    return [keyword for keyword, _ in ranked[:24]]


def score_item_for_update(update: Dict[str, Any], item: Dict[str, Any]) -> int:
    title_blob = _normalize_whitespace(
        f"{item.get('title', '')} {item.get('rootTitle', '')}"
    ).lower()
    content_blob = item.get("searchBlob", "")
    update_keywords = extract_keywords(
        update.get("title", ""),
        update.get("summary", ""),
        update.get("sourceText", "")[:4000],
    )

    score = 0
    for keyword in update_keywords:
        if keyword in title_blob:
            score += 5
        elif keyword in content_blob:
            score += 1

    update_title = update.get("title", "").lower()
    if update_title and update_title in title_blob:
        score += 8

    return score


def build_candidate_map(
    leaf_items: List[Dict[str, Any]], updates: List[Dict[str, Any]]
) -> List[Tuple[Dict[str, Any], List[Dict[str, Any]], int]]:
    aggregate: Dict[str, Dict[str, Any]] = {}

    for update in updates:
        scored_items: List[Tuple[int, Dict[str, Any]]] = []
        for item in leaf_items:
            score = score_item_for_update(update, item)
            if score >= MIN_CANDIDATE_SCORE:
                scored_items.append((score, item))

        scored_items.sort(key=lambda entry: (-entry[0], entry[1]["id"]))
        for score, item in scored_items[:MAX_CANDIDATES_PER_UPDATE]:
            bucket = aggregate.setdefault(
                item["id"],
                {"item": item, "updates": [], "score": 0},
            )
            bucket["updates"].append(
                {
                    "score": score,
                    "id": update["id"],
                    "date": update["date"],
                    "title": update["title"],
                    "summary": update["summary"],
                    "link": update["link"],
                    "sourceText": update["sourceText"],
                }
            )
            bucket["score"] += score

    ranked = sorted(
        aggregate.values(),
        key=lambda entry: (-entry["score"], entry["item"]["id"]),
    )
    return [
        (entry["item"], entry["updates"], entry["score"])
        for entry in ranked[:MAX_ITEMS_TO_VERIFY]
    ]


def build_source_context(relevant_updates: List[Dict[str, Any]]) -> str:
    blocks = []
    for update in relevant_updates:
        blocks.append(
            "\n".join(
                [
                    f"TITLE: {update.get('title', '')}",
                    f"DATE: {update.get('date', '')}",
                    f"LINK: {update.get('link', '')}",
                    f"SUMMARY: {update.get('summary', '')}",
                    f"FULL_TEXT_EXCERPT: {update.get('sourceText', '')[:5000]}",
                ]
            )
        )
    return "\n\n---\n\n".join(blocks)


def verify_claim_batch(
    item_title: str,
    item_id: str,
    claim_lines: List[str],
    source_context: str,
) -> List[Dict[str, str]]:
    prompt = f"""
You are an expert Indian Community Medicine textbook editor.
Today is {TODAY_LABEL}.

TASK:
Verify whether any of the following existing textbook/library lines for "{item_title}" (Library ID: {item_id})
should be updated using THIS WEEK'S PIB-derived public-health evidence.

SOURCE EVIDENCE:
{source_context}

RULES:
1. Return ONLY a JSON array of objects.
2. Omit lines that remain accurate enough for an exam-oriented textbook.
3. Only propose a change if the source clearly indicates an official update that should be incorporated into a Community Medicine reference.
4. Ignore ceremonial statements, generic speeches, political praise, and projections that are not formal policy/programme/guideline changes.
5. For each accepted change, return:
   {{
     "original": "exact original line from input",
     "replacement": "corrected line in the same concise style",
     "reason": "very short reason mentioning what changed",
     "quote_from_source": "short exact quote proving the change",
     "confidence": 100,
     "source_title": "title of PIB update",
     "source_link": "PIB URL",
     "source_date": "YYYY-MM-DD"
   }}
6. Preserve the chapter's wording style. Keep replacements tight and factual.
7. Do NOT invent new bullets or paragraphs. Anchor every change to an existing line.
8. Prefer minimal token-level corrections for years, targets, benefits, criteria, programme names, schedules, or official deadlines.
9. If unsure, do not guess.
10. Only output changes with confidence 95 or higher.

Claim lines to verify:
{json.dumps(claim_lines, ensure_ascii=False, indent=2)}
"""

    payload = call_ollama(prompt)
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
        quote = str(item.get("quote_from_source", "")).strip()
        if not original or not replacement or not quote:
            continue

        try:
            confidence = int(item.get("confidence", 0))
        except (TypeError, ValueError):
            confidence = 0

        if confidence < 95:
            continue

        corrections.append(
            {
                "original": original,
                "replacement": replacement,
                "reason": str(item.get("reason", "")).strip(),
                "quote_from_source": quote,
                "confidence": str(confidence),
                "source_title": str(item.get("source_title", "")).strip(),
                "source_link": str(item.get("source_link", "")).strip(),
                "source_date": str(item.get("source_date", "")).strip(),
            }
        )

    return corrections


def apply_corrections(
    text_content: str, corrections: List[Dict[str, str]]
) -> Tuple[str, List[Dict[str, str]]]:
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
        applied.append(
            {
                **correction,
                "matched_line": matched_line.strip(),
                "replacement_line": replacement_line.strip(),
            }
        )

    return updated_content, applied


def build_unified_diff(original: str, proposed: str) -> str:
    diff_lines = unified_diff(
        original.splitlines(),
        proposed.splitlines(),
        fromfile="original",
        tofile="proposed",
        lineterm="",
    )
    return "\n".join(diff_lines)


def make_proposal_id(item_id: str, proposed_text: str) -> str:
    digest = hashlib.sha1(f"{item_id}\n{proposed_text}".encode("utf-8")).hexdigest()[:10]
    return f"{TODAY.date().isoformat()}-{item_id}-{digest}"


def build_review_markdown(review_bundle: Dict[str, Any]) -> str:
    lines = [
        "# Library Update Review",
        "",
        f"- Generated at: {review_bundle.get('generatedAt', '')}",
        f"- Window: {review_bundle.get('windowStart', '')} to {review_bundle.get('windowEnd', '')}",
        f"- Source updates reviewed: {review_bundle.get('sourceUpdateCount', 0)}",
        f"- Proposed library changes: {review_bundle.get('proposalCount', 0)}",
        "",
    ]

    proposals = review_bundle.get("proposals", [])
    if not proposals:
        lines.extend(
            [
                "## No staged Library changes this run",
                "",
                "No PIB-derived updates met the threshold for a textbook or Library content revision this week.",
                "",
            ]
        )
        return "\n".join(lines)

    for proposal in proposals:
        lines.extend(
            [
                f"## {proposal.get('libraryTitle', 'Untitled')} ({proposal.get('libraryId', '')})",
                "",
                f"- Proposal ID: `{proposal.get('proposalId', '')}`",
                f"- Root chapter: `{proposal.get('rootChapterId', '')}` {proposal.get('rootChapterTitle', '')}",
                f"- Status: `{proposal.get('status', '')}`",
                f"- Reason: {proposal.get('summaryReason', '')}",
                "",
                "### Exact lines to update",
                "",
            ]
        )

        for change in proposal.get("changes", []):
            lines.extend(
                [
                    f"- Source: [{change.get('source_title', 'PIB update')}]({change.get('source_link', '')})",
                    f"  Date: {change.get('source_date', '')}",
                    f"  Reason: {change.get('reason', '')}",
                    f"  Original: `{change.get('matched_line', '')}`",
                    f"  Replacement: `{change.get('replacement_line', '')}`",
                    f"  Proof quote: `{change.get('quote_from_source', '')}`",
                    "",
                ]
            )

    return "\n".join(lines)


def generate_review_bundle() -> Dict[str, Any]:
    if not MOCK_DATA_PATH.exists():
        raise FileNotFoundError(f"Could not find {MOCK_DATA_PATH}")

    library_data = load_json(MOCK_DATA_PATH)
    if not isinstance(library_data, list):
        raise ValueError("mockData.json must be a JSON array")

    recent_updates = load_recent_updates()
    enriched_updates = enrich_updates_with_source_text(recent_updates)
    leaf_items = flatten_leaf_items(library_data)
    candidate_map = build_candidate_map(leaf_items, enriched_updates)

    proposals: List[Dict[str, Any]] = []

    for item, relevant_updates, aggregate_score in candidate_map:
        source_context = build_source_context(relevant_updates)
        claim_lines = _extract_claim_lines(item["content"])
        if not claim_lines:
            continue

        print(
            f"Reviewing Library ID {item['id']} ({item['title']}) "
            f"against {len(relevant_updates)} recent update(s)..."
        )

        all_corrections: List[Dict[str, str]] = []
        for batch_index, batch in enumerate(_batched(claim_lines, VERIFY_MAX_CLAIMS_PER_BATCH)):
            if batch_index >= VERIFY_MAX_BATCHES_PER_ITEM:
                break
            batch_corrections = verify_claim_batch(
                item["title"],
                item["id"],
                batch,
                source_context,
            )
            all_corrections.extend(batch_corrections)
            time.sleep(1)

        proposed_content, applied_corrections = apply_corrections(item["content"], all_corrections)
        if proposed_content == item["content"] or not applied_corrections:
            continue

        proposal_id = make_proposal_id(item["id"], proposed_content)
        summary_reason = "; ".join(
            list(
                dict.fromkeys(
                    change.get("reason", "").strip()
                    for change in applied_corrections
                    if change.get("reason")
                )
            )
        )
        if not summary_reason:
            summary_reason = "PIB-backed factual update identified"

        proposals.append(
            {
                "proposalId": proposal_id,
                "status": "pending",
                "libraryId": item["id"],
                "libraryTitle": item["title"],
                "rootChapterId": item["rootId"],
                "rootChapterTitle": item["rootTitle"],
                "aggregateRelevanceScore": aggregate_score,
                "summaryReason": summary_reason,
                "sourceUpdates": [
                    {
                        "id": update["id"],
                        "date": update["date"],
                        "title": update["title"],
                        "link": update["link"],
                    }
                    for update in relevant_updates
                ],
                "changes": applied_corrections,
                "originalContent": item["content"],
                "proposedContent": proposed_content,
                "updatedSegments": list(
                    dict.fromkeys(
                        change.get("replacement_line", "").strip()
                        for change in applied_corrections
                        if change.get("replacement_line", "").strip()
                    )
                ),
                "diff": build_unified_diff(item["content"], proposed_content),
            }
        )

    proposals.sort(key=lambda proposal: proposal.get("libraryId", ""))

    return {
        "generatedAt": TODAY.isoformat(),
        "windowStart": WINDOW_START.isoformat(),
        "windowEnd": TODAY.date().isoformat(),
        "model": OLLAMA_MODEL,
        "sourceUpdateCount": len(enriched_updates),
        "proposalCount": len(proposals),
        "sourceUpdatesReviewed": [
            {
                "id": update["id"],
                "date": update["date"],
                "title": update["title"],
                "link": update["link"],
            }
            for update in enriched_updates
        ],
        "proposals": proposals,
    }


def write_review_bundle(review_bundle: Dict[str, Any]) -> Tuple[Path, Path]:
    week_folder = REVIEW_ROOT / TODAY.date().isoformat()
    json_path = week_folder / "pending_changes.json"
    md_path = week_folder / "pending_changes.md"
    latest_json_path = REVIEW_ROOT / "latest.json"
    latest_md_path = REVIEW_ROOT / "latest.md"

    save_json(json_path, review_bundle)
    md_path.write_text(build_review_markdown(review_bundle), encoding="utf-8")
    save_json(latest_json_path, review_bundle)
    latest_md_path.write_text(build_review_markdown(review_bundle), encoding="utf-8")

    return json_path, md_path


def main() -> None:
    print("Starting weekly Library verification review...")
    print(f"Using Ollama model: {OLLAMA_MODEL}")
    print(f"Review window: {WINDOW_START.isoformat()} to {TODAY.date().isoformat()}")
    if VERIFY_TARGET_ROOT_IDS:
        print(f"Scoped root chapters: {', '.join(sorted(VERIFY_TARGET_ROOT_IDS))}")
    else:
        print("Scoped root chapters: auto-discovered across the full Library")

    review_bundle = generate_review_bundle()
    json_path, md_path = write_review_bundle(review_bundle)
    sync_review_bundle_to_firestore(review_bundle)

    print(f"\nReview complete. Source updates checked: {review_bundle['sourceUpdateCount']}")
    print(f"Staged Library proposals: {review_bundle['proposalCount']}")
    print(f"Review JSON: {json_path}")
    print(f"Review Markdown: {md_path}")


if __name__ == "__main__":
    main()
