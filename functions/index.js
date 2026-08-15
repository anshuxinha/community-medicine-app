const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
// 1st-gen Firestore triggers: no Eventarc bootstrap required for first deploy.
const functionsV1 = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { signUrl } = require("./bunnyToken");

setGlobalOptions({ region: "us-central1" });

if (!admin.apps.length) {
  admin.initializeApp();
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Known admin emails (same list as client isAdmin fallbacks in VideosScreen).
const ADMIN_EMAILS = ["anshuxinha@gmail.com", "kaushikeec@gmail.com"];

const isValidExpoPushToken = (token) =>
  typeof token === "string" &&
  (token.startsWith("ExponentPushToken[") ||
    token.startsWith("ExpoPushToken["));

/**
 * Collect Expo push tokens for all admin accounts.
 * Sources: users where isAdmin == true, plus known admin emails via Auth.
 * @param {string|null} excludeUid - skip this user (e.g. comment author)
 * @returns {Promise<string[]>}
 */
async function getAdminPushTokens(excludeUid = null) {
  const db = admin.firestore();
  const tokens = new Set();
  const seenUids = new Set();

  const addUserDoc = (uid, data) => {
    if (!uid || (excludeUid && uid === excludeUid)) return;
    if (seenUids.has(uid)) return;
    seenUids.add(uid);
    if (isValidExpoPushToken(data?.pushToken)) {
      tokens.add(data.pushToken);
    }
  };

  try {
    const adminSnap = await db
      .collection("users")
      .where("isAdmin", "==", true)
      .get();
    adminSnap.forEach((docSnap) => addUserDoc(docSnap.id, docSnap.data()));
  } catch (err) {
    console.warn("getAdminPushTokens isAdmin query failed:", err?.message);
  }

  for (const email of ADMIN_EMAILS) {
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      if (seenUids.has(userRecord.uid)) continue;
      if (excludeUid && userRecord.uid === excludeUid) continue;
      const userDoc = await db.collection("users").doc(userRecord.uid).get();
      addUserDoc(userRecord.uid, userDoc.exists ? userDoc.data() : {});
    } catch (err) {
      // Auth user may not exist yet.
      console.warn(`getAdminPushTokens email ${email}:`, err?.message);
    }
  }

  return [...tokens];
}

/**
 * Send Expo push messages (batches of 100).
 * @param {Array<object>} messages
 * @returns {Promise<number>} accepted ticket count (best effort)
 */
async function sendExpoPushMessages(messages) {
  if (!messages.length) return 0;

  let accepted = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
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
        console.warn(`Expo push failed ${response.status}:`, body);
        continue;
      }
      try {
        const payload = await response.json();
        const tickets = Array.isArray(payload?.data) ? payload.data : [];
        tickets.forEach((ticket) => {
          if (ticket?.status === "ok") accepted += 1;
          else {
            console.warn(
              "Expo push ticket error:",
              ticket?.message || ticket?.details?.error || ticket,
            );
          }
        });
        if (tickets.length === 0) accepted += chunk.length;
      } catch {
        accepted += chunk.length;
      }
    } catch (err) {
      console.warn("Expo push request error:", err?.message);
    }
  }
  return accepted;
}

/**
 * Notify admins of a new video comment (videoDoubts create).
 */
exports.onVideoDoubtCreated = functionsV1
  .region("us-central1")
  .firestore.document("videoDoubts/{doubtId}")
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const doubtId = context.params.doubtId;
    const authorUid = data.userId || null;
    const username = data.username || data.userEmail || "Someone";
    const text = String(data.text || "").trim();
    const preview =
      text.length > 120 ? `${text.slice(0, 117)}...` : text || "(no text)";
    const videoId = data.videoId || null;

    let videoTitle = "a video";
    if (videoId) {
      try {
        const videoSnap = await admin
          .firestore()
          .collection("videos")
          .doc(String(videoId))
          .get();
        if (videoSnap.exists && videoSnap.data()?.title) {
          videoTitle = String(videoSnap.data().title);
        }
      } catch (err) {
        console.warn("onVideoDoubtCreated video lookup:", err?.message);
      }
    }

    const tokens = await getAdminPushTokens(authorUid);
    if (tokens.length === 0) {
      console.log("onVideoDoubtCreated: no admin push tokens");
      return null;
    }

    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      priority: "high",
      title: "New video comment",
      body: `${username} on ${videoTitle}: ${preview}`,
      channelId: "default",
      data: {
        screen: "Videos",
        type: "admin_video_comment",
        videoId,
        doubtId,
      },
    }));

    const accepted = await sendExpoPushMessages(messages);
    console.log(
      `onVideoDoubtCreated: notified ${accepted}/${tokens.length} admin token(s)`,
    );
    return null;
  });

/**
 * Notify admins when app feedback or a video request is submitted.
 */
exports.onAppFeedbackCreated = functionsV1
  .region("us-central1")
  .firestore.document("appFeedback/{feedbackId}")
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const feedbackId = context.params.feedbackId;
    const authorUid = data.userId || null;
    const username = data.username || data.userEmail || "Someone";
    const message = String(data.message || "").trim();
    const preview =
      message.length > 120
        ? `${message.slice(0, 117)}...`
        : message || "(no message)";
    const rating =
      typeof data.rating === "number" && Number.isFinite(data.rating)
        ? Math.round(data.rating)
        : null;
    const source = data.source || "app_feedback";
    const isVideoRequest =
      data.kind === "video_request" || source === "videos_screen";
    const kind = isVideoRequest ? "video_request" : "feedback";

    const ratingLabel = isVideoRequest
      ? data.requestedCategory || "video request"
      : rating != null
        ? `${rating}/5 stars`
        : "feedback";
    const title = isVideoRequest ? "New video request" : "New app feedback";
    const topic = String(data.topic || "").trim();
    const body = isVideoRequest
      ? `${username}: ${topic || preview}`
      : `${username} (${ratingLabel}): ${preview}`;

    const tokens = await getAdminPushTokens(authorUid);
    if (tokens.length === 0) {
      console.log("onAppFeedbackCreated: no admin push tokens");
      return null;
    }

    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      priority: "high",
      title,
      body,
      channelId: "default",
      data: {
        screen: "AdminAppFeedback",
        type: "admin_app_feedback",
        feedbackId,
        source,
        kind,
        rating,
      },
    }));

    const accepted = await sendExpoPushMessages(messages);
    console.log(
      `onAppFeedbackCreated: notified ${accepted}/${tokens.length} admin token(s)`,
    );
    return null;
  });

const FREE_VIDEO_TITLES = new Set([
  "Doll and Hill Criteria of Causality",
  "Doll and Hill Criteria",
]);

const PLAYBACK_TTL_SECONDS = 4 * 60 * 60; // 4 hours

const isVideoFree = (video) =>
  Boolean(video?.title && FREE_VIDEO_TITLES.has(String(video.title)));

const isUserPremium = (userData = {}, token) => {
  if (token?.isPremium === true) return true;
  if (userData.isPremium !== true) return false;
  if (userData.premiumExpiryDate) {
    const expiry = new Date(userData.premiumExpiryDate);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
      return false;
    }
  }
  return true;
};

const getPullZoneHostname = () => {
  const raw =
    process.env.BUNNY_STREAM_PULL_ZONE_HOSTNAME ||
    process.env.BUNNY_PULL_ZONE_HOSTNAME ||
    "";
  return String(raw).replace(/^https?:\/\//, "").replace(/\/+$/, "");
};

/**
 * Callable: getVideoPlaybackUrl({ videoId })
 * Returns a short-lived signed HLS URL for expo-video.
 *
 * Env (functions config / secrets):
 * - BUNNY_STREAM_PULL_ZONE_HOSTNAME
 * - BUNNY_CDN_TOKEN_AUTH_KEY  (Pull Zone → Security → Token Authentication Key)
 *
 * If the token key is unset, returns an open playlist URL so playback works
 * before CDN token auth is enabled. Enable token auth only after deploy.
 */
exports.getVideoPlaybackUrl = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in to watch videos.");
  }

  const videoId = String(request.data?.videoId || "").trim();
  if (!videoId) {
    throw new HttpsError("invalid-argument", "videoId is required.");
  }

  const db = admin.firestore();
  const videoSnap = await db.collection("videos").doc(videoId).get();
  if (!videoSnap.exists) {
    throw new HttpsError("not-found", "Video not found.");
  }

  const video = videoSnap.data() || {};
  if (video.status === "archived") {
    throw new HttpsError("failed-precondition", "This video is unavailable.");
  }

  const bunnyVideoId = video.bunnyVideoId || videoId;
  const userSnap = await db.collection("users").doc(request.auth.uid).get();
  const userData = userSnap.exists ? userSnap.data() : {};

  if (!isVideoFree(video) && !isUserPremium(userData, request.auth.token)) {
    throw new HttpsError(
      "permission-denied",
      "Premium is required to watch this video.",
    );
  }

  const hostname = getPullZoneHostname();
  if (!hostname) {
    throw new HttpsError(
      "failed-precondition",
      "Video CDN is not configured (missing pull zone hostname).",
    );
  }

  const openUri = `https://${hostname}/${bunnyVideoId}/playlist.m3u8`;
  const tokenKey = process.env.BUNNY_CDN_TOKEN_AUTH_KEY || "";
  const expiresAt = Math.floor(Date.now() / 1000) + PLAYBACK_TTL_SECONDS;

  if (!tokenKey) {
    // Transition mode: token auth not configured yet.
    return {
      uri: openUri,
      expiresAt: null,
      signed: false,
      bunnyVideoId,
    };
  }

  const pathAllowed = `/${bunnyVideoId}/`;
  const uri = signUrl(
    openUri,
    tokenKey,
    PLAYBACK_TTL_SECONDS,
    "",
    true, // directory / path-based token for HLS segments
    pathAllowed,
  );

  return {
    uri,
    expiresAt,
    signed: true,
    bunnyVideoId,
  };
});
