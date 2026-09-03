const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
    const snap = await db.collection('libraryContentOverrides').get();
    console.log('Total documents in libraryContentOverrides:', snap.size);
    const ch31_32_docs = [];
    snap.forEach(doc => {
        const id = doc.id;
        if (id.startsWith('31') || id.startsWith('32')) {
            const data = doc.data();
            ch31_32_docs.push({
                id: doc.id,
                libraryId: data.libraryId,
                status: data.status,
                hasProposedContent: Boolean(data.proposedContent),
                contentLength: (data.proposedContent || '').length,
                images: (data.proposedContent || '').match(/!\[.*?\]\(.*?\)/g) || []
            });
        }
    });
    console.log('Found Chapter 31 & 32 overrides:', ch31_32_docs.length);
    ch31_32_docs.forEach(d => {
        console.log(`\nDoc: ${d.id} (libraryId: ${d.libraryId}, status: ${d.status}, len: ${d.contentLength})`);
        d.images.forEach(img => console.log('  Image:', img));
    });
    process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
