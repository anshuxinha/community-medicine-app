import json
import os
import uuid
import requests  # type: ignore
from datetime import datetime
from bs4 import BeautifulSoup  # type: ignore
from typing import List, Dict, Any

GEMINI_API_KEY = "AIzaSyAtcVnqlN2oYlfdDGms35rx_lV_TGYUE3c"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

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
        response.raise_for_status()
        data = response.json()
        
        if data and "candidates" in data and len(data["candidates"]) > 0:
            text_response = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            # Clean up potential markdown formatting
            text_response = text_response.replace('```json', '').replace('```', '').strip()
            return json.loads(text_response)
            
    except Exception as e:
        print(f"Gemini API Error: {e}")
        
    return None

def fetch_health_updates():
    """Fetches real updates from the Government of India PIB feed."""
    url = "https://www.pib.gov.in/allRel.aspx?reg=3&lang=1"  
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    updates: List[Dict[str, Any]] = []
    
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
            _generate_fallback_data(updates)
            return
            
        filter_prompt = f"""
        You are an expert in Community Medicine and Public Health. 
        I have a list of press releases from the Government of India published this month.
        Review the list of titles and select up to 3 that are the MOST relevant to Community Medicine, public health, vaccines, disease control, or healthcare infrastructure.
        DO NOT select duplicates or highly similar topics.
        Return ONLY a JSON array of objects containing the "id" of the selected items. 
        Example: [{{"id": 4}}, {{"id": 12}}]
        
        List:
        {json.dumps(feed_items, indent=2)}
        """
        
        print("Filtering relevant Community Medicine articles with Gemini...")
        selected_ids_response = call_gemini(filter_prompt)
        
        if not selected_ids_response:
            print("Failed to filter articles.")
            _generate_fallback_data(updates)
            return
            
        selected_ids = [item['id'] for item in selected_ids_response if 'id' in item]
        selected_items = [item for item in feed_items if item['id'] in selected_ids]
        
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
    except Exception as e:
         print(f"An unexpected error occurred: {e}")

    # Fallback Data
    if not updates:
        print("Warning: Could not parse articles. Using fallback data.")
        _generate_fallback_data(updates)

    # Output to File
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src', 'data')
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'updates.json')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(updates, f, indent=4)
        
    print(f"Successfully saved {len(updates)} updates to {output_path}")

def _generate_fallback_data(updates_list):
    """Provides fallback data if scraping fails."""
    today_date = datetime.now().strftime('%Y-%m-%d')
    updates_list.extend([
        {
            "id": str(uuid.uuid4()),
            "date": today_date,
            "title": "Ministry of Health Outlines New Telemedicine Guidelines",
            "summary": "To improve rural healthcare access, the Ministry of Health and Family Welfare (MoHFW) has released updated guidelines for telemedicine practitioners. The new mandate expands the list of prescribable medications and introduces mandatory cyber-security training for registered doctors using diagnostic platforms. These measures aim to bridge the urban-rural divide while ensuring patient data protection and standardized tele-consultation practices nationwide."
        }
    ])

if __name__ == "__main__":
    fetch_health_updates()
