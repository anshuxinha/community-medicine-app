import json
import os
import uuid
import requests  # type: ignore
from datetime import datetime
from bs4 import BeautifulSoup  # type: ignore
from typing import List, Dict, Any

GOOGLE_GEMINI_KEY = os.environ.get("GOOGLE_GEMINI_KEY")

if not GOOGLE_GEMINI_KEY:
    raise ValueError("GOOGLE_GEMINI_KEY environment variable is not set")

GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={GOOGLE_GEMINI_KEY}"

import re

def call_gemini(prompt):
    try:
        response = requests.post(
            GEMINI_API_URL,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}]
            },
            timeout=30
        )
        if response.status_code != 200:
            print(f"Gemini API Error {response.status_code}: {response.text}")
            response.raise_for_status()
            
        data = response.json()
        
        if data and "candidates" in data and len(data["candidates"]) > 0:
            text_response = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            
            # Use regex to extract the first JSON block (array or object)
            # This handles cases where Gemini writes conversational text before/after the JSON
            json_match = re.search(r'(\{.*?\}|\[.*?\])', text_response, re.DOTALL)
            
            if json_match:
                extracted_json_str = json_match.group(1)
                try:
                    return json.loads(extracted_json_str)
                except json.JSONDecodeError as e:
                    print(f"Failed to parse extracted JSON. Error: {e}")
                    print(f"Extracted string was: {extracted_json_str}")
            else:
                print(f"Could not find valid JSON in Gemini response: {text_response}")
                
    except Exception as e:
        print(f"Gemini API Exception: {e}")
        
    return None

def fetch_health_updates():
    """Fetches real updates from the Government of India PIB feed."""
    url = "https://www.pib.gov.in/allRel.aspx?reg=3&lang=1"  
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src', 'data')
    output_path = os.path.join(output_dir, 'updates.json')
    
    existing_updates: List[Dict[str, Any]] = []
    updates: List[Dict[str, Any]] = []
    
    if os.path.exists(output_path):
        try:
            with open(output_path, 'r', encoding='utf-8') as f:
                existing_updates = json.load(f)
            updates = list(existing_updates)
        except Exception as e:
            print(f"Error loading existing updates: {e}")
            
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        feed_items: List[Dict[str, Any]] = []
        for a in soup.find_all('a'):
            href = a.get('href', '')
            text = a.text.strip()
            if text and 'PRID=' in href:
                prid = href.split('PRID=')[-1].split('&')[0]
                link = f"https://pib.gov.in/PressReleasePage.aspx?PRID={prid}"
                
                if not any(i['link'] == link for i in feed_items):
                    feed_items.append({"id": len(feed_items), "title": text, "link": link})
                    
        # Only take top 50 to avoid passing too much text
        feed_items = feed_items[:50]  # type: ignore
        
        if not feed_items:
            print("No links found on PIB page.")
            return
            
        filter_prompt = f"""
        You are an expert in Community Medicine, Public Health, and Epidemiology in India.
        I have a list of press releases from the Government of India published this month.
        
        YOUR TASK:
        Review the list of titles and select up to 3 that are HIGHLY RELEVANT to Community Medicine.
        
        STRICT INCLUSION CRITERIA:
        - National Health Programs (e.g., NHM, Ayushman Bharat, RNTCP/NTEP)
        - Vaccines, Immunization, and infectious disease outbreaks
        - Maternal and Child Health (MCH), Family Planning
        - Public Health infrastructure, epidemiology, or vital statistics
        
        STRICT EXCLUSION CRITERIA (IGNORE THESE COMPLETELY):
        - Telecom, TRAI, IT, 5G, or generic technology (unless strictly health-tech eSanjeevani)
        - Defense, Military, or routine political visits
        - General economics, finance, or unrelated agriculture
        
        Return ONLY a JSON array of objects containing the "id" of the selected items. 
        Example: [{{"id": 4}}, {{"id": 12}}]
        If NO articles meet the criteria, return an empty array: []
        
        List:
        {json.dumps(feed_items, indent=2)}
        """
        
        print("Filtering relevant Community Medicine articles with Gemini...")
        selected_ids_response = call_gemini(filter_prompt)
        
        if selected_ids_response is None:
            print("Failed to filter articles.")
            return
            
        selected_ids = [item['id'] for item in selected_ids_response if 'id' in item]
        selected_items = [item for item in feed_items if item['id'] in selected_ids]
        if not selected_items:
            print("No relevant public-health updates selected this run. Leaving updates feed unchanged.")
            return
        
        today_date = datetime.now().strftime('%Y-%m-%d')
        
        for item in selected_items:
            try:
                print(f"Fetching: {item['link']}")
                pr_response = requests.get(item['link'], headers=headers, timeout=15)
                pr_soup = BeautifulSoup(pr_response.text, 'html.parser')
                
                # Extract all text, replacing multiple newlines
                raw_text: str = " ".join(pr_soup.get_text(separator=' ', strip=True).split())
                truncated_text = raw_text[:6000]  # type: ignore
                
                summary_prompt = f"""
                You are a public health journalist. I give you raw text from a Press Information Bureau (PIB) India release.
                Extract the main health update.
                Respond ONLY with a valid RAW JSON object (no markdown, no backticks) containing:
                "title": "A short English headline",
                "summary": "An English summary of the update, constrained to EXACTLY 60 words.",
                "date": "The exact date of the release in YYYY-MM-DD format based on the text (default to today if unseen)"
                
                Text to parse:
                {truncated_text}
                """
                
                print("Generating summary...")
                summary_data = call_gemini(summary_prompt)
                
                if summary_data and "title" in summary_data and "summary" in summary_data:
                    title = summary_data["title"]
                    summary = summary_data["summary"]
                    article_date = summary_data.get("date", today_date)
                    
                    # Deduplication logic
                    is_duplicate = any(u['title'].lower() == title.lower() for u in updates)
                    
                    if title and summary and not is_duplicate:
                        updates.append({
                            "id": str(uuid.uuid4()),
                            "date": article_date if article_date else today_date,
                            "title": title,
                            "summary": summary,
                            "link": item['link']
                        })
                    elif is_duplicate:
                        print(f"Skipping duplicate: {title}")
                else:
                    print(f"Failed to generate summary for {item['link']}")
                    
            except Exception as e:
                print(f"Error processing {item['link']}: {e}")
                
    except requests.exceptions.RequestException as e:
        print(f"Error fetching PIB feed: {e}")
        return
    except Exception as e:
         print(f"An unexpected error occurred: {e}")
         return

    if updates == existing_updates:
        print("No new updates detected. updates.json unchanged.")
        return

    # Output to File
    os.makedirs(output_dir, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(updates, f, indent=4)
        
    print(f"Successfully saved {len(updates)} updates to {output_path}")

if __name__ == "__main__":
    fetch_health_updates()
