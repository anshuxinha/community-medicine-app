/**
 * Upload assets/pyq_images/*.jpg to Firebase Storage at pyq-images/.
 * Makes each object public. The app builds URLs from the filename.
 *
 *   node scripts/upload-pyq-images.js
 */
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SERVICE_ACCOUNT_PATH = path.join(ROOT, "serviceAccountKey.json");
const LOCAL_DIR = path.join(ROOT, "assets", "pyq_images");
const STORAGE_BUCKET = "community-med-app.firebasestorage.app";
const REMOTE_PREFIX = "pyq-images";

async function main() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error("serviceAccountKey.json not found at project root.");
    process.exit(1);
  }

  const files = fs
    .readdirSync(LOCAL_DIR)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort();

  if (files.length === 0) {
    console.error(`No images in ${LOCAL_DIR}`);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"),
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: STORAGE_BUCKET,
  });

  const bucket = admin.storage().bucket();
  const urls = [];
  let failed = 0;

  console.log(`Uploading ${files.length} PYQ images to ${REMOTE_PREFIX}/...\n`);

  for (const filename of files) {
    const localPath = path.join(LOCAL_DIR, filename);
    const remotePath = `${REMOTE_PREFIX}/${filename}`;
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

    try {
      await bucket.upload(localPath, {
        destination: remotePath,
        metadata: {
          contentType,
          cacheControl: "public, max-age=31536000",
        },
      });
      const file = bucket.file(remotePath);
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${STORAGE_BUCKET}/${remotePath}`;
      urls.push(publicUrl);
      console.log(`  ok  ${filename}`);
    } catch (err) {
      failed += 1;
      console.error(`  fail  ${filename}: ${err.message}`);
    }
  }

  console.log(`\nDone. ${urls.length} uploaded, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Script failed:", err.message);
  process.exit(1);
});
