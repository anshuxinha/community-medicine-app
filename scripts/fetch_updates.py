"""Load scripts/fetch_updates.py from gzip+base64 sidecar (payload size workaround).
Replace this loader with the real source from /workspace/ph-digest/out/fetch_updates.py.
"""
from __future__ import annotations

import base64
import gzip
from pathlib import Path

_SIDE = Path(__file__).with_name("fetch_updates.py.gz.b64")
_CODE = gzip.decompress(base64.b64decode(_SIDE.read_text(encoding="ascii").strip()))
exec(compile(_CODE, str(Path(__file__).resolve()), "exec"), globals())
