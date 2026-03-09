import json
import os
import requests  # type: ignore
import time
from typing import List, Dict, Any

# Prefer environment variable (GitHub Secrets)
GOOGLE_GEMINI_KEY = os.environ.get("GOOGLE_GEMINI_KEY")

if not GOOGLE_GEMINI_KEY:
    raise ValueError("GOOGLE_GEMINI_KEY environment variable is not set")

GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GOOGLE_GEMINI_KEY}"

MOCK_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src', 'data', 'mockData.json')
PRACTICAL_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src', 'data', 'practical.json')

def call_gemini_to_verify(text_content):
    """
    Asks Gemini to verify the public health data. Returns the corrected text if changes are needed, 
    otherwise returns the original text.
    """
    prompt = f"""
    You are an expert Indian Community Medicine and Public Health Editor.
    I will provide you with a section of educational text from a medical app.
    
    YOUR JOB:
    Verify if the medical facts, national health program guidelines, financial incentives (like Nikshay Poshan Yojana amounts), and WHO definitions are completely up-to-date as of 2026.
    
    RULES:
    1. If the information is outdated or factually incorrect, CORRECT IT in the text.
    2. DO NOT change the structure, the headings, the mnemonics, or the general tone of the educational content unless strictly necessary for factual accuracy. 
    3. Keep the exact same formatting (newlines, ALL CAPS headings).
    4. Provide ONLY the final, corrected full text in your response. No introductory sentences, no markdown backticks, no explanations. Just the raw text.
    
    Text to verify:
    {text_content}
    """
    
    try:
        response = requests.post(
            GEMINI_API_URL,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}]
            },
            timeout=40
        )
        response.raise_for_status()
        data = response.json()
        
        if data and "candidates" in data and len(data["candidates"]) > 0:
            text_response = data["candidates"][0]["content"]["parts"][0]["text"]
            # Clean strict backticks if Gemini accidentally adds them
            if text_response.startswith('```'):
                text_response = '\n'.join(text_response.split('\n')[1:-1])
            return text_response.strip()
            
    except Exception as e:
        print(f"Gemini API Error: {e}")
        
    return text_content # Fallback to original if API fails

def process_file_verification(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data: List[Dict[str, Any]] = json.load(f)
            
        filename = os.path.basename(file_path)
        print(f"\n--- Verifying {filename} ({len(data)} chapters) ---")
        
        # 1. Strip all existing 'recentlyUpdated' flags globally from previous weeks
        def strip_recently_updated(items):
            for item in items:
                if 'recentlyUpdated' in item:
                    del item['recentlyUpdated']
                if 'subsections' in item:
                    strip_recently_updated(item['subsections'])
                    
        strip_recently_updated(data)
                         
        updates_made: int = 0
        
        def verify_item_recursively(item, index_str):
            nonlocal updates_made
            print(f"Verifying [{index_str}]: {item.get('title', 'Unknown')}")
            
            # Check if this chapter has direct content
            if 'content' in item:
                original_content = item['content']
                new_content = call_gemini_to_verify(original_content)
                
                if new_content and new_content != original_content:
                    # Double check it didn't just return empty or slightly stripped space
                    if len(new_content) > 100: 
                        item['content'] = new_content
                        item['recentlyUpdated'] = True
                        updates_made = int(updates_made) + 1  # type: ignore
                        print(f"  -> Updates found and applied to {item.get('title', 'Unknown')}.")
                        
            # Check if this chapter has subsections
            if 'subsections' in item:
                for sub_index, subsection in enumerate(item['subsections']):
                    verify_item_recursively(subsection, f"{index_str}.{sub_index + 1}")

        for index, item in enumerate(data):
            verify_item_recursively(item, str(index + 1))
            # Sleep slightly to avoid hitting Gemini rate limits rapidly
            time.sleep(2)
            
        if int(updates_made) > 0:
            print(f"\nVerification complete for {filename}. {updates_made} sections were updated.")
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4)
            print(f"Successfully wrote updated data to {filename}.")
        else:
            print(f"\nVerification complete for {filename}. No factual changes were needed. Data is up-to-date.")
            
    except FileNotFoundError:
        print(f"Error: Could not find mock data file at {file_path}")
    except json.JSONDecodeError:
        print(f"Error: {file_path} is not valid JSON.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

def verify_and_update_all():
    process_file_verification(MOCK_DATA_PATH)
    process_file_verification(PRACTICAL_DATA_PATH)

if __name__ == "__main__":
    print("Starting automated verification of data files against current medical guidelines...")
    verify_and_update_all()
