const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const SERVICE_ACCOUNT_PATH = path.join(
  __dirname,
  "..",
  "serviceAccountKey.json",
);
const STORAGE_BUCKET = "community-med-app.firebasestorage.app";

const ILLUSTRATIONS_DIR = path.join(__dirname, "..", "reading-illustrations");

const NHP_IMAGES = [
  "nhm_pm_ssm_overview.png",
  "rmncahn_interventions.png",
  "jsy_cash_assistance.png",
  "laqshya_certification.png",
  "suman_color_cards.png",
  "stree_sampoorna_lactation.png",
  "fru_criteria.png",
  "child_health_initiatives.png",
  "ujjwala_scheme.png",
  "nlep_leprosy.png",
  "ntep_tb_algorithm.png",
  "nacb_aids.png",
  "nacb_treatment.png",
  "npcb_blindness.png",
  "npcb_categories.png",
  "niddcp_iodine.png",
  "uip_immunization.png",
  "np_ncd.png",
  "np_ncd_mpower.png",
  "nmhp_mental_health.png",
  "idsp_surveillance.png",
  "iq_classification.png",
  "ayushman_bharat.png",
];

async function main() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error("serviceAccountKey.json not found!");
    process.exit(1);
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"),
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: STORAGE_BUCKET,
  });

  const bucket = admin.storage().bucket();
  const urlMap = {};

  console.log("Uploading NHP logo images to Firebase Storage...");

  for (const filename of NHP_IMAGES) {
    const localPath = path.join(ILLUSTRATIONS_DIR, filename);
    if (!fs.existsSync(localPath)) {
      console.error(`File not found: ${localPath}`);
      continue;
    }

    const remotePath = `reading-illustrations/${filename}`;
    try {
      await bucket.upload(localPath, {
        destination: remotePath,
        metadata: {
          contentType: filename.endsWith(".png") ? "image/png" : "image/jpeg",
          cacheControl: "public, max-age=31536000",
        },
      });

      const file = bucket.file(remotePath);
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${STORAGE_BUCKET}/${remotePath}`;
      urlMap[filename] = publicUrl;

      console.log(`Uploaded ${filename} -> ${publicUrl}`);
    } catch (err) {
      console.error(`Failed to upload ${filename}: ${err.message}`);
    }
  }

  console.log("\nURL_MAP_START");
  console.log(JSON.stringify(urlMap, null, 2));
  console.log("URL_MAP_END");
}

main().catch((err) => {
  console.error("Script failed:", err.message);
  process.exit(1);
});
