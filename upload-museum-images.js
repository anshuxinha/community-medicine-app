/**
 * upload-museum-images.js
 * ───────────────────────────────────────────────────────────
 * Uploads all images from assets/museum/ to Firebase Storage,
 * gets their public download URLs, and patches museumData.js
 * automatically.
 *
 * HOW TO RUN (one-time setup):
 *  1. Go to https://console.firebase.google.com
 *  2. Project Settings (gear icon) → Service Accounts tab
 *  3. Click "Generate new private key" → save as:
 *       d:\The App\serviceAccountKey.json
 *  4. Then run:
 *       node upload-museum-images.js
 * ───────────────────────────────────────────────────────────
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'serviceAccountKey.json');
const MUSEUM_FOLDER = path.join(__dirname, 'assets', 'museum');
const MUSEUM_DATA_PATH = path.join(__dirname, 'src', 'data', 'museumData.js');
const STORAGE_BUCKET = 'community-med-app.firebasestorage.app';

// ── File → item ID mapping ────────────────────────────────
// Maps filename (without extension) to the item id in museumData.js
const FILE_TO_ID = {
    'kata_thermometer': '1',
    'chloroscope': '2',
    'horrocks_apparatus': '3',
    'sling_psychrometer': '4',
    'globe_thermometer': '5',
    'anopheles': '6',
    'culex': '7',
    'zn_stain': '8',
    'slow_sand_filter': '9',
    'soak_pit': '10',
};

// ── Main ─────────────────────────────────────────────────
async function main() {
    // Check service account key exists
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error('\n❌ serviceAccountKey.json not found!');
        console.error('   Download it from Firebase Console → Project Settings → Service Accounts');
        console.error(`   Save it as: ${SERVICE_ACCOUNT_PATH}\n`);
        process.exit(1);
    }

    // Initialize Firebase Admin
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: STORAGE_BUCKET,
    });

    const bucket = admin.storage().bucket();
    const urlMap = {}; // { itemId: downloadUrl }

    // Get all image files in the museum folder
    const files = fs.readdirSync(MUSEUM_FOLDER).filter(f =>
        /\.(png|jpg|jpeg|webp)$/i.test(f)
    );

    if (files.length === 0) {
        console.error(`\n❌ No images found in ${MUSEUM_FOLDER}\n`);
        process.exit(1);
    }

    console.log(`\n📤 Uploading ${files.length} images to Firebase Storage...\n`);

    for (const filename of files) {
        const nameWithoutExt = path.parse(filename).name;
        const itemId = FILE_TO_ID[nameWithoutExt];

        if (!itemId) {
            console.log(`  ⚠️  Skipping unknown file: ${filename}`);
            continue;
        }

        const localPath = path.join(MUSEUM_FOLDER, filename);
        const remotePath = `museum/${filename}`;

        try {
            // Upload
            await bucket.upload(localPath, {
                destination: remotePath,
                metadata: {
                    contentType: filename.endsWith('.png') ? 'image/png' : 'image/jpeg',
                    cacheControl: 'public, max-age=31536000', // cache for 1 year
                },
            });

            // Make it publicly readable and get URL
            const file = bucket.file(remotePath);
            await file.makePublic();
            const publicUrl = `https://storage.googleapis.com/${STORAGE_BUCKET}/${remotePath}`;
            urlMap[itemId] = publicUrl;

            console.log(`  ✅ ${filename} → item #${itemId}`);
        } catch (err) {
            console.error(`  ❌ Failed to upload ${filename}:`, err.message);
        }
    }

    console.log('\n🔗 All uploads complete. Patching museumData.js...\n');

    // ── Patch museumData.js ──────────────────────────────
    let dataContent = fs.readFileSync(MUSEUM_DATA_PATH, 'utf8');

    // For each uploaded item, replace `image: null` with the URL
    // Strategy: find the block with the matching id and replace its image field
    for (const [id, url] of Object.entries(urlMap)) {
        // Match the item block by id and replace only its image: null line
        // We look for `id: 'X'` followed (within ~500 chars) by `image: null`
        const idPattern = new RegExp(
            `(id:\\s*'${id}'[^}]{0,400}?image:\\s*)null`,
            's'
        );
        if (idPattern.test(dataContent)) {
            dataContent = dataContent.replace(idPattern, `$1'${url}'`);
            console.log(`  ✅ Patched item #${id}`);
        } else {
            console.log(`  ⚠️  Could not find null image for item #${id} — may already be set`);
        }
    }

    fs.writeFileSync(MUSEUM_DATA_PATH, dataContent, 'utf8');

    console.log('\n✅ museumData.js updated!');
    console.log('📦 Commit and push to get the new URLs into your next EAS build:\n');
    console.log('   git add src/data/museumData.js');
    console.log('   git commit -m "feat: museum images hosted on Firebase Storage"');
    console.log('   git push\n');
    console.log('🏛️  Done! Images will now load from the cloud.\n');
}

main().catch(err => {
    console.error('\n❌ Script failed:', err.message);
    process.exit(1);
});
