const admin = require("firebase-admin");
const dotenv = require("dotenv");
const fs = require("fs");
const https = require("https");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BUNNY_API_BASE = "https://video.bunnycdn.com";

const parseArgs = () => {
  const [command = "sync", ...rawArgs] = process.argv.slice(2);
  const options = { command, tags: [] };

  rawArgs.forEach((arg) => {
    if (!arg.startsWith("--")) return;
    const [key, ...valueParts] = arg.slice(2).split("=");
    const value = valueParts.join("=");
    options[key] = value || true;
  });

  if (typeof options.tags === "string") {
    options.tags = options.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return options;
};

const requireConfig = () => {
  const apiKey = process.env.BUNNY_STREAM_API_KEY || process.env.BUNNY_API_KEY;
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;

  if (!apiKey) {
    throw new Error("Missing BUNNY_STREAM_API_KEY in .env.");
  }

  if (!libraryId) {
    throw new Error(
      "Missing BUNNY_STREAM_LIBRARY_ID in .env. Bunny Stream uploads require the numeric library ID.",
    );
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

const bunnyFetch = async (config, pathname, options = {}) => {
  const response = await fetch(`${BUNNY_API_BASE}${pathname}`, {
    ...options,
    headers: {
      AccessKey: config.apiKey,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Bunny API ${response.status}: ${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

const uploadBinaryToBunny = (config, videoId, filePath) =>
  new Promise((resolve, reject) => {
    const stat = fs.statSync(filePath);
    const request = https.request(
      {
        method: "PUT",
        hostname: "video.bunnycdn.com",
        path: `/library/${config.libraryId}/videos/${videoId}`,
        headers: {
          AccessKey: config.apiKey,
          "Content-Type": "application/octet-stream",
          "Content-Length": stat.size,
        },
      },
      (response) => {
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(body ? JSON.parse(body) : {});
            return;
          }
          reject(new Error(`Bunny upload ${response.statusCode}: ${body}`));
        });
      },
    );

    request.on("error", reject);
    fs.createReadStream(filePath).pipe(request);
  });

const buildThumbnailUrl = (config, video) => {
  if (!config.pullZoneHostname || !video.guid) return null;
  const hostname = config.pullZoneHostname.replace(/^https?:\/\//, "");
  const thumbnail = video.thumbnailFileName || "thumbnail.jpg";
  return `https://${hostname}/${video.guid}/${thumbnail}`;
};

const toVideoDoc = (config, video, options = {}, existing = {}) => {
  const now = new Date().toISOString();
  const title = options.title || video.title || existing.title || "Untitled video";
  const category = options.category || existing.category || "lectures";

  return {
    bunnyVideoId: video.guid,
    libraryId: String(config.libraryId),
    title,
    description: options.description || existing.description || "",
    category,
    categoryLabel: options.categoryLabel || existing.categoryLabel || "Lectures",
    tags: options.tags || existing.tags || [],
    duration: Number(video.length || video.duration || existing.duration || 0),
    status: String(video.status ?? existing.status ?? "processing"),
    thumbnailUrl: buildThumbnailUrl(config, video) || existing.thumbnailUrl || null,
    embedUrl: video.guid
      ? `https://iframe.mediadelivery.net/embed/${config.libraryId}/${video.guid}`
      : existing.embedUrl || null,
    publishedAt: existing.publishedAt || video.dateUploaded || now,
    createdAt: existing.createdAt || video.dateUploaded || now,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    source: "bunny",
  };
};

const upsertVideoDoc = async (db, config, video, options = {}) => {
  const docRef = db.collection("videos").doc(video.guid);
  const snapshot = await docRef.get();
  const existing = snapshot.exists ? snapshot.data() : {};
  const payload = toVideoDoc(config, video, options, existing);

  await docRef.set(payload, { merge: true });

  return {
    id: video.guid,
    isNew: !snapshot.exists,
    wasNotified: Boolean(existing.notifiedAt),
    payload,
  };
};

const getExpoPushTokens = async (db) => {
  const snapshot = await db.collection("users").get();
  const tokens = [];

  snapshot.forEach((userDoc) => {
    const data = userDoc.data();
    const token = data.pushToken;
    const wantsVideos = data.videoNotificationsEnabled !== false;

    if (
      wantsVideos &&
      typeof token === "string" &&
      (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["))
    ) {
      tokens.push(token);
    }
  });

  return [...new Set(tokens)];
};

const sendVideoPushNotification = async (db, video) => {
  const tokens = await getExpoPushTokens(db);
  if (tokens.length === 0) return 0;

  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title: "New Video Available",
    body: video.description ? `${video.title} - ${video.description}` : video.title,
    data: { screen: "Videos", type: "video", videoId: video.bunnyVideoId },
  }));

  for (let index = 0; index < messages.length; index += 100) {
    const chunk = messages.slice(index, index + 100);
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chunk),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Expo push ${response.status}: ${body}`);
    }
  }

  return tokens.length;
};

const markNotified = async (db, videoId) => {
  await db.collection("videos").doc(videoId).set(
    {
      notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
};

const uploadVideo = async (db, config, options) => {
  if (!options.file) {
    throw new Error("Upload requires --file=path/to/video.mp4.");
  }

  const filePath = path.resolve(process.cwd(), options.file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Video file not found: ${filePath}`);
  }

  const title = options.title || path.basename(filePath, path.extname(filePath));
  const createdVideo = await bunnyFetch(config, `/library/${config.libraryId}/videos`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });

  await uploadBinaryToBunny(config, createdVideo.guid, filePath);

  const result = await upsertVideoDoc(db, config, createdVideo, {
    title,
    description: options.description || "",
    category: options.category || "lectures",
    categoryLabel: options["category-label"] || "Lectures",
    tags: options.tags || [],
  });

  const notifiedCount = await sendVideoPushNotification(db, result.payload);
  await markNotified(db, result.id);

  console.log(`Uploaded ${title} to Bunny Stream.`);
  console.log(`Synced Firestore document videos/${result.id}.`);
  console.log(`Sent ${notifiedCount} Expo push notification(s).`);
};

const syncVideos = async (db, config, options) => {
  const notifyNew = options["notify-new"] === true || options["notify-new"] === "true";
  let page = 1;
  let syncedCount = 0;
  let notifiedCount = 0;

  while (true) {
    const response = await bunnyFetch(
      config,
      `/library/${config.libraryId}/videos?page=${page}&itemsPerPage=100`,
    );
    const items = Array.isArray(response?.items) ? response.items : [];
    if (items.length === 0) break;

    for (const video of items) {
      const result = await upsertVideoDoc(db, config, video);
      syncedCount += 1;

      if (notifyNew && result.isNew && !result.wasNotified) {
        notifiedCount += await sendVideoPushNotification(db, result.payload);
        await markNotified(db, result.id);
      }
    }

    if (items.length < 100) break;
    page += 1;
  }

  console.log(`Synced ${syncedCount} Bunny video(s) to Firestore.`);
  if (notifyNew) {
    console.log(`Sent ${notifiedCount} Expo push notification(s).`);
  }
};

async function main() {
  const options = parseArgs();
  const config = requireConfig();
  ensureFirebaseApp();
  const db = admin.firestore();

  if (options.command === "upload") {
    await uploadVideo(db, config, options);
    return;
  }

  if (options.command === "sync") {
    await syncVideos(db, config, options);
    return;
  }

  throw new Error("Unknown command. Use `upload` or `sync`.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
