const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
// 1st-gen Firestore triggers: no Eventarc bootstrap required for first deploy.
const functionsV1 = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { signUrl } = require("./bunnyToken");
const restoreCredentials = require("./restoreCredentials");

setGlobalOptions({ region: "us-central1" });

if (!admin.apps.length) {
  admin.initializeApp();
}

const {
  hasActiveAdminPushSession,
} = require("./adminPush");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Known admin emails (same list as client isAdmin fallbacks in VideosScreen).
const ADMIN_EMAILS = ["anshuxinha@gmail.com", "kaushikeec@gmail.com"];

/**
 * Collect Expo push tokens for admin accounts that currently hold a device
 * session. A leftover token after logout would otherwise still ring that phone.
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
    if (hasActiveAdminPushSession(data)) {
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
 * Retrieve all registered user push tokens for announcements (articles/news).
 */
async function getAllUserPushTokens() {
  const db = admin.firestore();
  const tokens = new Set();
  try {
    const snap = await db.collection("users").get();
    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const token = data.pushToken;
      if (
        typeof token === "string" &&
        (token.startsWith("ExponentPushToken[") ||
          token.startsWith("ExpoPushToken["))
      ) {
        tokens.add(token);
      }
    });
  } catch (err) {
    console.warn("getAllUserPushTokens failed:", err?.message);
  }
  return [...tokens];
}

function buildArticlePushCopy(item) {
  const rawTitle = item?.title || "New public health article";
  const title =
    rawTitle.length > 90 ? `${rawTitle.slice(0, 87)}...` : rawTitle;
  const summary = String(item?.summary || item?.content || "").trim();
  const firstSentence =
    summary.split(/(?<=[.?!])\s+/)[0] ||
    "Open the Updates tab for the full article.";
  const body =
    firstSentence.length > 320
      ? `${firstSentence.slice(0, 317)}...`
      : firstSentence;
  return { title, body };
}

/**
 * Notify admins of a new comment (videoDoubts collection handles both videos and news/articles).
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

    const isUpdate =
      data.targetType === "update" ||
      Boolean(data.updateId) ||
      (typeof videoId === "string" && videoId.startsWith("update_"));

    const updateTag = String(
      data.targetTag || data.tag || (data.isArticle ? "ARTICLE" : "NEWS"),
    ).toUpperCase();
    const isArticle = isUpdate && updateTag === "ARTICLE";

    let itemTitle = "a video";
    if (isUpdate) {
      itemTitle =
        data.targetTitle ||
        (isArticle ? "an article" : "a public health update");
    } else if (videoId) {
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
      itemTitle = videoTitle;
    }

    const tokens = await getAdminPushTokens(authorUid);
    if (tokens.length === 0) {
      console.log("onVideoDoubtCreated: no admin push tokens");
      return null;
    }

    const notificationTitle = isUpdate
      ? (isArticle ? "New article comment" : "New news comment")
      : "New video comment";

    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      priority: "high",
      title: notificationTitle,
      body: `${username} on ${itemTitle}: ${preview}`,
      channelId: "default",
      data: {
        screen: isUpdate ? "Updates" : "Videos",
        type: isUpdate
          ? (isArticle ? "admin_article_comment" : "admin_news_comment")
          : "admin_video_comment",
        videoId: isUpdate ? null : videoId,
        updateId: data.updateId || null,
        targetType: isUpdate ? "update" : "video",
        targetTag: isUpdate ? (isArticle ? "ARTICLE" : "NEWS") : null,
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
 * Notify all users when new articles are added to appContent/articlesFeed or artcilesFeed.
 */
exports.onArticlesFeedWritten = functionsV1
  .region("us-central1")
  .firestore.document("appContent/{docId}")
  .onWrite(async (change, context) => {
    const docId = context.params.docId;
    if (docId !== "articlesFeed" && docId !== "artcilesFeed") return null;
    if (!change.after.exists) return null;

    const beforeData = change.before.exists ? change.before.data() || {} : {};
    const afterData = change.after.data() || {};

    const extractItems = (feedObj) => {
      if (!feedObj) return [];
      if (Array.isArray(feedObj)) return feedObj;
      if (Array.isArray(feedObj.articles)) return feedObj.articles;
      if (Array.isArray(feedObj.items)) return feedObj.items;
      if (feedObj.months && typeof feedObj.months === "object") {
        const list = [];
        for (const m of Object.values(feedObj.months)) {
          if (Array.isArray(m)) list.push(...m);
        }
        return list;
      }
      return [];
    };

    const beforeItems = extractItems(beforeData);
    const afterItems = extractItems(afterData);

    const beforeKeys = new Set(
      beforeItems.map((it) => String(it?.id || it?.link || it?.title || "")),
    );
    const newItems = afterItems.filter(
      (it) => !beforeKeys.has(String(it?.id || it?.link || it?.title || "")),
    );

    if (newItems.length === 0) return null;

    const tokens = await getAllUserPushTokens();
    if (tokens.length === 0) {
      console.log("onArticlesFeedWritten: no push tokens registered");
      return null;
    }

    const item = newItems[0];
    const { title, body } = buildArticlePushCopy(item);

    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      channelId: "default",
      data: {
        screen: "Updates",
        type: "new_article",
        articleId: item.id || null,
      },
    }));

    const accepted = await sendExpoPushMessages(messages);
    console.log(
      `onArticlesFeedWritten: notified ${accepted}/${tokens.length} user token(s) for article: ${title}`,
    );
    return null;
  });

/**
 * Notify all users when a new article doc is created in articlesFeed collection.
 */
exports.onArticleDocCreated = functionsV1
  .region("us-central1")
  .firestore.document("articlesFeed/{articleId}")
  .onCreate(async (snap, context) => {
    const item = snap.data() || {};
    const tokens = await getAllUserPushTokens();
    if (tokens.length === 0) return null;

    const { title, body } = buildArticlePushCopy(item);

    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      channelId: "default",
      data: {
        screen: "Updates",
        type: "new_article",
        articleId: context.params.articleId,
      },
    }));

    const accepted = await sendExpoPushMessages(messages);
    console.log(
      `onArticleDocCreated: notified ${accepted}/${tokens.length} user token(s) for article: ${title}`,
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

exports.createRestoreCredentialOptions =
  restoreCredentials.createRestoreCredentialOptions;
exports.registerRestoreCredential = restoreCredentials.registerRestoreCredential;
exports.getRestoreCredentialOptions =
  restoreCredentials.getRestoreCredentialOptions;
exports.completeRestoreSignIn = restoreCredentials.completeRestoreSignIn;
