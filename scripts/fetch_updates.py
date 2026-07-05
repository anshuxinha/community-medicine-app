import json
import os
import uuid
import re
import time
import requests  # type: ignore
from datetime import datetime, timezone
from bs4 import BeautifulSoup  # type: ignore
from typing import List, Dict, Any, Optional

OLLAMA_API_KEY = os.environ.get("OLLAMA_API_KEY")
if not OLLAMA_API_KEY:
    raise ValueError("OLLAMA_API_KEY environment variable is not set")

OLLAMA_API_URL = "https://ollama.com/api/chat"
OLLAMA_MODEL = "gemma4:31b-cloud"

MAX_RETRIES = 2
RETRY_DELAY_SECONDS = 5


def _extract_candidate_text(payload: Dict[str, Any]) -> Optional[str]:
    """Extract text from Ollama /api/chat response shape."""
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
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "stream": False,
                    "options": {"temperature": 0.1},
                },
                timeout=120
            )

            if response.status_code == 200:
                try:
                    data = response.json()
                except (json.JSONDecodeError, ValueError) as exc:
                    print(f"Ollama API returned non-JSON body (status 200): {exc}")
                    last_error = "invalid JSON"
                    continue
                text_response = _extract_candidate_text(data)
                if text_response:
                    payload = _extract_json_payload(text_response)
                    if payload is not None:
                        return payload
                last_error = "empty or unparseable response body"
            elif response.status_code in (429, 500, 503):
                last_error = f"HTTP {response.status_code}: {response.text[:200]}"
                print(f"Ollama API Error (attempt {attempt + 1}): {last_error}")
            else:
                print(f"Ollama API Error {response.status_code}: {response.text[:200]}")
                return None  # non-retryable status

        except requests.RequestException as exc:
            last_error = str(exc)
            print(f"Ollama API request exception (attempt {attempt + 1}): {last_error}")

        if attempt < MAX_RETRIES:
            print(f"Retrying in {RETRY_DELAY_SECONDS}s...")
            time.sleep(RETRY_DELAY_SECONDS)

    print(f"Ollama API failed after {1 + MAX_RETRIES} attempts. Last error: {last_error}")
    return None


def generate_gemini_image(title: str, summary: str, update_id: str) -> Optional[str]:
    gemini_api_key = os.environ.get("GEMINI_API_KEY")

    # Carefully designed prompt using best practices for high conversion and premium branding
    prompt = (
        f"Generate a professional, high-quality 1:1 aspect ratio square featured image "
        f"for a community medicine/public health learning app update.\n\n"
        f"Topic: {title}\n"
        f"Summary: {summary}\n\n"
        f"Requirements:\n"
        f"- Visual Content: The image should serve as a relevant, engaging visual thumbnail or attention-grabber (like a featured header photo or vector graphic for an article in Inshorts). Illustrate the topic metaphorically or literally (e.g., vaccine vial, medical data graph, disease cell structure, or clinical setting) using a premium, clean design.\n"
        f"- NO Text / Summaries in Image: DO NOT write any news titles, bullet points, summaries, or explanatory copy in the main body of the image. It must be a textless, pure visual asset.\n"
        f"- Brand Colors: Use a clean modern palette with Stroma's primary accent color #9333ea (vibrant purple) integrated in highlights, key lines, or graphic accents.\n"
        f"- Logo Integration: In a clean corner of the image, integrate Stroma's minimalist brand logo and the text 'STROMA' styled in the brand accent color #9333ea (refer to path 'D:\\Stroma Files\\Logos and Banners\\Logo single bg colour.png' for context).\n"
        f"- Aesthetic: Minimalist, clean, premium, authoritative, scientific."
    )

    success = False
    img_bytes = None

    # Try Gemini first if key is available
    if gemini_api_key:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key={gemini_api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseModalities": ["TEXT", "IMAGE"],
                "imageConfig": {"aspectRatio": "1:1"}
            }
        }
        try:
            print(f"Attempting to generate image via Gemini 3.1 Flash for update {update_id}...")
            response = requests.post(url, json=payload, headers=headers, timeout=60)
            if response.status_code == 200:
                res_data = response.json()
                candidates = res_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for part in parts:
                        inline_data = part.get("inlineData")
                        if inline_data:
                            base64_data = inline_data.get("data")
                            if base64_data:
                                import base64
                                img_bytes = base64.b64decode(base64_data)
                                success = True
                                print("Gemini generation succeeded.")
                                break
                if not success:
                    print("Gemini response did not contain inlineData image.")
            else:
                print(f"Gemini API failed with status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Gemini generation raised an exception: {e}")

    # Fallback to Pollinations.ai if Gemini failed or key not set
    if not success:
        print("Falling back to Pollinations.ai for keyless free image generation...")
        import urllib.parse
        short_prompt = f"Professional clean medical graphic, theme: {title}. Brand colors: purple and white. Minimalist, scientific, attention grabber featured image, Stroma."
        encoded_prompt = urllib.parse.quote(short_prompt)
        pollinations_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&private=true"
        try:
            print(f"Requesting image from Pollinations.ai for update {update_id}...")
            poll_res = requests.get(pollinations_url, timeout=60)
            if poll_res.status_code == 200:
                img_bytes = poll_res.content
                success = True
                print("Pollinations.ai generation succeeded.")
            else:
                print(f"Pollinations.ai API failed with status {poll_res.status_code}")
        except Exception as e:
            print(f"Pollinations.ai generation raised an exception: {e}")

    # Save the image if we got the bytes
    if success and img_bytes:
        try:
            output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets', 'updates')
            os.makedirs(output_dir, exist_ok=True)
            file_path = os.path.join(output_dir, f"{update_id}.png")
            with open(file_path, 'wb') as f:
                f.write(img_bytes)
            print(f"Successfully saved image to {file_path}")
            return file_path
        except Exception as e:
            print(f"Error saving image file: {e}")

    return None


def update_js_image_map(new_mappings: Dict[str, str]):
    map_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src', 'data', 'updates_images_map.js')
    
    existing_mappings = {}
    if os.path.exists(map_path):
        try:
            with open(map_path, 'r', encoding='utf-8') as f:
                content = f.read()
            # Match "key": require("value")
            pattern = re.compile(r'"([^"]+)"\s*:\s*require\("([^"]+)"\)')
            matches = pattern.findall(content)
            for key, val in matches:
                existing_mappings[key] = val
        except Exception as e:
            print(f"Error parsing existing updates_images_map.js: {e}")
            
    for update_id in new_mappings:
        rel_path = f"../../assets/updates/{update_id}.png"
        existing_mappings[update_id] = rel_path
        
    try:
        os.makedirs(os.path.dirname(map_path), exist_ok=True)
        with open(map_path, 'w', encoding='utf-8') as f:
            f.write("export const UPDATES_IMAGES = {\n")
            for key in sorted(existing_mappings.keys()):
                f.write(f'  "{key}": require("{existing_mappings[key]}"),\n')
            f.write("};\n")
        print(f"Updated JS image map: {map_path} with {len(existing_mappings)} total entries.")
    except Exception as e:
        print(f"Error writing updates_images_map.js: {e}")


def fetch_health_updates():
    """Fetches real updates from the Government of India PIB feed for MoHFW."""
    # Force English (lang=1) and Delhi region (reg=3) to get consistent results
    url = "https://www.pib.gov.in/allRel.aspx?reg=3&lang=1"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.pib.gov.in/indexd.aspx"
    }
    
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src', 'data')
    output_path = os.path.join(output_dir, 'updates.json')
    archive_path = os.path.join(output_dir, 'updates_archive.json')
    
    MAX_UPDATES_TO_KEEP = 10
    
    # ── Load existing current-month updates ──
    existing_updates: List[Dict[str, Any]] = []
    if os.path.exists(output_path):
        try:
            with open(output_path, 'r', encoding='utf-8') as f:
                existing_updates = json.load(f)
        except Exception as e:
            print(f"Error loading existing updates: {e}")
    
    # ── Load archive ──
    archive: Dict[str, List[Dict[str, Any]]] = {}
    if os.path.exists(archive_path):
        try:
            with open(archive_path, 'r', encoding='utf-8') as f:
                archive = json.load(f)
        except Exception as e:
            print(f"Error loading archive: {e}")
    
    # ── Monthly rotation ──
    now = datetime.now(timezone.utc)
    current_month_key = now.strftime("%Y-%m")  # e.g. "2026-04"
    current_year = str(now.year)
    archive_changed = False

    # Move any updates from previous months into the archive
    still_current = []
    for u in existing_updates:
        u_date = u.get("date", "")
        u_month_key = u_date[:7] if len(u_date) >= 7 else ""  # "YYYY-MM"
        if u_month_key and u_month_key != current_month_key:
            archive.setdefault(u_month_key, [])
            # Avoid duplicates in archive
            archive_links = {a.get("link") for a in archive[u_month_key]}
            if u.get("link") not in archive_links:
                archive[u_month_key].append(u)
                archive_changed = True
        else:
            still_current.append(u)

    if len(still_current) != len(existing_updates):
        print(f"Archived {len(existing_updates) - len(still_current)} updates from previous months.")
        existing_updates = still_current

    # Year rollover: delete previous years' data
    stale_keys = [k for k in archive if not k.startswith(current_year)]
    if stale_keys:
        for k in stale_keys:
            del archive[k]
        archive_changed = True
        print(f"Year rollover: removed archive months {stale_keys}")

    # Persist archive if changed
    if archive_changed:
        os.makedirs(output_dir, exist_ok=True)
        with open(archive_path, 'w', encoding='utf-8') as f:
            json.dump(archive, f, indent=4)
        # Also save the trimmed current updates
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(existing_updates, f, indent=4)

    # Create a mapping of link -> update for deduplication
    existing_links = {u['link'] for u in existing_updates if 'link' in u}
    
    class SkipPIB(Exception):
        pass

    updates: List[Dict[str, Any]] = []
            
    try:
        session = requests.Session()
        
        print("Fetching initial ViewState tokens from PIB...")
        # Step 1: GET the English page to grab ASP.NET viewstates and dynamic names
        response = session.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        viewstate = soup.find("input", {"id": "__VIEWSTATE"})
        viewstate_val = viewstate["value"] if viewstate else ""
        
        viewstategenerator = soup.find("input", {"id": "__VIEWSTATEGENERATOR"})
        viewstategen_val = viewstategenerator["value"] if viewstategenerator else ""
        
        eventvalidation = soup.find("input", {"id": "__EVENTVALIDATION"})
        eventvalidation_val = eventvalidation["value"] if eventvalidation else ""

        # Dynamically find the dropdown names
        min_dropdown = soup.find("select", id=re.compile(r".*ddlMinistry.*", re.IGNORECASE))
        min_name = min_dropdown.get("name") if min_dropdown else "ctl00$ContentPlaceHolder1$ddlMinistry"
        
        day_dropdown = soup.find("select", id=re.compile(r".*ddlday.*", re.IGNORECASE))
        day_name = day_dropdown.get("name") if day_dropdown else "ctl00$ContentPlaceHolder1$ddlday"
        
        month_dropdown = soup.find("select", id=re.compile(r".*ddlMonth.*", re.IGNORECASE))
        month_name = month_dropdown.get("name") if month_dropdown else "ctl00$ContentPlaceHolder1$ddlMonth"
        
        year_dropdown = soup.find("select", id=re.compile(r".*ddlYear.*", re.IGNORECASE))
        year_name = year_dropdown.get("name") if year_dropdown else "ctl00$ContentPlaceHolder1$ddlYear"

        # Find the specific ID for Ministry of Health and Family Welfare
        # The page may load in Hindi by default, so check both languages.
        MOHFW_KEYWORDS = ["Health and Family Welfare", "स्वास्थ्य", "परिवार कल्याण"]
        MOHFW_FALLBACK_ID = "31"  # Known stable value on pib.gov.in

        mohfw_id = "0"
        if min_dropdown:
            for option in min_dropdown.find_all("option"):
                if any(kw in option.text for kw in MOHFW_KEYWORDS):
                    mohfw_id = option["value"]
                    break

        if mohfw_id == "0":
            print(f"MoHFW not found in dropdown; using fallback ID {MOHFW_FALLBACK_ID}")
            mohfw_id = MOHFW_FALLBACK_ID

        # Use current dates (now/current_year already set above)
        current_month = str(now.month)

        print(f"Querying MoHFW (ID: {mohfw_id}) updates for Month: {current_month}, Year: {current_year}...")
        # Step 2: POST request to filter by MoHFW and current month
        payload = {
            "__EVENTTARGET": min_name,
            "__EVENTARGUMENT": "",
            "__VIEWSTATE": viewstate_val,
            "__VIEWSTATEGENERATOR": viewstategen_val,
            "__EVENTVALIDATION": eventvalidation_val,
            "__VIEWSTATEENCRYPTED": "",
            min_name: mohfw_id,
            day_name: "0",      # 0 pulls all days in the selected month
            month_name: current_month,
            year_name: current_year,
            # Hidden region/language state fields required by PIB ASP.NET form
            "ctl00$ContentPlaceHolder1$hydregionid": "3",   # Delhi
            "ctl00$ContentPlaceHolder1$hydLangid": "1",     # English
        }

        post_response = session.post(url, data=payload, headers=headers, timeout=15)
        post_response.raise_for_status()
        post_soup = BeautifulSoup(post_response.text, 'html.parser')
        
        feed_items: List[Dict[str, Any]] = []
        for a in post_soup.find_all('a'):
            href = a.get('href', '')
            text = a.text.strip()
            if text and 'PRID=' in href:
                prid = href.split('PRID=')[-1].split('&')[0]
                link = f"https://pib.gov.in/PressReleasePage.aspx?PRID={prid}"
                
                # Skip links already present in the dashboard
                if link in existing_links:
                    continue
                
                if not any(i['link'] == link for i in feed_items):
                    feed_items.append({"id": len(feed_items), "title": text, "link": link})
                    
        # Only take top 50 to avoid passing too much text
        feed_items = feed_items[:50]  # type: ignore
        
        if not feed_items:
            raise SkipPIB("No new links found on PIB page for MoHFW this month.")
            
        filter_prompt = f"""
        You are an expert in Community Medicine, Public Health, and Epidemiology in India.
        I have a list of press releases from the Government of India published this month.
        
        YOUR TASK:
        Review the list of titles and select up to 3 that are HIGHLY RELEVANT to Community Medicine.
        
        STRICT INCLUSION CRITERIA:
        - National Health Programs (e.g., NHM, Ayushman Bharat, NTEP, NACP, etc.)
        - Vaccines, Immunization, and infectious disease outbreaks
        - Maternal and Child Health (MCH), Family Planning
        - Public Health infrastructure, epidemiology, or vital statistics
        
        STRICT EXCLUSION CRITERIA (IGNORE THESE COMPLETELY):
        - Telecom, TRAI, IT, 5G, or generic technology (unless strictly health-tech eSanjeevani)
        - Defense, Military, or routine political visits
        - Any other topic unrelated to public health or community medicine
        
        Return ONLY a JSON array of objects containing the "id" of the selected items. 
        Example: [{{"id": 4}}, {{"id": 12}}]
        If NO articles meet the criteria, return an empty array: []
        
        List:
        {json.dumps(feed_items, indent=2)}
        """
        
        print("Filtering relevant Community Medicine articles with Ollama...")
        selected_ids_response = call_ollama(filter_prompt)
        
        if selected_ids_response is None:
            raise SkipPIB("Failed to filter articles with Ollama.")
            
        selected_ids = [item['id'] for item in selected_ids_response if 'id' in item]
        selected_items = [item for item in feed_items if item['id'] in selected_ids]
        if not selected_items:
            raise SkipPIB("No relevant public-health updates selected by Ollama this run.")
        
        today_date = datetime.now().strftime('%Y-%m-%d')
        
        # Fetch article contents for all selected items
        articles = []
        for item in selected_items:
            try:
                print(f"Fetching: {item['link']}")
                pr_response = requests.get(item['link'], headers=headers, timeout=15)
                pr_soup = BeautifulSoup(pr_response.text, 'html.parser')
                raw_text: str = " ".join(pr_soup.get_text(separator=' ', strip=True).split())
                truncated_text = raw_text[:6000]  # type: ignore
                articles.append({
                    "id": item['id'],
                    "link": item['link'],
                    "text": truncated_text
                })
            except Exception as e:
                print(f"Error fetching {item['link']}: {e}")
                # Skip this article; continue with others
        
        if not articles:
            raise SkipPIB("No articles could be fetched.")
        
        # Build batch prompt
        articles_json = json.dumps([
            {"id": a["id"], "text": a["text"][:2000]}  # further truncate for token limits
            for a in articles
        ], indent=2)
        
        batch_prompt = f"""
        You are a public health journalist. I give you raw texts from multiple Press Information Bureau (PIB) India releases.
        For each article, extract the main health update.
        
        Return ONLY a valid JSON array of objects, each containing:
        - "id": the same id as provided (integer)
        - "title": a short English headline
        - "summary": an English summary of the update, constrained to EXACTLY 60 words (try to include important figures or numbers).
        - "date": the exact date of the release in YYYY-MM-DD format based on the text (default to today if unseen)
        
        Ensure the array length matches the number of articles provided.
        
        Articles:
        {articles_json}
        """
        
        print("Generating batch summaries with Ollama...")
        batch_summaries = call_ollama(batch_prompt)
        
        if not isinstance(batch_summaries, list):
            raise SkipPIB("Batch summarization failed or returned invalid format.")
        
        # Map summaries by id
        summary_by_id = {s["id"]: s for s in batch_summaries if "id" in s and "title" in s and "summary" in s}
        
        # Track links already added in this run to avoid duplicates within the batch
        added_links_in_run = set()
        for article in articles:
            article_id = article["id"]
            if article_id not in summary_by_id:
                print(f"No valid summary generated for article id {article_id}")
                continue
            s = summary_by_id[article_id]
            title = s["title"]
            summary = s["summary"]
            article_date = s.get("date", today_date)
            
            # Skip if link already exists in existing updates or already added in this run
            if article["link"] in existing_links or article["link"] in added_links_in_run:
                print(f"Skipping duplicate link: {article['link']}")
                continue
            
            # Also deduplicate by title within the new updates (optional)
            is_duplicate_title = any(u['title'].lower() == title.lower() for u in updates)
            if is_duplicate_title:
                print(f"Skipping duplicate title: {title}")
                continue
            
            if title and summary:
                updates.append({
                    "id": str(uuid.uuid4()),
                    "date": article_date if article_date else today_date,
                    "title": title,
                    "summary": summary,
                    "link": article["link"]
                })
                added_links_in_run.add(article["link"])
                
    except SkipPIB as e:
        print(f"PIB update check completed: {e}")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching PIB feed: {e}")
    except Exception as e:
         print(f"An unexpected error occurred during PIB fetch: {e}")

    # Combine existing updates with new updates, deduplicate by link
    combined = []
    seen_links = set()
    # First add existing updates (preserve order? we'll sort later)
    for u in existing_updates:
        if u.get('link') not in seen_links:
            seen_links.add(u['link'])
            combined.append(u)
    # Then add new updates (skip duplicates)
    for u in updates:
        if u.get('link') not in seen_links:
            seen_links.add(u['link'])
            combined.append(u)
    
    # Sort combined list by date descending (most recent first)
    combined.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    # Keep only the most recent MAX_UPDATES_TO_KEEP
    final_combined = combined[:MAX_UPDATES_TO_KEEP]
    
    # Load mapped image IDs from updates_images_map.js
    mapped_image_ids = set()
    map_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src', 'data', 'updates_images_map.js')
    if os.path.exists(map_path):
        try:
            with open(map_path, 'r', encoding='utf-8') as f:
                content = f.read()
            pattern = re.compile(r'"([^"]+)"\s*:\s*require\("([^"]+)"\)')
            mapped_image_ids = {key for key, val in pattern.findall(content)}
        except Exception as e:
            print(f"Error reading mapped image IDs: {e}")

    # Determine updates that are either new or missing their explainer image
    existing_ids = {u['id'] for u in existing_updates if 'id' in u}
    updates_to_image = [
        u for u in final_combined
        if u.get('id') not in existing_ids or u.get('id') not in mapped_image_ids
    ]

    if final_combined == existing_updates and not updates_to_image:
        print("No new updates detected and all active updates have explainer images. Exiting.")
        return

    new_mappings = {}
    for u in updates_to_image:
        update_id = u["id"]
        title = u["title"]
        summary = u["summary"]
        if u.get('id') not in existing_ids:
            print(f"New update detected: {title} (ID: {update_id})")
        else:
            print(f"Existing update is missing an explainer image. Generating: {title} (ID: {update_id})")
        
        # Generate and save image
        img_path = generate_gemini_image(title, summary, update_id)
        if img_path:
            new_mappings[update_id] = img_path

    if new_mappings:
        update_js_image_map(new_mappings)

    # Output to File
    os.makedirs(output_dir, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_combined, f, indent=4)
        
    print(f"Successfully saved {len(final_combined)} updates to {output_path}")

if __name__ == "__main__":
    fetch_health_updates()