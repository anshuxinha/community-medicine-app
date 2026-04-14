import os
import asyncio
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

API_ID = 1133218
API_HASH = "5a0f5247fa89b8e191c4f0259468f9a5"

async def main():
    print("Welcome to the Telethon Session Generator!")
    print("This will log you into Telegram securely and generate a session string.")
    print("You will need this string for GitHub Actions to run without a phone number.\n")
    
    # Using an empty StringSession forces an interactive login which is then serializable.
    client = TelegramClient(StringSession(), API_ID, API_HASH)
    
    await client.start()
    
    print("\n" + "="*50)
    print("LOGIN SUCCESSFUL!")
    print("Here is your TELEGRAM_SESSION string. Keep it secret!")
    print("="*50 + "\n")
    
    session_string = client.session.save()
    print(session_string)
    
    print("\n" + "="*50)
    print("Copy the string above and paste it securely into your GitHub Secrets or environment variables.")
    print("="*50 + "\n")
    
    # Validate connection quickly
    me = await client.get_me()
    print(f"Logged in as: {me.first_name} (@{me.username})")

if __name__ == "__main__":
    asyncio.run(main())
