import argparse
import json
import os
import uuid
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional, Set, Tuple

try:
    import requests  # type: ignore
except ImportError:  # seed-only path does not need requests
    requests = None  # type: ignore

OLLAMA_API_KEY = os.environ.get("OLLAMA_API_KEY")

OLLAMA_API_URL = "https://ollama.com/api/chat"
# MiniMax M3 left the Ollama Cloud free tier (HTTP 402). Gemma 4 31B remains on free.
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "gemma4:31b-cloud")
OLLAMA_FALLBACK_MODELS = [
    m.strip()
    for m in os.environ.get(
        "OLLAMA_FALLBACK_MODELS",
        "gpt-oss:20b-cloud,gpt-oss:120b-cloud",
    ).split(",")
    if m.strip()
]

MAX_RETRIES = 2
RETRY_DELAY_SECONDS = 5

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "src" / "data"
UPDATES_PATH = DATA_DIR / "updates.json"
ARCHIVE_PATH = DATA_DIR / "updates_archive.json"
FEED_COLLECTION = "appContent"
FEED_DOC_ID = "updatesFeed"
FEED_DOC_ID_PREVIEW = "updatesFeedPreview"
UPDATES_PREVIEW_PATH = DATA_DIR / "updates_preview.json"


_GEMMA4_THOUGHT_RE = re.compile(
    r"<\|channel>thought\s*.*?<channel\|>",
    flags=re.DOTALL | re.IGNORECASE,
)
_XML_THINK_RE = re.compile(r"<think>.*?</think>", flags=re.DOTALL | re.IGNORECASE)


def _is_gemma4(model: str) -> bool:
    return "gemma4" in (model or "").lower()


def _think_param_for_model(model: str):
    # Gemma 4 thinking is on/off. "max" is a MiniMax/Qwen level.
    if _is_gemma4(model):
        return True
    return "high"


def _chat_messages(model: str, prompt: str) -> List[Dict[str, str]]:
    messages: List[Dict[str, str]] = []
    if _is_gemma4(model):
        messages.append({"role": "system", "content": "<|think|>"})
    messages.append({"role": "user", "content": prompt})
    return messages
