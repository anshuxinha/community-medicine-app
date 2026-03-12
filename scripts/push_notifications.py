import json
import os
import time
from typing import Any, Dict, List, Optional, Set

import requests  # type: ignore
from google.auth.transport.requests import Request as GoogleAuthRequest  # type: ignore
from google.oauth2 import service_account  # type: ignore

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "community-med-app")
FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/users"
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _load_service_account_info() -> Optional[Dict[str, Any]]:
    # Preferred for CI: store the raw JSON in a GitHub secret.
    raw_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if raw_json:
        try:
            return json.loads(raw_json)
        except json.JSONDecodeError as exc:
            print(f"FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON: {exc}")
            return None

    # Fallback: local developer machine can point to a credentials file.
    credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if credentials_path and os.path.exists(credentials_path):
        try:
            with open(credentials_path, "r", encoding="utf-8") as file:
                return json.load(file)
        except Exception as exc:
            print(f"Could not read GOOGLE_APPLICATION_CREDENTIALS file: {exc}")
            return None

    # Final fallback for local scripts.
    local_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "serviceAccountKey.json")
    if os.path.exists(local_path):
        try:
            with open(local_path, "r", encoding="utf-8") as file:
                return json.load(file)
        except Exception as exc:
            print(f"Could not read local serviceAccountKey.json: {exc}")
            return None

    return None


def _get_firestore_access_token() -> Optional[str]:
    service_account_info = _load_service_account_info()
    if not service_account_info:
        print(
            "No Firebase service account credentials found. "
            "Set FIREBASE_SERVICE_ACCOUNT_JSON in GitHub secrets to enable notifications."
        )
        return None

    try:
        credentials = service_account.Credentials.from_service_account_info(
            service_account_info,
            scopes=["https://www.googleapis.com/auth/datastore"],
        )
        credentials.refresh(GoogleAuthRequest())
        return credentials.token
    except Exception as exc:
        print(f"Failed to mint Firestore access token: {exc}")
        return None


def _extract_push_token(fields: Dict[str, Any]) -> Optional[str]:
    push_token_field = fields.get("pushToken", {})
    token = push_token_field.get("stringValue")
    if not isinstance(token, str):
        return None
    if token.startswith("ExponentPushToken[") or token.startswith("ExpoPushToken["):
        return token
    return None


def fetch_push_tokens() -> List[str]:
    access_token = _get_firestore_access_token()
    if not access_token:
        return []

    tokens: Set[str] = set()
    next_page_token: Optional[str] = None
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        while True:
            params: Dict[str, Any] = {"pageSize": 500}
            if next_page_token:
                params["pageToken"] = next_page_token

            response = requests.get(FIRESTORE_URL, headers=headers, params=params, timeout=30)
            if response.status_code != 200:
                print(f"Failed to fetch users from Firestore ({response.status_code}): {response.text}")
                break

            payload = response.json()
            for doc in payload.get("documents", []):
                fields = doc.get("fields", {})
                token = _extract_push_token(fields)
                if token:
                    tokens.add(token)

            next_page_token = payload.get("nextPageToken")
            if not next_page_token:
                break
    except Exception as exc:
        print(f"Error fetching tokens: {exc}")

    return sorted(tokens)


def send_push_notifications(tokens: List[str]) -> None:
    if not tokens:
        print("No valid push tokens found. Skipping notifications.")
        return

    print(f"Preparing to send notifications to {len(tokens)} recipients...")

    messages: List[Dict[str, Any]] = []
    for token in tokens:
        messages.append(
            {
                "to": token,
                "sound": "default",
                "title": "Library Updated",
                "body": "The Community Medicine textbook was verified and updated. Tap to see what is new.",
                "data": {"screen": "Dashboard"},
            }
        )

    # Expo recommends sending up to 100 messages per request.
    chunk_size = 100
    for index in range(0, len(messages), chunk_size):
        chunk = messages[index : index + chunk_size]
        try:
            response = requests.post(
                EXPO_PUSH_URL,
                headers={
                    "Accept": "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                },
                json=chunk,
                timeout=30,
            )
            print(f"Chunk {index // chunk_size + 1} sent. Status: {response.status_code}")
            if response.status_code >= 400:
                print(f"Expo push error payload: {response.text}")
            time.sleep(1)
        except Exception as exc:
            print(f"Error sending push chunk: {exc}")


if __name__ == "__main__":
    print("Collecting push notification tokens...")
    tokens = fetch_push_tokens()
    print(f"Found {len(tokens)} tokens.")
    send_push_notifications(tokens)
    print("Notification broadcast complete.")
