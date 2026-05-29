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
  console.log("Searching for users with debug_11_3_timestamp...");
  const snap = await db.collection("users").orderBy("debug_11_3_timestamp", "desc").limit(5).get();

  if (snap.empty) {
    console.log("No debug info found in users collection.");
    return;
  }

  snap.forEach(doc => {
    const data = doc.data();
    console.log(`\n======================================================`);
    console.log(`User UID: ${doc.id}`);
    console.log(`Email: ${data.email || "N/A"}`);
    console.log(`Timestamp: ${data.debug_11_3_timestamp}`);
    console.log(`Timestamp Blocks: ${data.debug_11_3_timestamp_blocks}`);
    console.log(`Content Snippet:\n[${data.debug_11_3_content || "N/A"}]`);
    const parsedBlocks = data.debug_11_3_blocks ? JSON.parse(data.debug_11_3_blocks) : null;
    console.log(`Parsed Blocks:\n${parsedBlocks ? JSON.stringify(parsedBlocks, null, 2) : "N/A"}`);
    if (parsedBlocks) {
      const bulletsBlock = parsedBlocks.find(b => b.type === "bullets");
      if (bulletsBlock && bulletsBlock.items && bulletsBlock.items[0]) {
        const firstBullet = bulletsBlock.items[0];
        console.log(`\nFirst Bullet Character Codes:`);
        for (let i = 0; i < firstBullet.length; i++) {
          console.log(`Char at index ${i}: '${firstBullet[i]}' (code: ${firstBullet.charCodeAt(i)})`);
        }
      }
    }
    console.log(`======================================================\n`);
  });
};

main().catch(console.error);

