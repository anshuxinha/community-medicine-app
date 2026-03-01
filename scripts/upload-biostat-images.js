const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');
const STORAGE_BUCKET = 'community-med-app.firebasestorage.app';

const IMAGES_TO_UPLOAD = {
    'types_of_data.png': 'C:\\Users\\Anshuman Sinha\\.gemini\\antigravity\\brain\\e90639b6-b3ae-4066-a776-c0a68217bc62\\media__1772340331434.png',
    'presentation_of_data.png': 'C:\\Users\\Anshuman Sinha\\.gemini\\antigravity\\brain\\e90639b6-b3ae-4066-a776-c0a68217bc62\\media__1772340331592.png',
    'normal_distribution.png': 'C:\\Users\\Anshuman Sinha\\.gemini\\antigravity\\brain\\e90639b6-b3ae-4066-a776-c0a68217bc62\\media__1772340331107.png',
    'hypothesis_testing_errors.jpg': 'C:\\Users\\Anshuman Sinha\\.gemini\\antigravity\\brain\\e90639b6-b3ae-4066-a776-c0a68217bc62\\media__1772340331630.jpg',
    'correlation_and_regression.png': 'C:\\Users\\Anshuman Sinha\\.gemini\\antigravity\\brain\\e90639b6-b3ae-4066-a776-c0a68217bc62\\media__1772340331256.png'
};

async function main() {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error('serviceAccountKey.json not found!');
        process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: STORAGE_BUCKET,
    });

    const bucket = admin.storage().bucket();
    const urlMap = {};

    console.log('Uploading biostat images to Firebase Storage...');

    for (const [filename, localPath] of Object.entries(IMAGES_TO_UPLOAD)) {
        if (!fs.existsSync(localPath)) {
            console.error(`Local file missing: ${localPath}`);
            continue;
        }

        const remotePath = `biostats/${filename}`;
        try {
            await bucket.upload(localPath, {
                destination: remotePath,
                metadata: {
                    contentType: filename.endsWith('.png') ? 'image/png' : 'image/jpeg',
                    cacheControl: 'public, max-age=31536000',
                },
            });

            const file = bucket.file(remotePath);
            await file.makePublic();
            const publicUrl = `https://storage.googleapis.com/${STORAGE_BUCKET}/${remotePath}`;
            urlMap[filename] = publicUrl;

            console.log(`Uploaded ${filename} -> ${publicUrl}`);
        } catch (err) {
            console.error(`Failed to upload ${filename}: ${err.message}`);
        }
    }

    console.log('\nURL_MAP_START');
    console.log(JSON.stringify(urlMap, null, 2));
    console.log('URL_MAP_END');
}

main().catch(err => {
    console.error('Script failed:', err.message);
    process.exit(1);
});
