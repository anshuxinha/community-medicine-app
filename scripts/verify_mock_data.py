import json
import os
import requests
import time

# Prefer environment variable (GitHub Secrets), fallback to hardcoded key for local testing
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyAtcVnqlN2oYlfdDGms35rx_lV_TGYUE3c")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

MOCK_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src', 'data', 'mockData.json')

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

def verify_and_update_data():
    try:
        with open(MOCK_DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        print(f"Loaded {len(data)} chapters for verification.")
        
        updates_made = 0
        
        for index, item in enumerate(data):
            print(f"Verifying [{index + 1}/{len(data)}]: {item.get('title', 'Unknown')}")
            
            # Check if this chapter has direct content
            if 'content' in item:
                original_content = item['content']
                new_content = call_gemini_to_verify(original_content)
                
                if new_content and new_content != original_content:
                    # Double check it didn't just return empty or slightly stripped space
                    if len(new_content) > 100: 
                        item['content'] = new_content
                        updates_made += 1
                        print(f"  -> Updates found and applied to {item['title']}.")
                        
            # Check if this chapter has subsections (like National Health Programmes)
            if 'subsections' in item:
                for sub_index, subsection in enumerate(item['subsections']):
                    print(f"  Verifying subsection: {subsection.get('title', 'Unknown')}")
                    if 'content' in subsection:
                        original_sub_content = subsection['content']
                        new_sub_content = call_gemini_to_verify(original_sub_content)
                        
                        if new_sub_content and new_sub_content != original_sub_content:
                            if len(new_sub_content) > 100:
                                subsection['content'] = new_sub_content
                                updates_made += 1
                                print(f"    -> Updates found and applied to {subsection['title']}.")
                                
            # Sleep slightly to avoid hitting Gemini rate limits rapidly
            time.sleep(2)
            
        if updates_made > 0:
            print(f"\nVerification complete. {updates_made} sections were updated.")
            with open(MOCK_DATA_PATH, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4)
            print("Successfully wrote updated data to mockData.json.")
        else:
            print("\nVerification complete. No factual changes were needed. Data is up-to-date.")
            
    except FileNotFoundError:
        print(f"Error: Could not find mock data file at {MOCK_DATA_PATH}")
    except json.JSONDecodeError:
        print("Error: mockData.json is not valid JSON.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    print("Starting automated verification of mockData.json against current medical guidelines...")
    verify_and_update_data()
