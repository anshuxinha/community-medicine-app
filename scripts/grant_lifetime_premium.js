/**
 * grant_lifetime_premium.js
 * ─────────────────────────────────────────────────────────────────
 * Grants lifetime premium access to a specified user by email.
 *
 * This script:
 * 1. Finds the user by email in Firebase Auth
 * 2. Sets custom claim isPremium: true
 * 3. Updates Firestore users/{uid} document with isPremium: true
 *
 * Usage: node scripts/grant_lifetime_premium.js [email]
 * Example: node scripts/grant_lifetime_premium.js user@example.com
 *
 * If no email is provided, it defaults to anshuxinha@gmail.com
 * ─────────────────────────────────────────────────────────────────
 */

const admin = require("firebase-admin");
const path = require("path");

const SERVICE_ACCOUNT_PATH = path.join(
  __dirname,
  "..",
  "serviceAccountKey.json",
);
const PROJECT_ID = "community-med-app";

// Default email or pass as command line argument
const TARGET_EMAIL = process.argv[2] || "anshuxinha@gmail.com";

async function main() {
  console.log(`🎯 Target email: ${TARGET_EMAIL}`);

  // ── Load service account ──────────────────────────────────────
  let serviceAccount;
  try {
    serviceAccount = require(SERVICE_ACCOUNT_PATH);
  } catch {
    console.error(
      "❌  serviceAccountKey.json not found at:",
      SERVICE_ACCOUNT_PATH,
    );
    console.error(
      "   Please add your Firebase service account key to the project root.",
    );
    process.exit(1);
  }

  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${PROJECT_ID}.firebaseio.com`,
    projectId: PROJECT_ID,
  });

  const auth = admin.auth();
  const firestore = admin.firestore();

  // ── Find user by email ────────────────────────────────────────
  let uid;
  try {
    const existing = await auth.getUserByEmail(TARGET_EMAIL);
    uid = existing.uid;
    console.log(`✅  Auth user found  uid=${uid}`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      console.error(`❌  No user found with email: ${TARGET_EMAIL}`);
      console.error("   Please create the account first in the app.");
      process.exit(1);
    } else {
      throw err;
    }
  }

  // ── Set custom claims ─────────────────────────────────────────
  await auth.setCustomUserClaims(uid, { isPremium: true });
  console.log(`✅  Custom claims set → { isPremium: true }`);

  // ── Update Firestore document ─────────────────────────────────
  try {
    await firestore.collection("users").doc(uid).set(
      {
        email: TARGET_EMAIL,
        isPremium: true,
        premiumType: "lifetime",
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    console.log(
      `✅  Firestore users/${uid} → isPremium: true, premiumType: lifetime`,
    );
  } catch (err) {
    console.error(`\n⚠️   Firestore write failed: ${err.message}`);
    console.error(
      "\n    Custom claims ARE set — the user will have premium access via Auth token.",
    );
    console.error(
      '    To fix Firestore writes, grant your service account "Cloud Datastore User" IAM role:',
    );
    console.error(
      `    https://console.cloud.google.com/iam-admin/iam?project=${PROJECT_ID}`,
    );
  }

  console.log("\n🎉  Lifetime premium granted!");
  console.log(`    Email: ${TARGET_EMAIL}`);
  console.log(`    uid  : ${uid}`);
  console.log(
    "\n    Note: The user may need to log out and log back in for the",
  );
  console.log("    custom claims to take effect on their next session.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌  Fatal:", err.message);
  process.exit(1);
});
