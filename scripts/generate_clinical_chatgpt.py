# -*- coding: utf-8 -*-
"""Generate Library clinical diagrams via the open ChatGPT tab (Orca CLI)."""
from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JOBS_PATH = ROOT / "scripts" / "clinical_diagram_jobs.json"
RAW_DIR = ROOT / "reading-illustrations" / "raw"
PAGE_ID = "6312e9ed-6117-4a0d-9c98-61bbce0329dc"


def run_eval(js_code: str, timeout: int = 60) -> str:
    cmd = ["orca", "eval", "--page", PAGE_ID, "--expression", js_code]
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", timeout=timeout)
    out = (p.stdout or "").strip()
    if out.startswith("{"):
        try:
            payload = json.loads(out)
            if isinstance(payload, dict) and "result" in payload:
                inner = payload["result"]
                if isinstance(inner, dict) and "result" in inner:
                    return str(inner["result"]).strip()
                return str(inner).strip()
        except json.JSONDecodeError:
            pass
    return out


def estuary_ids() -> list[str]:
    js = """JSON.stringify(Array.from(document.images).map(i => i.src).filter(s => s.includes('estuary') && s.includes('file_')).filter((s,i,a)=>a.indexOf(s)===i))"""
    res = run_eval(js)
    try:
        urls = json.loads(res)
        return list(urls) if isinstance(urls, list) else []
    except Exception:
        return []


def send_prompt(prompt_text: str) -> str:
    clean = json.dumps(prompt_text)
    js = f"""new Promise((resolve) => {{
        const el = document.querySelector('#prompt-textarea') || document.querySelector('[data-placeholder]') || document.querySelector('[contenteditable="true"]');
        if (!el) return resolve('no_textarea');
        el.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);
        const event = new InputEvent('beforeinput', {{
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: {clean}
        }});
        el.dispatchEvent(event);
        document.execCommand('insertText', false, {clean});
        setTimeout(() => {{
            const sendBtn = document.querySelector('button[data-testid="send-button"]') ||
                            Array.from(document.querySelectorAll('button')).find(b => {{
                                const lab = (b.getAttribute('aria-label') || '').toLowerCase();
                                return lab === 'send prompt' || lab === 'send message' || lab.includes('send');
                            }});
            if (sendBtn && !sendBtn.disabled) {{
                sendBtn.click();
                resolve('sent');
            }} else {{
                const enterEvent = new KeyboardEvent('keydown', {{
                    key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
                }});
                el.dispatchEvent(enterEvent);
                resolve('sent_via_enter');
            }}
        }}, 700);
    }})"""
    return run_eval(js, timeout=90)


def download_image(url: str, out_path: Path) -> bool:
    js = f"""new Promise((resolve, reject) => {{
        fetch({json.dumps(url)})
            .then(r => r.blob())
            .then(blob => {{
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }})
            .catch(reject);
    }})"""
    data_url = run_eval(js, timeout=120)
    if "base64," not in data_url:
        print(f"[!] no base64 in download response: {data_url[:240]}")
        return False
    b64_str = data_url.split("base64,", 1)[1].strip().strip('"').strip("'")
    img_bytes = base64.b64decode(b64_str)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(img_bytes)
    print(f"[+] saved {out_path} ({len(img_bytes)/1024:.1f} KB)")
    return True


def generate_one(job: dict, max_wait: int = 150) -> bool:
    filename = job["fileName"]
    out_path = RAW_DIR / filename
    before = set(estuary_ids())
    print(f"\n=== {job['id']} ===")
    print(f"baseline estuary count: {len(before)}")
    status = send_prompt(job["prompt"])
    print(f"send: {status}")
    if "sent" not in status:
        print("[!] prompt may not have sent")
        return False
    start = time.time()
    while time.time() - start < max_wait:
        time.sleep(6)
        now = estuary_ids()
        new = [u for u in now if u not in before]
        elapsed = int(time.time() - start)
        if new:
            print(f"[+] new image after {elapsed}s")
            return download_image(new[-1], out_path)
        print(f"[*] waiting... {elapsed}s")
    print("[!] timeout")
    return False


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", action="append", dest="ids")
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()
    jobs = json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    if args.ids:
        wanted = set(args.ids)
        jobs = [j for j in jobs if j["id"] in wanted]
    elif not args.all:
        print("pass --id NAME or --all")
        return 2
    ok = 0
    for job in jobs:
        if generate_one(job):
            ok += 1
            time.sleep(4)
    print(f"\nDone: {ok}/{len(jobs)}")
    return 0 if ok == len(jobs) else 1


if __name__ == "__main__":
    sys.exit(main())
