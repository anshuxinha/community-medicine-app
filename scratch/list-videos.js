const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error("Missing service account key at " + SERVICE_ACCOUNT_PATH);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function listVideos() {
  const snapshot = await db.collection("videos").get();
  const videos = [];
  snapshot.forEach(doc => {
    videos.push({ id: doc.id, ...doc.data() });
  });
  console.log(JSON.stringify(videos, null, 2));
}

listVideos().catch(console.error);
