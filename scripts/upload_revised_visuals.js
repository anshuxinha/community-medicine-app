const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');
const STORAGE_BUCKET = 'community-med-app.firebasestorage.app';
const LOCAL_IMAGE_DIR = path.join(__dirname, '..', 'reading-illustrations');

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: STORAGE_BUCKET,
});
const bucket = app.storage().bucket();

const revisedFiles = [
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
    console.log(`[*] Uploading ${revisedFiles.length} revised illustrations to Firebase Storage...`);
    for (const fileName of revisedFiles) {
        const localPath = path.join(LOCAL_IMAGE_DIR, fileName);
        const remotePath = `reading-illustrations/${fileName}`;
        
        if (!fs.existsSync(localPath)) {
            console.error(`[!] Missing file: ${localPath}`);
            continue;
        }

        console.log(`Uploading ${fileName}...`);
        await bucket.upload(localPath, {
            destination: remotePath,
            metadata: {
                contentType: 'image/png',
                cacheControl: 'public, max-age=31536000',
            },
        });

        const file = bucket.file(remotePath);
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${STORAGE_BUCKET}/${remotePath}`;
        console.log(`[+] Uploaded & Verified Public: ${publicUrl}`);
    }
    console.log('[*] All 17 revised assets uploaded successfully!');
}

main().catch(err => {
    console.error('Error uploading:', err);
    process.exit(1);
});
