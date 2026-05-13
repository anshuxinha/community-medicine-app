const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');
const PROJECT_ID = 'community-med-app';

/**
 * Firestore Illustration Metadata Validation Script
 * 
 * Checks the 'topicIllustrations' collection for data quality issues:
 * 1. Presence of contentKey (required for resilient fetching)
 * 2. Presence of images array
 * 3. Each image has a url or fileName
 * 4. specifically for Gems, presence of url is preferred (D-04)
 */

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  let serviceAccount;
  try {
    serviceAccount = require(SERVICE_ACCOUNT_PATH);
  } catch (err) {
    console.error('serviceAccountKey.json not found at ' + SERVICE_ACCOUNT_PATH);
    console.log('Skipping validation as service account is missing.');
    process.exit(0);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
  });

  const db = admin.firestore();
  const COLLECTION_NAME = 'topicIllustrations';

  console.log(`Starting validation for collection: ${COLLECTION_NAME}`);
  if (isDryRun) {
    console.log('Running in DRY-RUN mode (report only).');
  }
  
  try {
    const snapshot = await db.collection(COLLECTION_NAME).get();
    console.log(`Found ${snapshot.size} documents.`);

    let issuesCount = 0;
    let docCount = 0;
    let totalImages = 0;

    snapshot.forEach(doc => {
      docCount++;
      const data = doc.data();
      const id = doc.id;
      const images = data.images;
      const contentKey = data.contentKey;
      const isGem = contentKey && contentKey.startsWith('gems:');

      const errors = [];

      if (!contentKey) {
        errors.push('Missing contentKey (critical for fallback)');
      }

      if (!images) {
        errors.push('Missing images array');
      } else if (!Array.isArray(images)) {
        errors.push('images is not an array');
      } else if (images.length === 0) {
        // Not necessarily an error, but noted
        // console.log(`[INFO] Document ${id} has empty images array.`);
      } else {
        totalImages += images.length;
        images.forEach((img, index) => {
          if (!img.url && !img.fileName) {
            errors.push(`Image ${index} missing both url and fileName`);
          }
          
          // D-04: Gems preferred to have valid url fields
          if (isGem && !img.url) {
            errors.push(`Gem image ${index} missing explicit url (will fall back to fileName guess)`);
          }

          if (!img.id && !img.anchorText) {
             errors.push(`Image ${index} missing both id and anchorText (merge/placement will fail)`);
          }
        });
      }

      if (errors.length > 0) {
        issuesCount++;
        console.log(`[ISSUE] Document ${id} (${contentKey || 'no-key'}):`);
        errors.forEach(err => console.log(`  - ${err}`));
      }
    });

    console.log('\n--- Validation Summary ---');
    console.log(`Total documents scanned: ${docCount}`);
    console.log(`Total images found: ${totalImages}`);
    console.log(`Documents with issues: ${issuesCount}`);
    console.log('--------------------------');

    if (issuesCount > 0) {
      console.log('Result: Data quality check FAILED.');
      // If we were to use this in a CI pipeline, we might exit with 1
      // process.exit(1);
    } else {
      console.log('Result: Data quality check PASSED.');
    }

  } catch (error) {
    console.error('Error fetching documents:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
