const dns = require('dns');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

dns.setDefaultResultOrder('ipv4first');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');
const STORAGE_BUCKET = 'community-med-app.firebasestorage.app';
const LOCAL_IMAGE_DIR = path.join(__dirname, '..', 'reading-illustrations');
const RAW_DIR = path.join(LOCAL_IMAGE_DIR, 'raw');
const SEED_PATH = path.join(__dirname, '..', 'src', 'data', 'topicIllustrations.seed.json');

const IMAGE_FIELDS_TO_REWRITE = new Set(['url', 'storagePath', 'fileName']);

const toV2 = (fileName) => {
    if (fileName.endsWith('_v2.png')) {
        return fileName;
    }
    return fileName.replace(/\.png$/i, '_v2.png');
};

const rewriteExactFilenames = (value, baseFiles) => {
    if (typeof value !== 'string' || !value) {
        return { value, changed: false };
    }

    let next = value;
    for (const base of baseFiles) {
        if (next.includes(base)) {
            next = next.split(base).join(toV2(base));
        }
    }

    return { value: next, changed: next !== value };
};

const loadBaseFiles = () => {
    const files = fs.readdirSync(RAW_DIR)
        .filter((name) => name.toLowerCase().endsWith('.png'))
        .sort();

    if (files.length !== 62) {
        throw new Error(`Expected 62 raw images, found ${files.length}`);
    }

    for (const fileName of files) {
        const compressedPath = path.join(LOCAL_IMAGE_DIR, fileName);
        if (!fs.existsSync(compressedPath)) {
            throw new Error(`Compressed image missing: ${compressedPath}`);
        }
    }

    return files;
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const remoteFileMatches = async (bucket, remotePath, localPath) => {
    try {
        const file = bucket.file(remotePath);
        const [exists] = await file.exists();
        if (!exists) {
            return false;
        }
        const [metadata] = await file.getMetadata();
        const remoteSize = Number(metadata.size || 0);
        const localSize = fs.statSync(localPath).size;
        return remoteSize === localSize && remoteSize > 0;
    } catch (error) {
        console.warn(`  exists-check failed for ${remotePath}: ${error.code || ''} ${error.message}`);
        return false;
    }
};

const uploadWithRetry = async (bucket, localPath, remotePath, attempts = 6) => {
    const buffer = fs.readFileSync(localPath);
    let lastError = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const file = bucket.file(remotePath);
            await file.save(buffer, {
                resumable: false,
                public: true,
                timeout: 120000,
                metadata: {
                    contentType: 'image/png',
                    cacheControl: 'public, max-age=31536000',
                },
                validation: 'crc32c',
            });
            return;
        } catch (error) {
            lastError = error;
            const delayMs = 4000 * attempt;
            console.warn(`  retry ${attempt}/${attempts} for ${remotePath}: ${error.code || ''} ${error.message}`);
            await sleep(delayMs);
        }
    }
    throw lastError;
};

const copyAndUpload = async (bucket, baseFiles, wave = 1) => {
    const cacheBuster = Date.now();
    const uploaded = [];
    const failed = [];

    for (const [index, baseFile] of baseFiles.entries()) {
        const v2File = toV2(baseFile);
        const srcPath = path.join(LOCAL_IMAGE_DIR, baseFile);
        const destPath = path.join(LOCAL_IMAGE_DIR, v2File);
        fs.copyFileSync(srcPath, destPath);

        const remotePath = `reading-illustrations/${v2File}`;
        try {
            if (await remoteFileMatches(bucket, remotePath, destPath)) {
                console.log(`[wave ${wave} ${index + 1}/${baseFiles.length}] Skip existing ${v2File}`);
            } else {
                console.log(`[wave ${wave} ${index + 1}/${baseFiles.length}] Uploading ${v2File}...`);
                await uploadWithRetry(bucket, destPath, remotePath);
            }
            uploaded.push({
                baseFile,
                v2File,
                remotePath,
                url: `https://storage.googleapis.com/${STORAGE_BUCKET}/${remotePath}?v=${cacheBuster}`,
            });
        } catch (error) {
            failed.push({ baseFile, v2File, message: error.message });
            console.error(`[!] Failed ${v2File}: ${error.message}`);
        }
        await sleep(800);
    }

    if (failed.length) {
        if (wave >= 8) {
            throw new Error(`Upload incomplete after ${wave} waves: ${failed.map((item) => item.v2File).join(', ')}`);
        }
        console.warn(`[*] Wave ${wave} incomplete: ${failed.length} file(s). Waiting 20s then retrying...`);
        await sleep(20000);
        const retried = await copyAndUpload(bucket, failed.map((item) => item.baseFile), wave + 1);
        uploaded.push(...retried);
    }

    return uploaded;
};

const rewriteImageRecord = (image, baseFiles) => {
    if (!image || typeof image !== 'object') {
        return { image, changed: false };
    }

    const next = { ...image };
    let changed = false;

    for (const field of IMAGE_FIELDS_TO_REWRITE) {
        const rewritten = rewriteExactFilenames(next[field], baseFiles);
        if (rewritten.changed) {
            next[field] = rewritten.value;
            changed = true;
        }
    }

    if (typeof next.url === 'string' && changed) {
        const urlWithoutQuery = next.url.split('?')[0];
        next.url = `${urlWithoutQuery}?v=${Date.now()}`;
    }

    return { image: next, changed };
};

const updateTopicIllustrations = async (db, baseFiles) => {
    const snap = await db.collection('topicIllustrations').get();
    let updatedDocs = 0;
    let updatedImages = 0;
    const hits = [];

    for (const doc of snap.docs) {
        const data = doc.data();
        const images = Array.isArray(data.images) ? data.images : [];
        let docChanged = false;
        const nextImages = images.map((image) => {
            const rewritten = rewriteImageRecord(image, baseFiles);
            if (rewritten.changed) {
                docChanged = true;
                updatedImages += 1;
            }
            return rewritten.image;
        });

        if (!docChanged) {
            continue;
        }

        await doc.ref.update({
            images: nextImages,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        updatedDocs += 1;
        hits.push({
            id: doc.id,
            contentKey: data.contentKey || null,
            images: nextImages
                .filter((image) => IMAGE_FIELDS_TO_REWRITE.has('url') && typeof image.url === 'string')
                .filter((image) => (image.url || '').includes('_v2.png'))
                .map((image) => ({
                    id: image.id || null,
                    caption: image.caption || '',
                    placement: image.placement || '',
                    url: image.url,
                    storagePath: image.storagePath || null,
                })),
        });
        console.log(`[+] topicIllustrations ${doc.id}`);
    }

    return { scanned: snap.size, updatedDocs, updatedImages, hits };
};

const updateLibraryOverrides = async (db, baseFiles) => {
    const snap = await db.collection('libraryContentOverrides').get();
    let updatedDocs = 0;
    const hits = [];

    for (const doc of snap.docs) {
        const data = doc.data();
        const content = data.proposedContent;
        const rewritten = rewriteExactFilenames(content, baseFiles);
        if (!rewritten.changed) {
            continue;
        }

        await doc.ref.update({
            proposedContent: rewritten.value,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        updatedDocs += 1;
        hits.push(doc.id);
        console.log(`[+] libraryContentOverrides ${doc.id}`);
    }

    return { scanned: snap.size, updatedDocs, hits };
};

const updateSeed = (baseFiles) => {
    const seedRaw = fs.readFileSync(SEED_PATH, 'utf8');
    const rewritten = rewriteExactFilenames(seedRaw, baseFiles);
    if (!rewritten.changed) {
        console.log('[-] topicIllustrations.seed.json already uses _v2 names');
        return { changed: false, count: 0 };
    }

    fs.writeFileSync(SEED_PATH, rewritten.value, 'utf8');
    const count = baseFiles.filter((base) => seedRaw.includes(`"fileName": "${base}"`)).length;
    console.log(`[+] topicIllustrations.seed.json fileName updates: ${count}`);
    return { changed: true, count };
};

const verify = async (db, baseFiles) => {
    const snap = await db.collection('topicIllustrations').get();
    const leftover = [];
    const v2Hits = [];

    for (const doc of snap.docs) {
        const images = Array.isArray(doc.data().images) ? doc.data().images : [];
        for (const image of images) {
            const blob = `${image.url || ''}\n${image.storagePath || ''}\n${image.fileName || ''}`;
            for (const base of baseFiles) {
                if (blob.includes(base) && !blob.includes(toV2(base))) {
                    leftover.push({
                        docId: doc.id,
                        imageId: image.id || null,
                        base,
                    });
                }
                if ((image.url || '').includes(toV2(base))) {
                    v2Hits.push({
                        docId: doc.id,
                        imageId: image.id || null,
                        captionUnchanged: typeof image.caption === 'string',
                        placement: image.placement,
                        url: image.url,
                    });
                }
            }
        }
    }

    return { leftover, v2Count: v2Hits.length };
};

async function main() {
    const baseFiles = loadBaseFiles();
    console.log(`[*] ${baseFiles.length} compressed images from ${path.basename(RAW_DIR)}/`);

    ensureFirebaseApp();
    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    console.log('\n[*] Step 1: Upload compressed files as _v2.png');
    const uploaded = await copyAndUpload(bucket, baseFiles);
    console.log(`[+] Uploaded ${uploaded.length} files`);

    console.log('\n[*] Step 2: Patch topicIllustrations URLs/storagePaths/fileNames');
    const topicResult = await updateTopicIllustrations(db, baseFiles);
    console.log(`[+] topicIllustrations scanned=${topicResult.scanned} docs=${topicResult.updatedDocs} images=${topicResult.updatedImages}`);

    console.log('\n[*] Step 3: Patch libraryContentOverrides proposedContent if those filenames appear');
    const overrideResult = await updateLibraryOverrides(db, baseFiles);
    console.log(`[+] libraryContentOverrides scanned=${overrideResult.scanned} docs=${overrideResult.updatedDocs}`);
    if (overrideResult.hits.length) {
        console.log(`    ${overrideResult.hits.join(', ')}`);
    }

    console.log('\n[*] Step 4: Patch seed fileNames');
    const seedResult = updateSeed(baseFiles);

    console.log('\n[*] Step 5: Verify no leftover non-v2 URLs for this set');
    const verification = await verify(db, baseFiles);
    console.log(`[+] Firestore images now on _v2: ${verification.v2Count}`);
    if (verification.leftover.length) {
        console.error('[!] Leftover non-v2 references:');
        console.error(JSON.stringify(verification.leftover, null, 2));
        process.exit(1);
    }

    const reportPath = path.join(__dirname, '..', 'scratch', 'ch2-ch17-v2-deploy-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(
        reportPath,
        JSON.stringify(
            {
                uploaded: uploaded.length,
                topicIllustrations: {
                    scanned: topicResult.scanned,
                    updatedDocs: topicResult.updatedDocs,
                    updatedImages: topicResult.updatedImages,
                },
                libraryContentOverrides: overrideResult,
                seed: seedResult,
                sample: topicResult.hits.slice(0, 5),
            },
            null,
            2
        ),
        'utf8'
    );
    console.log(`\n[*] Report: ${reportPath}`);
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
