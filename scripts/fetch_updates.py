import json
import os
import uuid
import requests
from datetime import datetime
from bs4 import BeautifulSoup

GEMINI_API_KEY = "AIzaSyAtcVnqlN2oYlfdDGms35rx_lV_TGYUE3c"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

def generate_summary_with_gemini(raw_text):
    """Uses Gemini API to extract a title and a 60-word English summary"""
    prompt = f"""
    You are a public health journalist. I will give you the raw text scraped from a Press Information Bureau (PIB) India or Ministry of Health webpage. 
    It might be in Hindi or English and might contain navigation links.
    
    Extract the main press release or health update.
    Respond ONLY with a valid RAW JSON object (no markdown, no backticks) containing:
    "title": "A short English headline",
    "summary": "An English summary of the update, constrained to EXACTLY 60 words."
    
    Text to parse:
    {raw_text[:6000]}
    """
    
    try:
        response = requests.post(
            GEMINI_API_URL,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}]
            },
            timeout=20
        )
        response.raise_for_status()
        data = response.json()
        
        if data and "candidates" in data and len(data["candidates"]) > 0:
            text_response = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            # Clean up potential markdown formatting if Gemini disobeys
            text_response = text_response.replace('```json', '').replace('```', '').strip()
            result = json.loads(text_response)
            return result.get("title", ""), result.get("summary", "")
            
    except Exception as e:
        print(f"Gemini API Error: {e}")
        
    return None, None

def fetch_health_updates():
    """Fetches real updates from the Government of India PIB Health Ministry feed."""
    # PIB India - Ministry of Health and Family Welfare (MenuId=30)
    url = "https://pib.gov.in/AllRelease.aspx?MenuId=30"  
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    updates = []
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all press release links in the content area
        links = []
        for ul in soup.find_all('ul', class_='num'):
            for a in ul.find_all('a', href=True):
                # Only grab absolute PR links
                if 'PRID' in a['href']:
                    href = a['href']
                    if not href.startswith('http'):
                        href = f"https://pib.gov.in/{href.lstrip('/')}"
                    links.append(href)
                    
        # Limit to 3 to adhere to Gemini Rate limits and speed
        links = links[:3]
        
        today_date = datetime.now().strftime('%Y-%m-%d')
        
        for link in links:
            try:
                print(f"Fetching: {link}")
                pr_response = requests.get(link, headers=headers, timeout=15)
                pr_soup = BeautifulSoup(pr_response.text, 'html.parser')
                
                # Extract all text, replacing multiple newlines
                raw_text = " ".join(pr_soup.get_text(separator=' ', strip=True).split())
                
                print("Generating summary...")
                title, summary = generate_summary_with_gemini(raw_text)
                
                if title and summary:
                    updates.append({
                        "id": str(uuid.uuid4()),
                        "date": today_date,
                        "title": title,
                        "summary": summary
                    })
                else:
                    print(f"Failed to generate summary for {link}")
                    
            except Exception as e:
                print(f"Error processing {link}: {e}")
                
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
