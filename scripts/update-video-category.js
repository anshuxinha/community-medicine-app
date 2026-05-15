const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");

const main = async () => {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();
  const videoId = "aa4dfbcf-c958-40dc-8a82-bca32778421d";

  console.log(`Updating category for video ${videoId} to 'practicals'...`);
  
  await db.collection("videos").doc(videoId).update({
    category: "practicals",
    categoryLabel: "Practicals",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log("Update successful.");
};

main().catch(console.error);
