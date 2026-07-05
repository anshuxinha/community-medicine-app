import json
import os
import time
import argparse
from datetime import datetime, timedelta
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


def send_push_notifications(tokens: List[str], title: str, body: str, screen: str) -> None:
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
                "title": title,
                "body": body,
                "channelId": "default",
                "data": {"screen": screen},
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
    parser = argparse.ArgumentParser(description="Send broadcast push notifications via Expo.")
    parser.add_argument("--title", default="Library Updated", help="Notification title")
    parser.add_argument("--body", default="The Community Medicine textbook was verified and updated. Tap to see what is new.", help="Notification body")
    parser.add_argument("--screen", default="Dashboard", help="Screen to navigate to when tapped")
    parser.add_argument("--daily-checks", action="store_true", help="Evaluate and send daily scheduled notifications")
    args = parser.parse_args()

    print("Collecting push notification tokens...")
    tokens = fetch_push_tokens()
    print(f"Found {len(tokens)} tokens.")

    if args.daily_checks:
        print("Running daily notifications check...")
        
        script_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(os.path.dirname(script_dir), "src", "data", "publicHealthDays.json")
        
        try:
            with open(json_path, "r", encoding="utf-8") as file:
                public_health_days = json.load(file)
        except Exception as exc:
            print(f"Could not load publicHealthDays.json: {exc}")
            exit(1)

        # Indian Standard Time (IST) is UTC+5:30
        utc_now = datetime.utcnow()
        ist_now = utc_now + timedelta(hours=5, minutes=30)
        
        today_month = ist_now.month
        today_day = ist_now.day
        
        tomorrow = ist_now + timedelta(days=1)
        tomorrow_month = tomorrow.month
        tomorrow_day = tomorrow.day

        # 1. Day-Before reminder (runs at 8:00 AM IST)
        tomorrow_matches = [hd for hd in public_health_days if hd.get("month") == tomorrow_month and hd.get("day") == tomorrow_day]
        for hd in tomorrow_matches:
            is_week = "-" in hd.get("dateLabel", "")
            emoji = "📅" if is_week else "🏥"
            label = "starts tomorrow" if is_week else "is tomorrow"
            desc = hd.get("description", "").split(".")[0]
            title = f"{emoji} Reminder: {hd.get('name')}"
            body = f"{hd.get('name')} {label}! {desc}."
            print(f"Sending day-before reminder for: {hd.get('name')}")
            send_push_notifications(tokens, title, body, "Dashboard")

        # 2. Today notification (runs at 8:00 AM IST)
        today_matches = [hd for hd in public_health_days if hd.get("month") == today_month and hd.get("day") == today_day]
        for hd in today_matches:
            is_week = "-" in hd.get("dateLabel", "")
            emoji = "📅" if is_week else "🏥"
            label = "Week begins today" if is_week else "Today"
            desc = hd.get("description", "").split(".")[0]
            title = f"{emoji} {hd.get('name')}"
            body = f"{label}! {desc}."
            print(f"Sending today reminder for: {hd.get('name')}")
            send_push_notifications(tokens, title, body, "Dashboard")

        # 3. Weekly digest / preview (Only on Sundays)
        # Sunday in Python weekday() is 6
        if ist_now.weekday() == 6:
            upcoming = []
            for i in range(7):
                check_date = ist_now + timedelta(days=i)
                m = check_date.month
                d = check_date.day
                match = next((hd for hd in public_health_days if hd.get("month") == m and hd.get("day") == d), None)
                if match:
                    upcoming.append(match)
            
            if not upcoming:
                title = "📊 Your Weekly Progress"
                body = "Check your study stats and see how far you've come this week!"
                print("Sending generic weekly progress digest")
                send_push_notifications(tokens, title, body, "Dashboard")
            else:
                days_list = "\n".join([f"• {hd.get('dateLabel')}: {hd.get('name')}" for hd in upcoming])
                if len(upcoming) == 1:
                    body = f"{upcoming[0].get('name')} is coming up this week ({upcoming[0].get('dateLabel')})."
                else:
                    body = f"{len(upcoming)} health days this week:\n{days_list}"
                title = "📅 This Week in Public Health"
                print("Sending weekly public health days preview")
                send_push_notifications(tokens, title, body, "Dashboard")
    else:
        send_push_notifications(tokens, args.title, args.body, args.screen)
        
    print("Notification broadcast complete.")
