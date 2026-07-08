const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");
const STORAGE_BUCKET = "community-med-app.firebasestorage.app";
const LOCAL_PDF_PATH = "C:\\Users\\Anshuman Sinha\\Downloads\\Neonatal Tetanus.pdf";

const main = async () => {
  if (!fs.existsSync(LOCAL_PDF_PATH)) {
    throw new Error(`Local PDF file not found at: ${LOCAL_PDF_PATH}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: STORAGE_BUCKET,
  });

  const db = admin.firestore();
  
  // Find the latest video document
  console.log("Querying the latest video document from Firestore...");
  const snapshot = await db.collection("videos")
    .orderBy("publishedAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error("No videos found in Firestore. Cannot attach notes.");
  }

  const latestVideoDoc = snapshot.docs[0];
  const videoData = latestVideoDoc.data();
  const videoId = latestVideoDoc.id;
  console.log(`Latest video found: "${videoData.title}" (ID: ${videoId})`);

  // Clean remote path (avoid spaces in URL)
  const cleanFilename = path.basename(LOCAL_PDF_PATH).replace(/\s+/g, "_");
  const remotePath = `videos/notes/${cleanFilename}`;
  console.log(`Uploading PDF to Firebase Storage path: ${remotePath}...`);

  const bucket = admin.storage().bucket();
  await bucket.upload(LOCAL_PDF_PATH, {
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
    pdfName: path.basename(LOCAL_PDF_PATH), // Nice user-friendly display name
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("Update successful. Attached PDF as Notes to the latest video.");
};

main().catch((error) => {
  console.error("Error running script:", error);
  process.exit(1);
});
