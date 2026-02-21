import requests # type: ignore
from typing import List, Dict, Any
import json
import time

PROJECT_ID = "community-med-app"
FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/users"
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

def fetch_push_tokens():
    tokens = set()
    try:
        response = requests.get(FIRESTORE_URL)
        if response.status_code == 200:
            data = response.json()
            documents = data.get("documents", [])
            for doc in documents:
                fields = doc.get("fields", {})
                if "pushToken" in fields and "stringValue" in fields["pushToken"]:
                    token = fields["pushToken"]["stringValue"]
                    if token.startswith("ExponentPushToken"):
                        tokens.add(token)
        else:
            print(f"Failed to fetch users from Firestore: {response.text}")
    except Exception as e:
        print(f"Error fetching tokens: {e}")
    return list(tokens)

def send_push_notifications(tokens):
    if not tokens:
        print("No valid push tokens found. Skipping notifications.")
        return

    print(f"Preparing to send notifications to {len(tokens)} recipients...")

    messages: List[Dict[str, Any]] = []
    for token in tokens:
        messages.append({
            "to": token,
            "sound": "default",
            "title": "📚 Library Updated!",
            "body": "The Community Medicine textbook has been verified and updated with the latest guidelines. Tap to see what's new!",
            "data": {"screen": "Dashboard"},
        })

    # Chunk the messages (Expo recommends max 100 per request)
    chunk_size = 100
    for i in range(0, len(messages), chunk_size):
        chunk = messages[i:i + chunk_size] # type: ignore
        try:
            response = requests.post(
                EXPO_PUSH_URL,
                headers={
                    "Accept": "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                },
                json=chunk
            )
            print(f"Chunk sent. Status: {response.status_code}")
            time.sleep(1) # rate limits
        except Exception as e:
            print(f"Error sending push chunk: {e}")

if __name__ == "__main__":
    print("Collecting push notification tokens...")
    tokens = fetch_push_tokens()
    print(f"Found {len(tokens)} tokens.")
    send_push_notifications(tokens)
    print("Notification broadcast complete.")
