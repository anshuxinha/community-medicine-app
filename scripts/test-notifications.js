const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const main = async () => {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();
  
  // Get all tokens
  const snapshot = await db.collection("users").get();
  const tokens = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.pushToken) tokens.push(data.pushToken);
  });

  console.log(`Found ${tokens.length} tokens. Sending test notification...`);

  const messages = tokens.map(token => ({
    to: token,
    sound: "default",
    title: "Test Notification",
    body: "If you see this, notifications are working!",
    channelId: "default",
    data: { screen: "Videos" }
  }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages.slice(0, 100)), // Limit to first 100 for test
  });

  const result = await response.json();
  console.log("Expo response:", JSON.stringify(result, null, 2));
};

main().catch(console.error);
