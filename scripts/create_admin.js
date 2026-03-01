/**
 * create_admin.js  (v3 — uses Admin SDK + Firestore Admin bypass)
 * ─────────────────────────────────────────────────────────────────
 * Creates / updates anshuxinha@gmail.com as an admin user.
 *
 * The Firebase Admin SDK bypasses Firestore security rules by design.
 * If you still get PERMISSION_DENIED, your service account is missing
 * the "Cloud Datastore User" IAM role in GCP (see instructions below).
 *
 * Run: node scripts/create_admin.js
 * ─────────────────────────────────────────────────────────────────
 */

const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');
const ADMIN_EMAIL = 'anshuxinha@gmail.com';
const ADMIN_PASSWORD = 'Stroma@2025';
const PROJECT_ID = 'community-med-app';

async function main() {
    // ── Load service account ──────────────────────────────────────
    let serviceAccount;
    try {
        serviceAccount = require(SERVICE_ACCOUNT_PATH);
    } catch {
        console.error('❌  serviceAccountKey.json not found at:', SERVICE_ACCOUNT_PATH);
        process.exit(1);
    }

    // Explicitly pass databaseURL and projectId to help SDK resolve Firestore endpoint
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${PROJECT_ID}.firebaseio.com`,
        projectId: PROJECT_ID,
    });

    const auth = admin.auth();
    const firestore = admin.firestore();


    // ── Create or fetch Auth user ─────────────────────────────────
    let uid;
    try {
        const existing = await auth.getUserByEmail(ADMIN_EMAIL);
        uid = existing.uid;
        console.log(`✅  Auth user already exists  uid=${uid}`);
    } catch (err) {
        if (err.code === 'auth/user-not-found') {
            const newUser = await auth.createUser({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                displayName: 'Anshuman Sinha',
                emailVerified: true,
            });
            uid = newUser.uid;
            console.log(`✅  Auth user created  uid=${uid}`);
        } else {
            throw err;
        }
    }

    // ── Set custom claims (works with Auth-only service account role) ─
    await auth.setCustomUserClaims(uid, { isAdmin: true, isPremium: true });
    console.log(`✅  Custom claims → { isAdmin: true, isPremium: true }`);

    // ── Write Firestore doc (Admin SDK bypasses security rules) ────
    try {
        await firestore.collection('users').doc(uid).set(
            {
                email: ADMIN_EMAIL,
                username: 'Anshuman Sinha',
                isPremium: true,
                isAdmin: true,
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );
        console.log(`✅  Firestore users/${uid} → isPremium: true, isAdmin: true`);
    } catch (err) {
        console.error(`\n⚠️   Firestore write still failing: ${err.message}`);
        console.error('\n    FIX: Grant your service account the "Cloud Datastore User" role in GCP IAM:');
        console.error(`    https://console.cloud.google.com/iam-admin/iam?project=${PROJECT_ID}`);
        console.error(`    Service account email: ${serviceAccount.client_email}`);
        console.error('\n    Custom claims ARE set — login will work. isAdmin/isPremium will be read from the Auth token.');
        // Don't exit 1 — custom claims succeeded
    }

    console.log('\n🎉  Done!');
    console.log(`    Email   : ${ADMIN_EMAIL}`);
    console.log(`    Password: ${ADMIN_PASSWORD}  ← change after first login`);
    console.log(`    uid     : ${uid}`);
    process.exit(0);
}

main().catch(err => {
    console.error('❌  Fatal:', err.message);
    process.exit(1);
});
