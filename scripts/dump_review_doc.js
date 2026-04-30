/**
 * Dump full field names of one review suggestion to check schema.
 * Run: node scripts/dump_review_doc.js
 */
const admin = require('firebase-admin');
const path = require('path');

admin.initializeApp({
    credential: admin.credential.cert(require(path.join(__dirname, '..', 'serviceAccountKey.json'))),
    projectId: 'community-med-app',
});

async function main() {
    const snapshot = await admin.firestore()
        .collection('libraryReviewSuggestions')
        .limit(1)
        .get();

    if (snapshot.empty) {
        console.log('No documents.');
    } else {
        const doc = snapshot.docs[0];
        console.log(`Document ID: ${doc.id}`);
        console.log('Fields:', JSON.stringify(Object.keys(doc.data()), null, 2));
        const d = doc.data();
        // Print a few key fields with their types
        console.log('\nKey field types:');
        console.log(`  status: ${typeof d.status} = "${d.status}"`);
        console.log(`  proposalId: ${typeof d.proposalId} = "${d.proposalId}"`);
        console.log(`  libraryTitle: ${typeof d.libraryTitle} = "${d.libraryTitle}"`);
        console.log(`  generatedAt: ${typeof d.generatedAt} = "${d.generatedAt}"`);
        console.log(`  changes type: ${Array.isArray(d.changes) ? 'array' : typeof d.changes}, length: ${Array.isArray(d.changes) ? d.changes.length : 'N/A'}`);
    }

    process.exit(0);
}

main().catch(err => { console.error(err.message); process.exit(1); });
