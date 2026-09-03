import subprocess
import json
import time
import base64
import os
import sys
from PIL import Image

PAGE_ID = "99e64141-e6d6-40a3-b832-368e030e0e0c"

def run_eval(js_code):
    cmd = ['orca', 'eval', '--page', PAGE_ID, '--expression', js_code]
    p = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    return p.stdout.strip()

def get_last_assistant_turn():
    js = """(() => {
        const turns = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
        if (!turns.length) return 'no_assistant';
        const last = turns[turns.length - 1];
        const imgs = Array.from(last.querySelectorAll('img')).map(i => i.src);
        return JSON.stringify({
            text: last.innerText.slice(0, 200),
            images: imgs
        });
    })()"""
    res = run_eval(js)
    try:
        return json.loads(res)
    except Exception:
        return res

def get_estuary_urls():
    js = """(() => {
        const imgs = Array.from(document.images).map(i => i.src);
        const filtered = imgs.filter(s => s.includes('estuary') && s.includes('file_'));
        const unique = [];
        for (const u of filtered) {
            if (!unique.includes(u)) unique.push(u);
        }
        return JSON.stringify(unique);
    })()"""
    res = run_eval(js)
    try:
        return json.loads(res)
    except Exception:
        return []

def send_prompt(prompt_text):
    clean_text = json.dumps(prompt_text)
    js = f"""new Promise((resolve) => {{
        const el = document.querySelector('#prompt-textarea');
        if (!el) return resolve('no_textarea');
        el.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);
        
        const event = new InputEvent('beforeinput', {{
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: {clean_text}
        }});
        el.dispatchEvent(event);
        document.execCommand('insertText', false, {clean_text});
        
        setTimeout(() => {{
            const sendBtn = document.querySelector('button[data-testid="send-button"]') ||
                            Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Send prompt' || b.getAttribute('aria-label') === 'Send message');
            if (sendBtn) {{
                sendBtn.click();
                resolve('sent');
            }} else {{
                // Fallback: trigger Enter keydown
                const enterEvent = new KeyboardEvent('keydown', {{
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true
                }});
                el.dispatchEvent(enterEvent);
                resolve('sent_via_enter');
            }}
        }}, 600);
    }})"""
    return run_eval(js)

def download_image(url, out_path):
    js = f"""new Promise((resolve, reject) => {{
        fetch("{url}")
            .then(r => r.blob())
            .then(blob => {{
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }})
            .catch(reject);
    }})"""
    data_url = run_eval(js)
    if 'base64,' in data_url:
        b64_str = data_url.split('base64,')[1].strip('"').strip("'")
        img_bytes = base64.b64decode(b64_str)
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, 'wb') as f:
            f.write(img_bytes)
        im = Image.open(out_path)
        sz_kb = len(img_bytes) / 1024
        print(f"[+] Successfully saved {out_path}: {im.size} {im.mode} ({sz_kb:.1f} KB)")
        return True
    else:
        print(f"[!] Error: no base64 found for {out_path}")
        return False

def generate_diagram(prompt_text, filename, max_wait=120):
    initial_urls = get_estuary_urls()
    print(f"\n=======================================================")
    print(f"[*] Starting generation for: {filename}")
    print(f"[*] Initial image count: {len(initial_urls)}")
    print(f"[*] Prompt: {prompt_text[:100]}...")
    
    status = send_prompt(prompt_text)
    print(f"[*] Send prompt status: {status}")
    if 'sent' not in status:
        print(f"[!] Warning: prompt may not have sent properly: {status}")
    
    start_time = time.time()
    while time.time() - start_time < max_wait:
        time.sleep(6)
        current_urls = get_estuary_urls()
        if len(current_urls) > len(initial_urls):
            newest_url = current_urls[-1]
            print(f"[+] Detected new image URL from ChatGPT ({len(current_urls)} total)")
            out_path = os.path.join("reading-illustrations", filename)
            success = download_image(newest_url, out_path)
            if success:
                # Brief cooldown so UI resets
                time.sleep(3)
                return True
        else:
            elapsed = int(time.time() - start_time)
            print(f"[*] Still generating... ({elapsed}s elapsed)")
            
    print(f"[!] Timeout waiting for image: {filename}")
    return False

if __name__ == '__main__':
    if len(sys.argv) > 2:
        prompt = sys.argv[1]
        fname = sys.argv[2]
        generate_diagram(prompt, fname)
    else:
        urls = get_estuary_urls()
        print(f"Current count: {len(urls)}")
