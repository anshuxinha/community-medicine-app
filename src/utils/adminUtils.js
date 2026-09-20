export const ADMIN_EMAILS = [
  "anshuxinha@gmail.com",
  "kaushikeec@gmail.com",
];

/**
 * Checks whether a user account has admin privileges.
 * Matches Firestore `isAdmin: true`, custom token claims, or verified admin emails.
 * Also falls back to Firebase Auth's currentUser email if user object in session is partial or unhydrated.
 */
export function isUserAdmin(user) {
  if (user?.isAdmin === true || user?.isAdmin === "true" || user?.isAdmin === 1) {
    return true;
  }
  const email = (user?.email || "").trim().toLowerCase();
  if (email && ADMIN_EMAILS.includes(email)) {
    return true;
  }
  try {
    const { auth } = require("../config/firebase");
    const currentEmail = (auth?.currentUser?.email || "").trim().toLowerCase();
    if (currentEmail && ADMIN_EMAILS.includes(currentEmail)) {
      return true;
    }
  } catch (_) {}
  return false;
}

