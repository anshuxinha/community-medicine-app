/**
 * create_emulator_admin.js
 * ─────────────────────────────────────────────────────────────────
 * Creates / updates a dedicated admin account for emulator & automated testing:
 *   Email:    emulator.admin@stroma.app
 *   Password: AdminPassword@2026
 * ─────────────────────────────────────────────────────────────────
 */

const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');
const ADMIN_EMAIL = 'emulator.admin@stroma.app';
const ADMIN_PASSWORD = 'AdminPassword@2026';
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

    let uid;
    try {
        const existing = await auth.getUserByEmail(ADMIN_EMAIL);
        uid = existing.uid;
        console.log(`✅  Auth user already exists  uid=${uid}`);
        // Ensure password is updated
        await auth.updateUser(uid, {
            password: ADMIN_PASSWORD,
            emailVerified: true,
            displayName: 'Emulator Admin',
        });
        console.log(`✅  Updated password and profile for uid=${uid}`);
    } catch (err) {
        if (err.code === 'auth/user-not-found') {
            const newUser = await auth.createUser({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                displayName: 'Emulator Admin',
                emailVerified: true,
            });
            uid = newUser.uid;
            console.log(`✅  Auth user created  uid=${uid}`);
        } else {
            throw err;
        }
    }

    // Set custom claims
    await auth.setCustomUserClaims(uid, { isAdmin: true, isPremium: true });
    console.log(`✅  Custom claims → { isAdmin: true, isPremium: true }`);

    // Write Firestore user document
    try {
        await firestore.collection('users').doc(uid).set(
            {
                email: ADMIN_EMAIL,
                username: 'Emulator Admin',
                isPremium: true,
                isAdmin: true,
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );
        console.log(`✅  Firestore users/${uid} → isPremium: true, isAdmin: true`);
    } catch (err) {
        console.error(`⚠️  Firestore write error: ${err.message}`);
    }

    console.log('\n🎉  Dedicated Emulator Admin Ready!');
    console.log(`    Email   : ${ADMIN_EMAIL}`);
    console.log(`    Password: ${ADMIN_PASSWORD}`);
    console.log(`    UID     : ${uid}`);
    process.exit(0);
}

main().catch(err => {
    console.error('❌  Fatal:', err.message);
    process.exit(1);
});
