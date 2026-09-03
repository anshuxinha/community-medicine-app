const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');
const STORAGE_BUCKET = 'community-med-app.firebasestorage.app';
const LOCAL_IMAGE_DIR = path.join(__dirname, '..', 'reading-illustrations');

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: STORAGE_BUCKET,
    });
}
const db = admin.firestore();
const bucket = admin.storage().bucket();

const baseFiles = [
    // Chapter 31
    'ch31_1_demographic_transition_pyramid.png',
    'ch31_2_srs_dual_record_flowchart.png',
    'ch31_3_nfhs_indicators_dashboard.png',
    'ch31_4_disease_care_cascades.png',
    'ch31_5_nhp_continuum_aam_architecture.png',
    'ch31_6_health_information_systems_continuum.png',
    // Chapter 32
    'ch32_1_abdm_architecture.png',
    'ch32_2_ai_cad_screening_workflow.png',
    'ch32_3_idrone_logistics_model.png',
    'ch32_4_adult_immunization_framework.png',
    'ch32_5_biosafety_levels_bioterrorism.png',
    'ch32_6_nap_amr_aware_one_health.png',
    'ch32_7_gis_thematic_layers_buffering.png',
    'ch32_8_prisma_roc_geometry.png',
    'ch32_9_millers_pyramid_fap_timeline.png',
    'ch32_10_healthcare_ghg_scopes_green_hospital.png',
    'ch32_11_yellow_fever_ihr_decision_tree.png',
];

async function main() {
    console.log('[*] Step 1: Copying local files to _v2.png and uploading to Firebase Storage...');
    for (const baseFile of baseFiles) {
        const v2File = baseFile.replace('.png', '_v2.png');
        const srcPath = path.join(LOCAL_IMAGE_DIR, baseFile);
        const destPath = path.join(LOCAL_IMAGE_DIR, v2File);
        
        if (!fs.existsSync(srcPath)) {
            console.error(`[!] Missing source file: ${srcPath}`);
            continue;
        }
        
        fs.copyFileSync(srcPath, destPath);
        
        const remotePath = `reading-illustrations/${v2File}`;
        console.log(`Uploading ${v2File} to Firebase Storage...`);
        await bucket.upload(destPath, {
            destination: remotePath,
            metadata: {
                contentType: 'image/png',
                cacheControl: 'public, max-age=31536000',
            },
        });
        
        const file = bucket.file(remotePath);
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${STORAGE_BUCKET}/${remotePath}`;
        console.log(`[+] Uploaded: ${publicUrl}`);
    }

    console.log('\n[*] Step 2: Updating src/data/mockData.json with _v2 URLs...');
    const mockDataPath = path.join(__dirname, '..', 'src', 'data', 'mockData.json');
    let mockDataRaw = fs.readFileSync(mockDataPath, 'utf8');
    for (const baseFile of baseFiles) {
        const v2File = baseFile.replace('.png', '_v2.png');
        const oldPattern = new RegExp(`reading-illustrations/${baseFile}(?!_v2)`, 'g');
        mockDataRaw = mockDataRaw.replace(oldPattern, `reading-illustrations/${v2File}`);
    }
    fs.writeFileSync(mockDataPath, mockDataRaw, 'utf8');
    console.log('[+] mockData.json updated successfully.');

    console.log('\n[*] Step 3: Updating scratch/cleaned_ch_31.json and cleaned_ch_32.json...');
    const scratchDir = path.join('C:', 'Users', 'Anshuman Sinha', '.gemini', 'antigravity-cli', 'brain', 'db170b8d-46c5-4f68-8676-00564355e341', 'scratch');
    for (const chFile of ['cleaned_ch_31.json', 'cleaned_ch_32.json']) {
        const filePath = path.join(scratchDir, chFile);
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            for (const baseFile of baseFiles) {
                const v2File = baseFile.replace('.png', '_v2.png');
                const oldPattern = new RegExp(`reading-illustrations/${baseFile}(?!_v2)`, 'g');
                content = content.replace(oldPattern, `reading-illustrations/${v2File}`);
            }
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`[+] Updated ${chFile}`);
        }
    }

    console.log('\n[*] Step 4: Updating Firestore libraryContentOverrides for all 17 subsections...');
    const snap = await db.collection('libraryContentOverrides').get();
    let updatedCount = 0;
    
    for (const doc of snap.docs) {
        const id = doc.id;
        if (id.startsWith('31-') || id.startsWith('32-')) {
            const data = doc.data();
            let content = data.proposedContent || '';
            let changed = false;
            
            for (const baseFile of baseFiles) {
                const v2File = baseFile.replace('.png', '_v2.png');
                const oldPattern = new RegExp(`reading-illustrations/${baseFile}(?!_v2)`, 'g');
                if (oldPattern.test(content)) {
                    content = content.replace(oldPattern, `reading-illustrations/${v2File}`);
                    changed = true;
                }
            }
            
            if (changed) {
                await doc.ref.update({
                    proposedContent: content,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log(`[+] Updated Firestore override: ${id}`);
                updatedCount++;
            } else {
                console.log(`[-] No change needed for override: ${id}`);
            }
        }
    }
    console.log(`\n[*] Completed! Updated ${updatedCount} Firestore documents.`);
    process.exit(0);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
