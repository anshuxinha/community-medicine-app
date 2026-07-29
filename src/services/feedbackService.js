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
 * Submit improvement feedback from the review "Not Really" path.
 * Writes to Firestore for the admin in-app queue (no mail client).
 *
 * @param {string} message
 * @param {{ source?: string }} [options]
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

  const docRef = await addDoc(collection(db, APP_FEEDBACK_COLLECTION), {
    message: trimmed,
    userId: currentUser.uid,
    userEmail: currentUser.email || null,
    username: currentUser.displayName || null,
    platform: Platform.OS,
    appVersion: String(appVersion),
    source: options.source || "review_prompt_negative",
    status: "new",
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}
