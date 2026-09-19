/**
 * Lazy expo-constants. A static import JSON.parse(ExpoUpdates.manifestString)
 * at module load and can blacklist a new OTA on first open.
 */
export function getExpoConstants() {
  try {
    return require("expo-constants").default;
  } catch (_) {
    return null;
  }
}

export function getAppVersion(fallback = "1.0.0") {
  const Constants = getExpoConstants();
  return (
    Constants?.expoConfig?.version ||
    Constants?.nativeAppVersion ||
    fallback
  );
}
