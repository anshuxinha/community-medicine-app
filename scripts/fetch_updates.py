"""Assemble scripts/fetch_updates from part files (MCP payload-size workaround).
Replace with the single source file when possible.
"""
from __future__ import annotations

from pathlib import Path

_dir = Path(__file__).resolve().parent
_parts = sorted(_dir.glob("fetch_updates.part*"))
if not _parts:
    raise SystemExit("Missing scripts/fetch_updates.part* files")
_code = "".join(p.read_text(encoding="utf-8") for p in _parts)
exec(compile(_code, str(Path(__file__).resolve()), "exec"), globals())
