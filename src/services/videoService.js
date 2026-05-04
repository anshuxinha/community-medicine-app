import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../config/firebase";

export const VIDEO_CATEGORIES = {
  all: { id: "all", label: "All" },
  lectures: { id: "lectures", label: "Lectures" },
  revision: { id: "revision", label: "Revision" },
  cases: { id: "cases", label: "Case Discussions" },
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
