import subprocess
import base64
import sys
import os

def download_chatgpt_image(page_id, estuary_url, output_path):
    js_code = f"""new Promise((resolve, reject) => {{
        fetch("{estuary_url}")
            .then(r => r.blob())
            .then(blob => {{
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }})
            .catch(reject);
    }})"""
    
    cmd = ['orca', 'eval', '--page', page_id, '--expression', js_code]
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    data_url = proc.stdout.strip()
    
    if 'base64,' in data_url:
        b64_str = data_url.split('base64,')[1].strip('"').strip("'")
        img_bytes = base64.b64decode(b64_str)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(img_bytes)
        print(f"[+] Successfully saved {output_path} ({len(img_bytes)} bytes)")
        return True
    else:
        print(f"[!] Error: no base64 found. Output was: {data_url[:200]}")
        return False

if __name__ == '__main__':
    page_id = sys.argv[1]
    url = sys.argv[2]
    out = sys.argv[3]
    download_chatgpt_image(page_id, url, out)
