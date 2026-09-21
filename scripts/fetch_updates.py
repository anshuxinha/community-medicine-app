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
