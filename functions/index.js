const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { signUrl } = require("./bunnyToken");

setGlobalOptions({ region: "us-central1" });

if (!admin.apps.length) {
  admin.initializeApp();
}

const FREE_VIDEO_TITLES = new Set([
  "Nutrition: Overview and Protein",
  "Nutrition: Overview",
  "Protein",
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
