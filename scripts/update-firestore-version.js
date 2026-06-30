const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");
const PROJECT_ID = "community-med-app";

// Simple argument parser
const args = process.argv.slice(2);
const getArgValue = (flag) => {
  const index = args.findIndex(arg => arg === flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return null;
};

const { execSync } = require("child_process");

const getCommitMessage = () => {
  try {
    return execSync("git log -1 --pretty=%B", { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
};

const notes = getArgValue("--notes") || getArgValue("-n") || getCommitMessage();
const size = getArgValue("--size") || getArgValue("-s");
const isDryRun = args.includes("--dry-run");

async function main() {
  // Read app.json
  let appJson;
  try {
    appJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "app.json"), "utf8"));
  } catch (err) {
    console.error("❌ Failed to read app.json:", err.message);
    process.exit(1);
  }

  const version = appJson.expo?.version;
  const iosBuild = appJson.expo?.ios?.buildNumber;
  const androidBuild = appJson.expo?.android?.versionCode;

  if (!version || !iosBuild || androidBuild === undefined) {
    console.error("❌ Missing required fields in app.json (version, buildNumber, or versionCode)");
    process.exit(1);
  }

  console.log("⚙️ App.json configuration detected:");
  console.log(`   Version: ${version}`);
  console.log(`   iOS Build Number: ${iosBuild}`);
  console.log(`   Android Version Code: ${androidBuild}`);

  if (isDryRun) {
    console.log("\n⚠️ Running in DRY RUN mode. No database changes will be made.");
  }

  // Initialize Firebase
  let credential;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      credential = admin.credential.cert(JSON.parse(serviceAccountJson));
    } catch (e) {
      console.warn("⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON env var:", e.message);
    }
  }

  if (!credential) {
    try {
      const serviceAccount = require(SERVICE_ACCOUNT_PATH);
      credential = admin.credential.cert(serviceAccount);
    } catch {
      console.error("❌ serviceAccountKey.json not found at:", SERVICE_ACCOUNT_PATH);
      console.log("👉 Please make sure serviceAccountKey.json exists or FIREBASE_SERVICE_ACCOUNT_JSON is set.");
      process.exit(1);
    }
  }

  admin.initializeApp({
    credential,
    databaseURL: `https://${PROJECT_ID}.firebaseio.com`,
    projectId: PROJECT_ID,
  });

  const firestore = admin.firestore();
  const configDocRef = firestore.collection("config").doc("app");

  try {
    const updateData = {
      latest_ios_version: version,
      latest_ios_build: String(iosBuild),
      latest_android_version: version,
      latest_android_build: String(androidBuild),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (notes) {
      updateData.update_notes = notes;
    }
    if (size) {
      updateData.update_size = size;
    }

    console.log("\n📤 Data to write to config/app:");
    console.log(JSON.stringify(updateData, null, 2));

    if (!isDryRun) {
      await configDocRef.set(updateData, { merge: true });
      console.log("\n✅ Firestore config/app document updated successfully!");
    } else {
      console.log("\n✅ Dry run completed (no database write performed).");
    }
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Failed to update Firestore: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal:", err.message);
  process.exit(1);
});
