const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');
const STORAGE_BUCKET = 'community-med-app.firebasestorage.app';
const SEED_PATH = path.join(__dirname, '..', 'src', 'data', 'topicIllustrations.seed.json');
const LOCAL_IMAGE_DIR = path.join(__dirname, '..', 'assets', 'reading-illustrations');

const ensureFirebaseApp = () => {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        throw new Error(`Missing service account key at ${SERVICE_ACCOUNT_PATH}`);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: STORAGE_BUCKET,
    });
};

const loadSeed = () => JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));

const uploadIfNeeded = async (bucket, image) => {
    if (!image.fileName) {
        return {
            ...image,
            storagePath: image.storagePath || null,
            url: image.url || null,
        };
    }

    const localPath = path.join(LOCAL_IMAGE_DIR, image.fileName);
    if (!fs.existsSync(localPath)) {
        throw new Error(`Local illustration missing: ${localPath}`);
    }

    const remotePath = `reading-illustrations/${image.fileName}`;
    await bucket.upload(localPath, {
        destination: remotePath,
        metadata: {
            contentType: 'image/png',
            cacheControl: 'public, max-age=31536000',
        },
    });

    const file = bucket.file(remotePath);
    await file.makePublic();

    return {
        ...image,
        storagePath: remotePath,
        url: `https://storage.googleapis.com/${STORAGE_BUCKET}/${remotePath}`,
    };
};

async function main() {
    ensureFirebaseApp();
    const seed = loadSeed();
    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    for (const entry of seed) {
        const docId = `${entry.section}__${entry.topicId}`;
        const syncedImages = [];

        for (const image of entry.images || []) {
            const synced = await uploadIfNeeded(bucket, image);
            syncedImages.push({
                id: synced.id,
                alt: synced.alt,
                caption: synced.caption,
                purpose: synced.purpose,
                anchorText: synced.anchorText,
                placement: synced.placement,
                aspectRatio: synced.aspectRatio,
                storagePath: synced.storagePath || null,
                url: synced.url,
            });
        }

        await db.collection('topicIllustrations').doc(docId).set({
            contentKey: entry.contentKey,
            section: entry.section,
            topicId: entry.topicId,
            topicTitle: entry.topicTitle,
            status: 'active',
            images: syncedImages,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log(`Synced ${docId} with ${syncedImages.length} image(s)`);
    }

    console.log('Topic illustrations synced to Firestore and Storage.');
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
