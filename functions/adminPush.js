/**
 * Helpers for admin-only Expo pushes (review feedback, video comments).
 * Tokens are per device. After logout they can still sit on the admin user
 * doc, so we also require an active currentDeviceId session.
 */

function isValidExpoPushToken(token) {
  return (
    typeof token === "string" &&
    (token.startsWith("ExponentPushToken[") ||
      token.startsWith("ExpoPushToken["))
  );
}

function hasActiveDeviceSession(userData) {
  const deviceId =
    typeof userData?.currentDeviceId === "string"
      ? userData.currentDeviceId.trim()
      : "";
  return deviceId.length > 0;
}

function hasActiveAdminPushSession(userData) {
  return (
    isValidExpoPushToken(userData?.pushToken) &&
    hasActiveDeviceSession(userData)
  );
}

module.exports = {
  isValidExpoPushToken,
  hasActiveDeviceSession,
  hasActiveAdminPushSession,
};
