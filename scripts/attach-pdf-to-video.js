/**
 * Attach a local PDF as Notes on a video document in Firestore.
 *
 * Usage:
 *   node scripts/attach-pdf-to-video.js --file="D:\path\to\notes.pdf"
 *   node scripts/attach-pdf-to-video.js --file="D:\path\to\notes.pdf" --id=<bunnyVideoId>
 *
 * Without --id, attaches to the latest video by publishedAt.
 */
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");
const STORAGE_BUCKET = "community-med-app.firebasestorage.app";

const parseArgs = () => {
  const options = {};
  process.argv.slice(2).forEach((arg) => {
    if (!arg.startsWith("--")) return;
    const [key, ...valueParts] = arg.slice(2).split("=");
    options[key] = valueParts.length ? valueParts.join("=") : true;
  });
  return options;
};

const main = async () => {
  const options = parseArgs();
  const localPdfPath = options.file || options.pdf;

  if (!localPdfPath || typeof localPdfPath !== "string") {
    throw new Error(
      'Missing PDF path. Use --file="D:\\path\\to\\notes.pdf"',
    );
  }

  if (!fs.existsSync(localPdfPath)) {
    throw new Error(`Local PDF file not found at: ${localPdfPath}`);
  }

  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: STORAGE_BUCKET,
    });
  }

  const db = admin.firestore();
  let videoId = options.id || options.videoId || options["video-id"] || null;
  let videoData;

  if (videoId) {
    console.log(`Looking up video by id: ${videoId}...`);
    const snapshot = await db.collection("videos").doc(videoId).get();
    if (!snapshot.exists) {
      throw new Error(`Video ${videoId} not found in Firestore.`);
    }
    videoData = snapshot.data();
  } else {
    console.log("Querying the latest video document from Firestore...");
    const snapshot = await db
      .collection("videos")
      .orderBy("publishedAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error("No videos found in Firestore. Cannot attach notes.");
    }

    const latestVideoDoc = snapshot.docs[0];
    videoId = latestVideoDoc.id;
    videoData = latestVideoDoc.data();
  }

  console.log(`Target video: "${videoData.title}" (ID: ${videoId})`);

  const cleanFilename = path.basename(localPdfPath).replace(/\s+/g, "_");
  const remotePath = `videos/notes/${cleanFilename}`;
  console.log(`Uploading PDF to Firebase Storage path: ${remotePath}...`);

  const bucket = admin.storage().bucket();
  await bucket.upload(localPdfPath, {
    destination: remotePath,
    metadata: {
      contentType: "application/pdf",
      cacheControl: "public, max-age=31536000",
    },
  });

  const file = bucket.file(remotePath);
  console.log("Making the uploaded file public...");
  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${STORAGE_BUCKET}/${remotePath}`;
  console.log(`Uploaded successfully. Public URL: ${publicUrl}`);

  console.log(`Updating video document "${videoData.title}" in Firestore...`);
  await db.collection("videos").doc(videoId).update({
    hasPdf: true,
    pdfUrl: publicUrl,
    pdfName: path.basename(localPdfPath),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(
    JSON.stringify({
      ok: true,
      videoId,
      title: videoData.title,
      pdfName: path.basename(localPdfPath),
      pdfUrl: publicUrl,
    }),
  );
  console.log("Update successful. Attached PDF as Notes to the video.");
};

main().catch((error) => {
  console.error("Error running script:", error.message || error);
  process.exit(1);
});
