import re

with open('d:/The App/scripts/verify_mock_data.py', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add imports
imports = '''
import asyncio
import base64
import io
from telethon.sync import TelegramClient
from telethon.sessions import StringSession
'''
text = text.replace('import json\nimport os', 'import json\nimport os\n' + imports.strip() + '\n')

# 2. Add Telegram constants right after GEMINI CONFIGURATION
tg_config = '''
# --- TELEGRAM CONFIGURATION ---
TELEGRAM_API_ID = int(os.environ.get('TELEGRAM_API_ID', '1133218'))
TELEGRAM_API_HASH = os.environ.get('TELEGRAM_API_HASH', '5a0f5247fa89b8e191c4f0259468f9a5')
TELEGRAM_SESSION = os.environ.get('TELEGRAM_SESSION', '1BVtsOLYBu7ruqd6GsfNUGIZNqx_dwdNlsSrQzOlh3j1wd1A_Tz2Ajx9zYJjNSBJPSQPySJGI3P093qvOj4nuzWDdpVHIcezCvQ-Kyy2KIkp-uWAPIJDI5q3BWbzV4LHHLb4KsCAEahH88ttzHlm1bWIIemKPy9TBIDSLRN24d_AAK8wSXamkN1aGi_a1PPTQ6wQyCFbKajw6si-iDBD8c_1oiij2-5_tYO-Q5T3gxxWGNLwqhZTSc44VdmFWngKPDI8YcRYxAkWoswqOr-udyo1_4V_kQ7jHHxWjYsxy3mIWP_WwRblX_tLJpaaOr2-24k7lESvIz9zC2UwClLR9dNtvTsmNTg0=')
'''
text = text.replace('# --- APP DATA SETTINGS ---', tg_config + '\n\n# --- APP DATA SETTINGS ---')

# 3. Add Gemini Vision Fetcher helper
vision_helper = '''
def _call_openrouter_vision(prompt: str, base64_image: str) -> Optional[str]:
    try:
        response = requests.post(
            GEMINI_API_URL,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {GEMINI_API_KEY}"},
            json={
                "model": "gemini-1.5-flash-latest",
                "messages": [
                    {"role": "user", "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]}
                ],
                "temperature": 0.1,
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        if response.status_code == 200:
            return _extract_candidate_text(response.json())
        print(f'Gemini Vision status {response.status_code}: {response.text}')
    except Exception as exc:
        print(f'Gemini Vision error: {exc}')
    return None
'''
text = text.replace('def _extract_candidate_text(', vision_helper + '\n\ndef _extract_candidate_text(')

# 4. Replace `_fetch_pib_notifications_for_programs`
tg_fetcher = '''
async def _async_fetch_telegram_updates(program_keywords: List[str]) -> str:
    print('  Telegram: Connecting...')
    try:
        client = TelegramClient(StringSession(TELEGRAM_SESSION), TELEGRAM_API_ID, TELEGRAM_API_HASH)
        await client.connect()
        if not await client.is_user_authorized():
            return 'Telegram session is invalid.'
        
        msgs = await client.get_messages('kayspsm', limit=30)
        
        feed_items = []
        image_count = 0
        
        for m in msgs:
            text = m.message or ''
            
            # Use Gemini Vision for Images
            if m.photo and image_count < 5:
                print(f'  Telegram: Processing image in message {m.id}...')
                img_bytes = await client.download_media(m.photo, bytes)
                encoded = base64.b64encode(img_bytes).decode('utf-8')
                vision_prompt = f"Extract any medical statistics, targets, or program updates from this image. Keep it brief. Context tags: {', '.join(program_keywords)}"
                vision_text = _call_openrouter_vision(vision_prompt, encoded)
                if vision_text:
                    text += f'\\n\\n[Extracted from Image]: {vision_text}'
                image_count += 1
            
            if text.strip() and len(text) > 20:
                feed_items.append({'title': f'Post {m.id}', 'text': text[:3000]})
                
        if not feed_items:
            return 'No relevant Telegram notifications found.'

        # Standard keyword filtering locally (light filtering)
        kw_lower = [k.lower() for k in program_keywords]
        relevant_items = []
        for fi in feed_items:
            lt = fi['text'].lower()
            if any(k in lt for k in kw_lower[:5]):
                 relevant_items.append(fi)
        
        # If too strict, just use the first 10
        if not relevant_items:
            relevant_items = feed_items[:10]
            
        notifications_text = []
        for item in relevant_items[:6]:
            notifications_text.append(f"TITLE: {item['title']}\\nCONTENT: {item['text']}")
            
        return '\\n\\n---\\n\\n'.join(notifications_text) if notifications_text else 'No relevant Telegram notifications found.'
    except Exception as exc:
         print(f'Error fetching Telegram feed: {exc}')
         return 'Could not fetch Telegram notifications.'

def _fetch_telegram_updates_for_programs(program_keywords: List[str]) -> str:
    return asyncio.run(_async_fetch_telegram_updates(program_keywords))
'''

# Find bounds to replace PIB function
start_idx = text.find('def _fetch_pib_notifications_for_programs')
end_idx = text.find('def _verify_claim_batch')
if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + tg_fetcher + '\n\n' + text[end_idx:]

# Replace invocation
text = text.replace('_fetch_pib_notifications_for_programs(program_keywords)', '_fetch_telegram_updates_for_programs(program_keywords)')
text = text.replace('Fetching MoHFW PIB notifications', 'Fetching Telegram updates')
text = text.replace('current MoHFW notifications.', 'current Telegram updates.')

with open('d:/The App/scripts/verify_mock_data.py', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated successfully.')
