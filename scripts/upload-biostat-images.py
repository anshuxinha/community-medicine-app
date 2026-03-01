import firebase_admin
from firebase_admin import credentials, storage
import os
import json

SERVICE_ACCOUNT_PATH = os.path.join(os.path.dirname(__file__), '..', 'serviceAccountKey.json')
STORAGE_BUCKET = 'community-med-app.firebasestorage.app'

IMAGES_TO_UPLOAD = {
    'types_of_data.png': r'C:\Users\Anshuman Sinha\.gemini\antigravity\brain\e90639b6-b3ae-4066-a776-c0a68217bc62\media__1772340331434.png',
    'presentation_of_data.png': r'C:\Users\Anshuman Sinha\.gemini\antigravity\brain\e90639b6-b3ae-4066-a776-c0a68217bc62\media__1772340331592.png',
    'normal_distribution.png': r'C:\Users\Anshuman Sinha\.gemini\antigravity\brain\e90639b6-b3ae-4066-a776-c0a68217bc62\media__1772340331107.png',
    'hypothesis_testing_errors.jpg': r'C:\Users\Anshuman Sinha\.gemini\antigravity\brain\e90639b6-b3ae-4066-a776-c0a68217bc62\media__1772340331630.jpg',
    'correlation_and_regression.png': r'C:\Users\Anshuman Sinha\.gemini\antigravity\brain\e90639b6-b3ae-4066-a776-c0a68217bc62\media__1772340331256.png'
}

def main():
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print("serviceAccountKey.json not found!")
        return

    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred, {
        'storageBucket': STORAGE_BUCKET
    })

    bucket = storage.bucket()
    url_map = {}

    print('Uploading biostat images to Firebase Storage...')

    for filename, local_path in IMAGES_TO_UPLOAD.items():
        if not os.path.exists(local_path):
            print(f'Local file missing: {local_path}')
            continue

        remote_path = f'biostats/{filename}'
        blob = bucket.blob(remote_path)
        
        content_type = 'image/png' if filename.endswith('.png') else 'image/jpeg'
        blob.upload_from_filename(local_path, content_type=content_type)
        blob.make_public()
        
        public_url = blob.public_url
        url_map[filename] = public_url
        print(f'Uploaded {filename} -> {public_url}')

    print('\nURL_MAP_START')
    print(json.dumps(url_map, indent=2))
    print('URL_MAP_END')

if __name__ == '__main__':
    main()
