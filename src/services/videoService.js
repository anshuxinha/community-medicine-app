import { collection, onSnapshot, query } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app, db } from "../config/firebase";

export const VIDEO_CATEGORIES = {
  all: { id: "all", label: "All" },
  lectures: { id: "lectures", label: "Lectures" },
  revision: { id: "revision", label: "Revision" },
  cases: { id: "cases", label: "Case Discussions" },
};

const DEFAULT_PULL_ZONE =
  process.env.EXPO_PUBLIC_BUNNY_PULL_ZONE_HOSTNAME ||
  "vz-d73e181a-404.b-cdn.net";

/**
 * Build an unsigned HLS playlist URL for a Bunny Stream video.
 * Prefer resolvePlaybackSource() so production can use short-lived signed URLs.
 */
export const buildOpenHlsUrl = (video) => {
  if (!video) return null;

  if (typeof video.hlsUrl === "string" && video.hlsUrl.includes(".m3u8")) {
    return video.hlsUrl;
  }

  const videoId = video.bunnyVideoId || video.id;
  if (!videoId) return null;

  let hostname = DEFAULT_PULL_ZONE;
  if (typeof video.thumbnailUrl === "string") {
    try {
      const host = new URL(video.thumbnailUrl).hostname;
      if (host.endsWith(".b-cdn.net")) {
        hostname = host;
      }
    } catch (_err) {
      // keep default
    }
  }

  hostname = String(hostname).replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return `https://${hostname}/${videoId}/playlist.m3u8`;
};

/**
 * Resolve a playback URI for expo-video.
 * Tries Cloud Function signed URL first; falls back to open HLS if signing
 * is unavailable (e.g. function not deployed yet, or token key not set).
 */
export const resolvePlaybackSource = async (video) => {
  const videoId = video?.id || video?.bunnyVideoId;
  if (!videoId) {
    throw new Error("Video id is missing.");
  }

  try {
    const functions = getFunctions(app, "us-central1");
    const getVideoPlaybackUrl = httpsCallable(functions, "getVideoPlaybackUrl");
    const { data } = await getVideoPlaybackUrl({ videoId });
    if (data?.uri) {
      return {
        uri: data.uri,
        expiresAt: data.expiresAt ?? null,
        signed: Boolean(data.signed),
      };
    }
  } catch (error) {
    console.warn(
      "Signed playback URL unavailable, trying open HLS:",
      error?.message || error,
    );
  }

  const openUri = buildOpenHlsUrl(video);
  if (!openUri) {
    throw new Error("Could not build a playback URL for this video.");
  }

  return {
    uri: openUri,
    expiresAt: null,
    signed: false,
  };
};

const toDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getTimestamp = (value) => {
  const date = toDate(value);
  return date ? date.getTime() : 0;
};

export const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;

  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${Math.max(minutes, 1)}m`;
};

export const formatPublishedDate = (value) => {
  const date = toDate(value);
  if (!date) return "Recently added";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const getVideoCategories = (videos = []) => {
  const categories = new Map([
    [VIDEO_CATEGORIES.all.id, VIDEO_CATEGORIES.all],
  ]);

  videos.forEach((video) => {
    const id = video.category || "lectures";
    const label =
      video.categoryLabel ||
      VIDEO_CATEGORIES[id]?.label ||
      id
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

    categories.set(id, { id, label });
  });

  return Array.from(categories.values());
};

export const subscribeToVideos = ({ onData, onError }) => {
  const videosQuery = query(
    collection(db, "videos"),
    // orderBy("publishedAt", "desc"),
  );

  return onSnapshot(
    videosQuery,
    (snapshot) => {
      const videos = snapshot.docs
        .map((videoDoc) => ({
          id: videoDoc.id,
          ...videoDoc.data(),
        }))
        .filter((video) => video.status !== "archived")
        .sort(
          (left, right) =>
            getTimestamp(right.publishedAt || right.createdAt) -
            getTimestamp(left.publishedAt || left.createdAt),
        );

      onData(videos);
    },
    (error) => {
      onError?.(error);
    },
  );
};
