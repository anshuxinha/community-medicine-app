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
        console.error('serviceAccountKey.json not found');
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
        console.log(`User found: ${uid}`);
    } catch (err) {
        console.error('User not found');
        process.exit(1);
    }

    try {
        await firestore.collection('users').doc(uid).update({
            devices: []
        });
        console.log('Devices array set to empty successfully.');
    } catch (err) {
        console.error(err.message);
    }

    // Also get the document, find deviceStates and delete those fields
    try {
        const docSnap = await firestore.collection('users').doc(uid).get();
        if (docSnap.exists) {
            const data = docSnap.data();
            const updateObj = {};
            if (data.deviceStates) {
                for (const key of Object.keys(data.deviceStates)) {
                    updateObj[`deviceStates.${key}`] = admin.firestore.FieldValue.delete();
                }
                if (Object.keys(updateObj).length > 0) {
                    await firestore.collection('users').doc(uid).update(updateObj);
                    console.log('Cleared deviceStates fields.');
                }
            }
        }
    } catch(err) {
        console.error('error clearing deviceStates', err.message);
    }

    process.exit(0);
}

main();
