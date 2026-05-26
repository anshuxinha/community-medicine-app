const admin = require("firebase-admin");
const path = require("path");

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "serviceAccountKey.json");
const PROJECT_ID = "community-med-app";

async function main() {
  let serviceAccount;
  try {
    serviceAccount = require(SERVICE_ACCOUNT_PATH);
  } catch (err) {
    console.error("serviceAccountKey.json not found:", err.message);
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${PROJECT_ID}.firebaseio.com`,
    projectId: PROJECT_ID,
  });

  const firestore = admin.firestore();
  console.log("Fetching videoDoubts...");
  const snapshot = await firestore.collection("videoDoubts").get();
  console.log(`Found ${snapshot.size} doubts:`);
  
  snapshot.forEach(doc => {
    console.log(`\nDocument ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
  
  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
