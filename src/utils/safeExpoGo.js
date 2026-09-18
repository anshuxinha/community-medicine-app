import { requireOptionalNativeModule } from "expo-modules-core";

/**
 * Expo Go vs standalone without importing expo-constants.
 * expo-constants JSON.parse(ExpoUpdates.manifestString) at load time. On the
 * first open of a new OTA that string can be incomplete and the throw kills
 * the process after CONTENT_APPEARED.
 */
export function getAppOwnership() {
  try {
    const constants = requireOptionalNativeModule("ExponentConstants");
    if (constants && typeof constants.appOwnership === "string") {
      return constants.appOwnership;
    }
    return constants?.appOwnership ?? null;
  } catch (_) {
    return null;
  }
}

export function isExpoGo() {
  return getAppOwnership() === "expo";
}
