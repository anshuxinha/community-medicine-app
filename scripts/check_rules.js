/**
 * Fetch current Firestore security rules.
 * Run: node scripts/check_rules.js
 */
const admin = require('firebase-admin');
const path = require('path');

admin.initializeApp({
    credential: admin.credential.cert(require(path.join(__dirname, '..', 'serviceAccountKey.json'))),
    projectId: 'community-med-app',
});

async function main() {
    const securityRules = admin.securityRules();

    const ruleset = await securityRules.getFirestoreRuleset();
    console.log('Current Firestore rules:\n');
    for (const source of ruleset.source) {
        console.log(source.content);
    }
    process.exit(0);
}

main().catch(err => { console.error(err.message); process.exit(1); });
