const admin = require("firebase-admin");
const dotenv = require("dotenv");
const fs = require("fs");
const https = require("https");
const path = require("path");
const { signUrl } = require("../functions/bunnyToken");

dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });
// Token auth key often lives next to Cloud Functions.
if (!process.env.BUNNY_CDN_TOKEN_AUTH_KEY) {
  dotenv.config({ path: path.join(__dirname, "..", "functions", ".env"), quiet: true });
}

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "..", "serviceAccountKey.json");
const STORAGE_BUCKET = "community-med-app.firebasestorage.app";
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BUNNY_API_BASE = "https://video.bunnycdn.com";
const THUMBNAIL_SIGN_TTL_SECONDS = 60 * 60; // 1 hour — only for the download hop

const parseArgs = () => {
  const [command = "sync", ...rawArgs] = process.argv.slice(2);
  const options = { command, tags: [], positional: [] };

  rawArgs.forEach((arg) => {
    if (!arg.startsWith("--")) {
      options.positional.push(arg);
      return;
    }
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
    tokenAuthKey: process.env.BUNNY_CDN_TOKEN_AUTH_KEY || "",
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
    storageBucket: STORAGE_BUCKET,
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

const isHostedThumbnailUrl = (url) =>
  typeof url === "string" &&
  (url.includes("storage.googleapis.com/") || url.includes("firebasestorage.app/"));

const signBunnyAssetUrl = (config, openUrl, videoId) => {
  if (!config.tokenAuthKey || !openUrl || !videoId) return openUrl;
  return signUrl(
    openUrl,
    config.tokenAuthKey,
    THUMBNAIL_SIGN_TTL_SECONDS,
    "",
    true,
    `/${videoId}/`,
  );
};

const discoverPullZoneHostname = async (config, video) => {
  if (config.pullZoneHostname || !video.guid) return config.pullZoneHostname;

  const embedUrl = `https://player.mediadelivery.net/embed/${config.libraryId}/${video.guid}`;
  const response = await fetch(embedUrl);
  if (!response.ok) return "";

  const html = await response.text();
  // Prefer any pull-zone host on the video path (tokenized URLs vary).
  const match = html.match(
    new RegExp(
      `https://([^/"'\\s<>]+\\.b-cdn\\.net)/[^"'\\s<>]*${video.guid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    ),
  );

  config.pullZoneHostname = match?.[1] || "";
  return config.pullZoneHostname;
};

/**
 * Download the Bunny thumbnail (token-auth signed when needed) and re-host on
 * Firebase Storage so the app can load a permanent public image without CDN tokens.
 */
const hostThumbnailOnStorage = async (config, video, bunnyThumbnailUrl) => {
  const videoId = video.guid;
  const fetchUrl = signBunnyAssetUrl(config, bunnyThumbnailUrl, videoId);
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Thumbnail download ${response.status} for ${videoId}`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 100) {
    throw new Error(`Thumbnail too small (${buffer.length} bytes) for ${videoId}`);
  }

  const ext = contentType.includes("png") ? "png" : "jpg";
  const remotePath = `videos/thumbnails/${videoId}.${ext}`;
  const bucket = admin.storage().bucket();
  const file = bucket.file(remotePath);

  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: "public, max-age=31536000",
    },
    resumable: false,
  });
  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${STORAGE_BUCKET}/${remotePath}`;
  console.log(`  Hosted thumbnail → ${publicUrl}`);
  return publicUrl;
};

const resolveThumbnailUrl = async (config, video, existing = {}) => {
  // Already on Firebase Storage — permanent and loadable without Bunny token auth.
  if (isHostedThumbnailUrl(existing.thumbnailUrl)) {
    return existing.thumbnailUrl;
  }

  let bunnyUrl = buildThumbnailUrl(config, video);
  if (!bunnyUrl) {
    await discoverPullZoneHostname(config, video);
    bunnyUrl = buildThumbnailUrl(config, video);
  }

  if (!bunnyUrl) {
    return existing.thumbnailUrl || null;
  }

  // Bunny pull zone uses token authentication; bare CDN URLs 403 in the app.
  // Re-host so list posters work offline of short-lived signed playback tokens.
  try {
    return await hostThumbnailOnStorage(config, video, bunnyUrl);
  } catch (error) {
    console.warn(
      `Could not host thumbnail for ${video.guid}: ${error.message}. Falling back to signed CDN URL.`,
    );
    const signed = signBunnyAssetUrl(config, bunnyUrl, video.guid);
    // Prefer a still-working signed URL over a bare 403 URL or stale value.
    return signed || existing.thumbnailUrl || bunnyUrl;
  }
};

const parseFirestoreDate = (value) => {
  if (!value) return null;
  // Handle Firestore Timestamp (firebase-admin)
  if (typeof value.toDate === "function") return value.toDate();
  // Handle already a Date object
  if (value instanceof Date) return value;
  // Handle string or number
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toVideoDoc = (config, video, options = {}, existing = {}) => {
  const now = new Date();
  const title = options.title || video.title || existing.title || "Untitled video";
  const category = options.category || existing.category || "lectures";
  const categoryLabel = options.categoryLabel || options["category-label"] || existing.categoryLabel || "Lectures";

  const publishedDate =
    parseFirestoreDate(existing.publishedAt) ||
    parseFirestoreDate(video.dateUploaded) ||
    now;
  const createdDate =
    parseFirestoreDate(existing.createdAt) ||
    parseFirestoreDate(video.dateUploaded) ||
    now;

  return {
    bunnyVideoId: video.guid,
    libraryId: String(config.libraryId),
    title,
    description: options.description || existing.description || "",
    category,
    categoryLabel,
    tags: options.tags || existing.tags || [],
    duration: Number(video.length || video.duration || existing.duration || 0),
    status: String(video.status ?? existing.status ?? "processing"),
    thumbnailUrl: options.thumbnailUrl || existing.thumbnailUrl || null,
    embedUrl: video.guid
      ? `https://iframe.mediadelivery.net/embed/${config.libraryId}/${video.guid}`
      : existing.embedUrl || null,
    publishedAt: admin.firestore.Timestamp.fromDate(publishedDate),
    createdAt: admin.firestore.Timestamp.fromDate(createdDate),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    source: "bunny",
  };
};

const upsertVideoDoc = async (db, config, video, options = {}) => {
  const docRef = db.collection("videos").doc(video.guid);
  const snapshot = await docRef.get();
  const existing = snapshot.exists ? snapshot.data() : {};
  const thumbnailUrl = await resolveThumbnailUrl(config, video, existing);
  const payload = toVideoDoc(config, video, { ...options, thumbnailUrl }, existing);
  const isNew = !snapshot.exists;

  if (isNew) {
    payload.isNew = true;
  }

  console.log(`Upserting video ${video.guid} (${payload.title}) in category ${payload.category}...`);
  await docRef.set(payload, { merge: true });

  return {
    id: video.guid,
    isNew,
    // True when the Firestore doc was already flagged isNew (e.g. prior sync
    // without --notify-new). Used so a later --notify-new pass can still push.
    existingIsNew: existing.isNew === true,
    wasNotified: Boolean(existing.notifiedAt),
    payload,
  };
};

const getExpoPushTokens = async (db) => {
  const snapshot = await db.collection("users").get();
  const tokens = [];

  // All users with a valid Expo push token receive video notifications.
  // Opt-out was removed; videoNotificationsEnabled is no longer consulted.
  snapshot.forEach((userDoc) => {
    const data = userDoc.data();
    const token = data.pushToken;

    if (
      typeof token === "string" &&
      (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["))
    ) {
      tokens.push(token);
    }
  });

  return [...new Set(tokens)];
};

const sendVideoPushNotification = async (db, video, customBody) => {
  const tokens = await getExpoPushTokens(db);
  console.log(
    `Sending video push for "${video.title}" to ${tokens.length} Expo token(s)...`,
  );
  if (tokens.length === 0) return 0;

  const body = customBody || (video.description ? `${video.title} - ${video.description}` : video.title);

  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    priority: "high",
    title: "New Video Available",
    body,
    channelId: "default",
    data: { screen: "Videos", type: "video", videoId: video.bunnyVideoId },
  }));

  let accepted = 0;
  let ticketErrors = 0;

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

    // Surface per-token ticket errors (e.g. DeviceNotRegistered) so Android
    // FCM failures are visible instead of looking like a full success.
    try {
      const payload = await response.json();
      const tickets = Array.isArray(payload?.data) ? payload.data : [];
      tickets.forEach((ticket, ticketIndex) => {
        if (ticket?.status === "ok") {
          accepted += 1;
          return;
        }
        ticketErrors += 1;
        const token = chunk[ticketIndex]?.to || "unknown";
        console.warn(
          `Expo push ticket error for ${token}:`,
          ticket?.message || ticket?.details?.error || JSON.stringify(ticket),
        );
      });
      if (tickets.length === 0) {
        accepted += chunk.length;
      }
    } catch (parseError) {
      accepted += chunk.length;
      console.warn("Could not parse Expo push response:", parseError?.message);
    }
  }

  if (ticketErrors > 0) {
    console.warn(`Expo accepted ${accepted}; ${ticketErrors} ticket error(s).`);
  }

  return accepted;
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
    body: JSON.stringify({ title, thumbnailTime: 10000 }),
  });

  await uploadBinaryToBunny(config, createdVideo.guid, filePath);

  const result = await upsertVideoDoc(db, config, createdVideo, {
    title,
    description: options.description || "",
    category: options.category || "lectures",
    categoryLabel: options.categoryLabel || options["category-label"] || "Lectures",
    tags: options.tags || [],
  });

  const customMessage = options.positional?.[0];
  const notifiedCount = await sendVideoPushNotification(db, result.payload, customMessage);
  await markNotified(db, result.id);

  console.log(`Uploaded ${title} to Bunny Stream.`);
  console.log(`Synced Firestore document videos/${result.id}.`);
  console.log(`Sent ${notifiedCount} Expo push notification(s).`);
};

const syncVideos = async (db, config, options) => {
  const notifyNew = options["notify-new"] === true || options["notify-new"] === "true";
  const customMessage = options.positional?.[0];
  let page = 1;
  let syncedCount = 0;
  let notifiedCount = 0;
  let notifyTargets = 0;
  let isFirstVideo = true;

  while (true) {
    const response = await bunnyFetch(
      config,
      `/library/${config.libraryId}/videos?page=${page}&itemsPerPage=100`,
    );
    const items = Array.isArray(response?.items) ? response.items : [];
    if (items.length === 0) break;

    for (const video of items) {
      const videoOptions = { ...options };

      // If a category was provided via CLI, only apply it to the latest (first) video fetched.
      // Applying it to all videos would overwrite every existing video's category.
      if (!isFirstVideo) {
        delete videoOptions.category;
        delete videoOptions.categoryLabel;
        delete videoOptions["category-label"];
      }

      const result = await upsertVideoDoc(db, config, video, videoOptions);
      isFirstVideo = false;
      syncedCount += 1;

      // Notify when never pushed before and either:
      // - Firestore doc was created on this run, or
      // - doc already exists with isNew (prior sync without a successful notify).
      // Previously only result.isNew was checked, so re-running --notify-new
      // after a silent first sync skipped the push entirely.
      const shouldNotify =
        notifyNew &&
        !result.wasNotified &&
        (result.isNew || result.existingIsNew);

      if (shouldNotify) {
        notifyTargets += 1;
        console.log(
          `Notify target: ${result.payload.title} (${result.isNew ? "created this run" : "existing isNew, never notified"})`,
        );
        notifiedCount += await sendVideoPushNotification(db, result.payload, customMessage);
        await markNotified(db, result.id);
      } else if (notifyNew && result.isNew) {
        console.log(
          `Skipped notify for ${result.payload.title}: already has notifiedAt.`,
        );
      }
    }

    if (items.length < 100) break;
    page += 1;
  }

  console.log(`Synced ${syncedCount} Bunny video(s) to Firestore.`);
  if (notifyNew) {
    console.log(
      `Notify targets: ${notifyTargets}. Sent ${notifiedCount} Expo push notification(s).`,
    );
  }
};

const notifyVideo = async (db, options) => {
  const videoId = options.id || options.positional?.[0];
  const customMessage = options.message || options.positional?.[1] || options.positional?.[0];

  if (!videoId) {
    throw new Error("Notify requires a video ID (use --id=ID or positional).");
  }

  const docRef = db.collection("videos").doc(videoId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    throw new Error(`Video ${videoId} not found in Firestore.`);
  }

  const video = snapshot.data();
  const notifiedCount = await sendVideoPushNotification(db, video, customMessage);
  await markNotified(db, videoId);

  console.log(`Sent ${notifiedCount} Expo push notification(s) for video ${video.title}.`);
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

  if (options.command === "notify") {
    await notifyVideo(db, options);
    return;
  }

  throw new Error("Unknown command. Use `upload`, `sync`, or `notify`.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
