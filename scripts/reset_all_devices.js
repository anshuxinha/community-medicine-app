const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.resolve(__dirname, "..", "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function resetAllDevices() {
  const usersSnapshot = await db.collection("users").get();
  let resetCount = 0;

  for (const userDoc of usersSnapshot.docs) {
    const data = userDoc.data();
    if (data.devices && data.devices.length > 0) {
      await userDoc.ref.update({
        devices: [],
        deviceStates: admin.firestore.FieldValue.delete(),
      });
      resetCount++;
      console.log(`Reset devices for user: ${userDoc.id} (had ${data.devices.length} device(s))`);
    }
  }

  console.log(`\nDone. Reset ${resetCount} account(s) out of ${usersSnapshot.size} total.`);
  process.exit(0);
}

resetAllDevices().catch((err) => {
  console.error("Error resetting devices:", err);
  process.exit(1);
});
