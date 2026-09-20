export const ADMIN_EMAILS = [
  "anshuxinha@gmail.com",
  "kaushikeec@gmail.com",
];

/**
 * Checks whether a user account has admin privileges.
 * Matches Firestore `isAdmin: true`, custom token claims, or verified admin emails.
 */
export function isUserAdmin(user) {
  if (!user) return false;
  if (user.isAdmin === true) return true;
  const email = user.email?.toLowerCase?.() || "";
  return ADMIN_EMAILS.includes(email);
}
