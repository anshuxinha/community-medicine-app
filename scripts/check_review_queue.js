/**
 * Quick check: list all documents in libraryReviewSuggestions.
 * Run: node scripts/check_review_queue.js
 */
const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
    projectId: 'community-med-app',
});

async function main() {
    const firestore = admin.firestore();
    const snapshot = await firestore.collection('libraryReviewSuggestions').get();

    if (snapshot.empty) {
        console.log('libraryReviewSuggestions collection is EMPTY — nothing was synced.');
    } else {
        console.log(`Found ${snapshot.size} document(s):\n`);
        snapshot.forEach(doc => {
            const d = doc.data();
            console.log(`  ID: ${doc.id}`);
            console.log(`    status:      ${d.status}`);
            console.log(`    title:       ${d.libraryTitle || '(none)'}`);
            console.log(`    generatedAt: ${d.generatedAt || '(none)'}`);
            console.log('');
        });
    }

    process.exit(0);
}

main().catch(err => { console.error(err.message); process.exit(1); });
