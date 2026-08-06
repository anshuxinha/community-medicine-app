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

/**
 * Submit improvement feedback (review prompt or chapter-complete stars).
 * Writes to Firestore for the admin in-app queue (no mail client).
 *
 * @param {string} message
 * @param {{ source?: string, rating?: number }} [options]
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

  const payload = {
    message: trimmed,
    userId: currentUser.uid,
    userEmail: currentUser.email || null,
    username: currentUser.displayName || null,
    platform: Platform.OS,
    appVersion: String(appVersion),
    source: options.source || "review_prompt_negative",
    status: "new",
    createdAt: serverTimestamp(),
  };

  if (rating !== null) {
    payload.rating = rating;
  }

  const docRef = await addDoc(collection(db, APP_FEEDBACK_COLLECTION), payload);

  return docRef.id;
}
