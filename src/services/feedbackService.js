import { Platform } from "react-native";
import Constants from "expo-constants";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

export const APP_FEEDBACK_COLLECTION = "appFeedback";
export const FEEDBACK_MESSAGE_MAX_LENGTH = 2000;
export const FEEDBACK_KIND_FEEDBACK = "feedback";
export const FEEDBACK_KIND_VIDEO_REQUEST = "video_request";
export const VIDEO_REQUEST_SOURCE = "videos_screen";
export const VIDEO_REQUEST_TOPIC_MAX_LENGTH = 160;

export const VIDEO_REQUEST_CATEGORIES = [
  { id: "lectures", label: "Lectures" },
  { id: "revision", label: "Revision" },
  { id: "cases", label: "Case Discussions" },
  { id: "other", label: "Other" },
];

export const isVideoRequestItem = (item) =>
  item?.kind === FEEDBACK_KIND_VIDEO_REQUEST ||
  item?.source === VIDEO_REQUEST_SOURCE;

export const buildVideoRequestMessage = ({
  topic,
  details,
  categoryLabel,
} = {}) => {
  const lines = [`Topic: ${String(topic || "").trim()}`];
  if (categoryLabel) {
    lines.push(`Category: ${categoryLabel}`);
  }
  const extra = String(details || "").trim();
  if (extra) {
    lines.push("", extra);
  }
  return lines.join("\n");
};

/**
 * Submit improvement feedback or a video request.
 * Writes to Firestore for the admin in-app queue (no mail client).
 *
 * @param {string} message
 * @param {{
 *   source?: string,
 *   rating?: number,
 *   kind?: string,
 *   topic?: string,
 *   requestedCategory?: string,
 * }} [options]
 * @returns {Promise<string>} new document id
 */
export async function submitAppFeedback(message, options = {}) {
  const trimmed = String(message || "").trim();
  if (!trimmed) {
    throw new Error("Feedback message is empty.");
  }
  if (trimmed.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
    throw new Error(
      `Feedback must be ${FEEDBACK_MESSAGE_MAX_LENGTH} characters or fewer.`,
    );
  }

  const currentUser = auth.currentUser;
  if (!currentUser?.uid) {
    throw new Error("Sign in to send feedback.");
  }

  const appVersion =
    Constants.expoConfig?.version ||
    Constants.nativeAppVersion ||
    "unknown";

  const ratingRaw = options.rating;
  const rating =
    typeof ratingRaw === "number" &&
    Number.isFinite(ratingRaw) &&
    ratingRaw >= 1 &&
    ratingRaw <= 5
      ? Math.round(ratingRaw)
      : null;

  const isVideoRequest = options.kind === FEEDBACK_KIND_VIDEO_REQUEST;
  const kind = isVideoRequest
    ? FEEDBACK_KIND_VIDEO_REQUEST
    : FEEDBACK_KIND_FEEDBACK;
  const topic = String(options.topic || "").trim();
  const requestedCategory = String(options.requestedCategory || "").trim();

  const payload = {
    message: trimmed,
    userId: currentUser.uid,
    userEmail: currentUser.email || null,
    username: currentUser.displayName || null,
    platform: Platform.OS,
    appVersion: String(appVersion),
    source: options.source || "review_prompt_negative",
    kind,
    status: "new",
    createdAt: serverTimestamp(),
  };

  if (rating !== null) {
    payload.rating = rating;
  }
  if (isVideoRequest && topic) {
    payload.topic = topic.slice(0, VIDEO_REQUEST_TOPIC_MAX_LENGTH);
  }
  if (isVideoRequest && requestedCategory) {
    payload.requestedCategory = requestedCategory;
  }

  const docRef = await addDoc(collection(db, APP_FEEDBACK_COLLECTION), payload);

  return docRef.id;
}
