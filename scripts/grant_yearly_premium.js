/**
 * grant_yearly_premium.js
 * ─────────────────────────────────────────────────────────────────
 * Grants yearly premium access to a specified user by email.
 *
 * This script:
 * 1. Finds the user by email in Firebase Auth
 * 2. Sets custom claim isPremium: true
 * 3. Updates Firestore users/{uid} document with:
 *    isPremium: true, premiumType: "yearly", premiumExpiryDate: "2027-04-28T15:44:23Z"
 *
 * Usage: node scripts/grant_yearly_premium.js [email] [expiryDate]
 * ─────────────────────────────────────────────────────────────────
 */

const admin = require("firebase-admin");
const path = require("path");

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");
const PROJECT_ID = "community-med-app";
const TARGET_EMAIL = process.argv[2] || "prashansajaiswal19@gmail.com";
const EXPIRY_DATE = process.argv[3] || "2027-04-28T15:44:23Z";

async function main() {
  console.log(`🎯 Target email: ${TARGET_EMAIL}`);
  console.log(`📅 Expiry date: ${EXPIRY_DATE}`);

  let serviceAccount;
  try {
    serviceAccount = require(SERVICE_ACCOUNT_PATH);
  } catch {
    console.error("❌ serviceAccountKey.json not found at:", SERVICE_ACCOUNT_PATH);
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${PROJECT_ID}.firebaseio.com`,
    projectId: PROJECT_ID,
  });

  const auth = admin.auth();
  const firestore = admin.firestore();

  // 1. Find user by email
  let uid;
  try {
    const existing = await auth.getUserByEmail(TARGET_EMAIL);
    uid = existing.uid;
    console.log(`✅ Auth user found uid=${uid}`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      console.error(`❌ No user found with email: ${TARGET_EMAIL}`);
      process.exit(1);
    } else {
      throw err;
    }
  }

  // 2. Set custom claims
  await auth.setCustomUserClaims(uid, { isPremium: true });
  console.log(`✅ Custom claims set → { isPremium: true }`);

  // 3. Update Firestore document
  try {
    await firestore.collection("users").doc(uid).set(
      {
        email: TARGET_EMAIL,
        isPremium: true,
        premiumType: "yearly",
        premiumExpiryDate: EXPIRY_DATE,
        premiumUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    console.log(`✅ Firestore users/${uid} → isPremium: true, premiumType: yearly, premiumExpiryDate: ${EXPIRY_DATE}`);
  } catch (err) {
    console.error(`❌ Firestore write failed: ${err.message}`);
  }

  console.log("\n🎉 Yearly premium granted successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal:", err.message);
  process.exit(1);
});
