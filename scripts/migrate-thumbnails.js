const admin = require("firebase-admin");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");
const BUNNY_API_BASE = "https://video.bunnycdn.com";

const requireConfig = () => {
  const apiKey = process.env.BUNNY_STREAM_API_KEY || process.env.BUNNY_API_KEY;
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;

  if (!apiKey) {
    throw new Error("Missing BUNNY_STREAM_API_KEY in .env.");
  }
  if (!libraryId) {
    throw new Error("Missing BUNNY_STREAM_LIBRARY_ID in .env.");
  }

  return {
    apiKey,
    libraryId,
    pullZoneHostname: process.env.BUNNY_STREAM_PULL_ZONE_HOSTNAME || "",
  };
};

const ensureFirebaseApp = () => {
  if (admin.apps.length > 0) return admin.app();

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error(`Missing service account key at ${SERVICE_ACCOUNT_PATH}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};

const discoverPullZoneHostname = async (config, videoId) => {
  const embedUrl = `https://player.mediadelivery.net/embed/${config.libraryId}/${videoId}`;
  try {
    const response = await fetch(embedUrl);
    if (!response.ok) return "";

    const html = await response.text();
    const match = html.match(
      new RegExp(`https://([^/"'\\s<>]+)/${videoId}/thumbnail.jpg`),
    );
    return match?.[1] || "";
  } catch (error) {
    console.error(`Error discovering pull zone for ${videoId}:`, error.message);
    return "";
  }
};

async function main() {
  const config = requireConfig();
  ensureFirebaseApp();
  const db = admin.firestore();

  const snapshot = await db.collection("videos").get();
  console.log(`Found ${snapshot.size} videos in Firestore.`);

  for (const doc of snapshot.docs) {
    const video = doc.data();
    const videoId = doc.id; // The doc ID is the Bunny Video GUID

    console.log(`\n--------------------------------------------`);
    console.log(`Processing: "${video.title}" (${videoId})`);

    let pullZone = config.pullZoneHostname;
    if (!pullZone) {
      pullZone = await discoverPullZoneHostname(config, videoId);
    }

    if (!pullZone) {
      console.warn(`Could not determine pull zone hostname for video ${videoId}. Skipping.`);
      continue;
    }

    const playlistUrl = `https://${pullZone}/${videoId}/playlist.m3u8`;
    const tempOutPath = path.join(__dirname, `temp_${videoId}.jpg`);

    console.log(`Playlist URL: ${playlistUrl}`);
    console.log(`Extracting frame at 1s...`);

    try {
      await new Promise((resolve, reject) => {
        ffmpeg(playlistUrl)
          .inputOptions("-headers", "Referer: https://player.mediadelivery.net/\r\n")
          .seekInput(1.0) // Seek to 1 second
          .frames(1)
          .output(tempOutPath)
          .on("end", () => {
            resolve();
          })
          .on("error", (err) => {
            reject(err);
          })
          .run();
      });

      console.log(`Frame extracted successfully to temp file. Uploading to Bunny Stream...`);

      const fileBuffer = fs.readFileSync(tempOutPath);
      const uploadUrl = `${BUNNY_API_BASE}/library/${config.libraryId}/videos/${videoId}/thumbnail`;

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          AccessKey: config.apiKey,
          "Content-Type": "application/octet-stream",
        },
        body: fileBuffer,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Bunny API error: ${response.status} - ${body}`);
      }

      console.log(`Successfully updated thumbnail on Bunny Stream for "${video.title}"!`);

      // Clean up local temp file
      if (fs.existsSync(tempOutPath)) {
        fs.unlinkSync(tempOutPath);
      }
    } catch (err) {
      console.error(`Failed to process video "${video.title}":`, err.message);
      if (fs.existsSync(tempOutPath)) {
        fs.unlinkSync(tempOutPath);
      }
    }
  }

  console.log(`\nMigration complete. Re-syncing videos to Firestore...`);
  // Spawn the sync command dynamically
  const { execSync } = require("child_process");
  try {
    execSync("node scripts/bunny-videos.js sync", { stdio: "inherit" });
    console.log("Firestore database successfully synchronized.");
  } catch (error) {
    console.error("Failed to run sync script automatically:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
