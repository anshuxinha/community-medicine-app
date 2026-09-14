"""Smoke-test the daily auto-update Ollama path. No Firestore, no push, no file writes."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

if "OLLAMA_FALLBACK_MODELS" not in os.environ:
    os.environ["OLLAMA_FALLBACK_MODELS"] = ""

import requests  # noqa: E402
from bs4 import BeautifulSoup  # noqa: E402

import fetch_updates as fu  # noqa: E402


SMOKE_PROMPT = """
You are an expert in Community Medicine in India.
Select titles relevant to Community Medicine.

INCLUSION: national health programmes, immunization, maternal health.
EXCLUSION: ceremonial visits, defence, telecom.

Return ONLY a JSON array of objects containing the "id" of selected items.
Example: [{"id": 0}]
If none match, return [].

List:
[
  {"id": 0, "title": "MoHFW revises Universal Immunization Programme schedule"},
  {"id": 1, "title": "Defence ministry visits shipyard for keel laying"}
]
""".strip()


def _fail(message: str) -> int:
    print(f"SMOKE FAIL: {message}")
    return 1


def smoke_pib_listing() -> int:
    print("PIB listing GET...")
    session = requests.Session()
    soup = None
    last_error = None
    for url in fu.PIB_LISTING_URLS:
        try:
            response = session.get(url, headers=fu.PIB_HEADERS, timeout=fu.PIB_GET_TIMEOUT)
            print(f"  {url} -> HTTP {response.status_code}")
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            last_error = None
            break
        except requests.RequestException as exc:
            last_error = exc
            print(f"  {url} failed: {exc}")
    if soup is None:
        return _fail(f"PIB listing GET failed: {last_error}")
    items = fu.extract_mohfw_feed_items(soup)
    print(f"  MoHFW items parsed: {len(items)}")
    for item in items[:5]:
        print(f"    - {item.get('title')}")
    return 0


def smoke_gemma4_thinking() -> int:
    if not fu.OLLAMA_API_KEY:
        return _fail("OLLAMA_API_KEY is not set")

    model = fu.OLLAMA_MODEL
    if not fu._is_gemma4(model):
        return _fail(f"expected a Gemma 4 model, got {model}")
    if fu._ollama_models_to_try() != [model]:
        return _fail(f"smoke must not use fallbacks: {fu._ollama_models_to_try()}")

    think = fu._think_param_for_model(model)
    print(f"Ollama chat: model={model} think={think!r}")
    try:
        response = requests.post(
            fu.OLLAMA_API_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {fu.OLLAMA_API_KEY}",
            },
            json={
                "model": model,
                "messages": fu._chat_messages(model, SMOKE_PROMPT),
                "stream": False,
                "think": think,
                "options": {"temperature": 0.1},
            },
            timeout=180,
        )
    except requests.RequestException as exc:
        return _fail(f"Ollama request exception: {exc}")

    print(f"  HTTP {response.status_code}")
    if response.status_code != 200:
        return _fail(f"Ollama HTTP {response.status_code}: {response.text[:300]}")

    try:
        data = response.json()
    except ValueError as exc:
        return _fail(f"Ollama body is not JSON: {exc}")

    used_model = data.get("model") or model
    print(f"  response model: {used_model}")
    if not fu._is_gemma4(str(used_model)):
        return _fail(f"response came from {used_model}, not Gemma 4")

    message = data.get("message") or {}
    thinking = message.get("thinking")
    content = message.get("content")
    thinking_chars = len(thinking.strip()) if isinstance(thinking, str) else 0
    content_preview = (content or "")[:240].replace("\n", " ")
    print(f"  thinking chars: {thinking_chars}")
    print(f"  content preview: {content_preview}")

    inlined = isinstance(content, str) and (
        "<|channel>" in content or "<think>" in content
    )
    if thinking_chars == 0 and not inlined:
        return _fail("Gemma 4 returned no thinking trace")

    if not isinstance(content, str) or not content.strip():
        return _fail("Gemma 4 returned empty content after thinking")

    payload = fu._extract_json_payload(content)
    print(f"  parsed payload: {json.dumps(payload, ensure_ascii=False)}")
    if not isinstance(payload, list):
        return _fail("expected a JSON array from the filter-shaped prompt")
    ids = [item.get("id") for item in payload if isinstance(item, dict)]
    if 1 in ids:
        return _fail("model selected the defence title; filter prompt failed")
    print("SMOKE PASS: Gemma 4 thinking returned parseable JSON")
    return 0


def main() -> int:
    print("Daily auto-update smoke (read-only)")
    pib_status = smoke_pib_listing()
    ollama_status = smoke_gemma4_thinking()
    if pib_status == 0 and ollama_status == 0:
        print("SMOKE PASS: PIB listing and Gemma 4 thinking")
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
