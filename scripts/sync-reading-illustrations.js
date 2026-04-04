const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');
const STORAGE_BUCKET = 'community-med-app.firebasestorage.app';
const SEED_PATH = path.join(__dirname, '..', 'src', 'data', 'topicIllustrations.seed.json');
const LOCAL_IMAGE_DIR = path.join(__dirname, '..', 'reading-illustrations');

const parseArgs = () => {
    const options = {
        contentKeys: null,
        topicIds: null,
    };

    process.argv.slice(2).forEach((arg) => {
        if (arg.startsWith('--content-keys=')) {
            options.contentKeys = new Set(
                arg
                    .slice('--content-keys='.length)
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean)
            );
        }

        if (arg.startsWith('--topic-ids=')) {
            options.topicIds = new Set(
                arg
                    .slice('--topic-ids='.length)
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean)
            );
        }
    });

    return options;
};

const shouldSyncEntry = (entry, options) => {
    if (options.contentKeys && options.contentKeys.has(entry.contentKey)) {
        return true;
    }

    if (options.topicIds && options.topicIds.has(String(entry.topicId))) {
        return true;
    }

    return !options.contentKeys && !options.topicIds;
};

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
    const options = parseArgs();
    const db = admin.firestore();
    const bucket = admin.storage().bucket();
    const entriesToSync = seed.filter((entry) => shouldSyncEntry(entry, options));

    if (entriesToSync.length === 0) {
        throw new Error('No topic illustration entries matched the requested filter.');
    }

    console.log(`Syncing ${entriesToSync.length} topic illustration entr${entriesToSync.length === 1 ? 'y' : 'ies'}.`);

    for (const entry of entriesToSync) {
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
