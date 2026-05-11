const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { loadImage } = require("canvas");

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");
const STORAGE_BUCKET = "community-med-app.firebasestorage.app";
const GEMS_DATA_PATH = path.join(__dirname, "..", "src", "data", "gemsData.json");
const LOCAL_IMAGE_DIR = "D:\\Stroma Files\\Images\\Gems";

const GEM_IMAGE_ENTRIES = [
  {
    sectionId: "section_2",
    gemId: "gem_2",
    images: [
      {
        id: "gem_ors",
        fileName: "ors.png",
        sourceFileName: "ors.png",
        alt: "Packets of oral rehydration salt",
        anchorText: "What are the constituents?",
        placement: "before",
      },
    ],
  },
  {
    sectionId: "section_3",
    gemId: "gem_2",
    images: [
      {
        id: "gem_shake_test_1",
        fileName: "shake_test_1.png",
        sourceFileName: "Shake test 1.png",
        alt: "Shake test visual interpretation step 1",
        anchorText: "(Tip to remember in Shake test:",
        placement: "before",
      },
      {
        id: "gem_shake_test_2",
        fileName: "shake_test_2.png",
        sourceFileName: "Shake test 2.png",
        alt: "Shake test visual interpretation step 2",
        anchorText: "(Tip to remember in Shake test:",
        placement: "before",
      },
      {
        id: "gem_shake_test_3",
        fileName: "shake_test_3.png",
        sourceFileName: "Shake test 3.png",
        alt: "Shake test visual interpretation step 3",
        anchorText: "(Tip to remember in Shake test:",
        placement: "before",
      },
    ],
  },
  {
    sectionId: "section_4",
    gemId: "gem_1",
    images: [
      {
        id: "gem_figure_6_1",
        fileName: "figure_6_1.png",
        sourceFileName: "Figure 6.1.png",
        alt: "Mosquito identification figure 6.1",
        anchorText: "Identification features of Anopheles adult:",
        placement: "before",
      },
      {
        id: "gem_figure_6_2",
        fileName: "figure_6_2.png",
        sourceFileName: "Figure 6.2.png",
        alt: "Mosquito identification figure 6.2",
        anchorText: "Identification features of Anopheles adult:",
        placement: "before",
      },
      {
        id: "gem_figure_6_3",
        fileName: "figure_6_3.png",
        sourceFileName: "Figure 6.3.png",
        alt: "Mosquito identification figure 6.3",
        anchorText: "Identification features of Anopheles adult:",
        placement: "before",
      },
    ],
  },
  {
    sectionId: "section_6",
    gemId: "gem_2",
    images: [
      {
        id: "gem_horrocks_apparatus",
        fileName: "ha.png",
        sourceFileName: "ha.png",
        alt: "Horrock's apparatus",
        anchorText: "HORROCK",
        placement: "after",
      },
    ],
  },
];

const ensureFirebaseApp = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error(`Missing service account key at ${SERVICE_ACCOUNT_PATH}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: STORAGE_BUCKET,
  });
};

const loadGemsData = () => JSON.parse(fs.readFileSync(GEMS_DATA_PATH, "utf8"));

const getImageMetadata = async (localPath) => {
  const image = await loadImage(localPath);
  return {
    aspectRatio: image.width && image.height ? image.width / image.height : 1,
  };
};

const uploadImage = async (bucket, image) => {
  const localPath = path.join(LOCAL_IMAGE_DIR, image.sourceFileName);
  if (!fs.existsSync(localPath)) {
    throw new Error(`Local gem image missing: ${localPath}`);
  }

  const remotePath = `gems/${image.fileName}`;
  await bucket.upload(localPath, {
    destination: remotePath,
    metadata: {
      contentType: "image/png",
      cacheControl: "public, max-age=31536000",
    },
  });

  const file = bucket.file(remotePath);
  await file.makePublic();
  const metadata = await getImageMetadata(localPath);

  return {
    id: image.id,
    alt: image.alt,
    caption: "",
    purpose: "",
    anchorText: image.anchorText,
    placement: image.placement,
    aspectRatio: metadata.aspectRatio,
    storagePath: remotePath,
    url: `https://storage.googleapis.com/${STORAGE_BUCKET}/${remotePath}`,
  };
};

async function main() {
  ensureFirebaseApp();
  const db = admin.firestore();
  const bucket = admin.storage().bucket();
  const gemsData = loadGemsData();

  for (const entry of GEM_IMAGE_ENTRIES) {
    const section = gemsData.find((candidate) => candidate.id === entry.sectionId);
    const gem = section?.gems.find((candidate) => candidate.id === entry.gemId);
    if (!section || !gem) {
      throw new Error(`Unable to find gem entry ${entry.sectionId}/${entry.gemId}`);
    }

    const images = [];
    for (const image of entry.images) {
      images.push(await uploadImage(bucket, image));
    }

    const docId = `${section.title}__${gem.id}`;
    await db.collection("topicIllustrations").doc(docId).set(
      {
        contentKey: `gems:${section.id}:${gem.id}`,
        section: section.title,
        topicId: gem.id,
        topicTitle: gem.title,
        status: "active",
        images,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    console.log(`Synced ${docId} with ${images.length} image(s).`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
