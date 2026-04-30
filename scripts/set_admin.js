/**
 * set_admin.js
 * Finds all Firebase Auth users with the given email and sets isAdmin: true
 * on both their custom claims and Firestore user document.
 *
 * Run: node scripts/set_admin.js
 */

const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');
const ADMIN_EMAIL = 'anshuxinha@gmail.com';
const PROJECT_ID = 'community-med-app';

async function main() {
    let serviceAccount;
    try {
        serviceAccount = require(SERVICE_ACCOUNT_PATH);
    } catch {
        console.error('❌  serviceAccountKey.json not found at:', SERVICE_ACCOUNT_PATH);
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${PROJECT_ID}.firebaseio.com`,
        projectId: PROJECT_ID,
    });

    const auth = admin.auth();
    const firestore = admin.firestore();

    // Find all auth users with this email
    console.log(`\nLooking up all Auth users for ${ADMIN_EMAIL}...\n`);

    // getUserByEmail returns the primary user for that email
    let primaryUser;
    try {
        primaryUser = await auth.getUserByEmail(ADMIN_EMAIL);
    } catch (err) {
        console.error(`❌  No Auth user found for ${ADMIN_EMAIL}:`, err.message);
        process.exit(1);
    }

    console.log(`Found Auth user:`);
    console.log(`  UID:       ${primaryUser.uid}`);
    console.log(`  Email:     ${primaryUser.email}`);
    console.log(`  Providers: ${primaryUser.providerData.map(p => p.providerId).join(', ')}`);
    console.log(`  Display:   ${primaryUser.displayName || '(none)'}`);

    // Set custom claims
    await auth.setCustomUserClaims(primaryUser.uid, { isAdmin: true, isPremium: true });
    console.log(`\n✅  Custom claims set → { isAdmin: true, isPremium: true }`);

    // Set Firestore doc
    try {
        await firestore.collection('users').doc(primaryUser.uid).set(
            {
                isAdmin: true,
                isPremium: true,
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );
        console.log(`✅  Firestore users/${primaryUser.uid} → isAdmin: true, isPremium: true`);
    } catch (err) {
        console.error(`⚠️  Firestore write failed: ${err.message}`);
    }

    console.log('\n🎉  Done! Log out and log back in for the changes to take effect.');
    process.exit(0);
}

main().catch(err => {
    console.error('❌  Fatal:', err.message);
    process.exit(1);
});
