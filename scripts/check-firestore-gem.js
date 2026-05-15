const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");

const main = async () => {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error("Missing service account key");
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();
  const docId = "SECTION 3: VACCINES & COLD CHAIN__gem_2";
  const contentKey = "gems:section_3:gem_2";

  console.log("Checking docId:", docId);
  const docRef = db.collection("topicIllustrations").doc(docId);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    console.log("Document found by docId!");
    console.log(JSON.stringify(docSnap.data(), null, 2));
  } else {
    console.log("Document NOT found by docId.");
  }

  console.log("Checking contentKey:", contentKey);
  const querySnap = await db.collection("topicIllustrations")
    .where("contentKey", "==", contentKey)
    .limit(1)
    .get();

  if (!querySnap.empty) {
    console.log("Document found by contentKey!");
    console.log(JSON.stringify(querySnap.docs[0].data(), null, 2));
  } else {
    console.log("Document NOT found by contentKey.");
  }
};

main().catch(console.error);
