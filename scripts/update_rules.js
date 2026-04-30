/**
 * Update Firestore rules — add admin read access to the users collection
 * for push notification broadcast.
 *
 * Run: node scripts/update_rules.js
 */
const admin = require('firebase-admin');
const path = require('path');

admin.initializeApp({
    credential: admin.credential.cert(require(path.join(__dirname, '..', 'serviceAccountKey.json'))),
    projectId: 'community-med-app',
});

const NEW_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Allow admin to list users for push token collection
      allow read: if request.auth != null && request.auth.token.isAdmin == true;

      match /highlights/{contentKey} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /annotations/{contentKey} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    match /libraryContentOverrides/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.isAdmin == true;
    }

    match /libraryReviewSuggestions/{docId} {
      allow read, write: if request.auth != null && request.auth.token.isAdmin == true;
    }

    match /libraryReviewMeta/{docId} {
      allow read: if request.auth != null && request.auth.token.isAdmin == true;
    }
  }
}`;

async function main() {
    const securityRules = admin.securityRules();

    console.log('Deploying updated Firestore rules...\n');
    console.log(NEW_RULES);
    console.log('');

    await securityRules.releaseFirestoreRulesetFromSource(NEW_RULES);
    console.log('✅  Firestore rules updated successfully!');
    process.exit(0);
}

main().catch(err => { console.error('❌  Failed:', err.message); process.exit(1); });
