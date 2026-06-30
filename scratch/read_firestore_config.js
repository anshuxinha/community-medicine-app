const admin = require("firebase-admin");
const path = require("path");

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");
const PROJECT_ID = "community-med-app";

async function main() {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  const credential = admin.credential.cert(serviceAccount);

  admin.initializeApp({
    credential,
    databaseURL: `https://${PROJECT_ID}.firebaseio.com`,
    projectId: PROJECT_ID,
  });

  const firestore = admin.firestore();
  const configDocRef = firestore.collection("config").doc("app");
  const docSnap = await configDocRef.get();

  if (docSnap.exists) {
    console.log("Firestore config/app data:");
    console.log(JSON.stringify(docSnap.data(), null, 2));
  } else {
    console.log("Firestore config/app document does not exist!");
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
});
