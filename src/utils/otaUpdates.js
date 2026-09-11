import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";

export const LAST_SEEN_OTA_ID_KEY = "stromaLastSeenOtaUpdateId";

/**
 * True when this launch should announce an applied OTA.
 * Store binary first paint (embedded, no stored id) stays quiet.
 * An OTA with no stored id, or a different stored id, should announce.
 */
export function shouldShowAppUpdatedToast(
  lastSeenId,
  currentId,
  isEmbeddedLaunch = false,
) {
  if (!currentId) return false;
  if (!lastSeenId) return !isEmbeddedLaunch;
  return lastSeenId !== currentId;
}

function runningUpdateId() {
  if (Updates.updateId) return Updates.updateId;
  const manifestId = Updates.manifest?.id;
  return typeof manifestId === "string" && manifestId ? manifestId : null;
}

/**
 * Record the running update id. Returns true once, on the launch that applied a new OTA.
 * Never calls reloadAsync; Expo applies a downloaded update on the next process start.
 */
export async function consumeAppliedOtaToast() {
  try {
    if (__DEV__ || !Updates.isEnabled) return false;
    const currentId = runningUpdateId();
    if (!currentId) return false;
    const lastSeen = await AsyncStorage.getItem(LAST_SEEN_OTA_ID_KEY);
    const show = shouldShowAppUpdatedToast(
      lastSeen,
      currentId,
      Updates.isEmbeddedLaunch === true,
    );
    await AsyncStorage.setItem(LAST_SEEN_OTA_ID_KEY, currentId);
    return show;
  } catch (error) {
    console.warn("OTA toast state failed:", error?.message);
    return false;
  }
}

async function downloadPendingUpdate() {
  try {
    if (__DEV__ || !Updates.isEnabled) return;
    const result = await Updates.checkForUpdateAsync();
    if (!result?.isAvailable) return;
    await Updates.fetchUpdateAsync();
  } catch (error) {
    console.warn("Silent OTA check failed:", error?.message);
  }
}

/**
 * Native expo-updates already downloads on cold start (checkAutomatically ON_LOAD).
 * A JS fetch on that same launch races the native loader and can restart the
 * React host, which looks like the app closed. Only fetch after a later resume.
 */
const MIN_OTA_CHECK_INTERVAL_MS = 2 * 60 * 1000;

export function startSilentOtaDownloads() {
  let cancelled = false;
  let inFlight = false;
  let lastCheckAt = Date.now();

  const run = async () => {
    if (cancelled || inFlight) return;
    const now = Date.now();
    if (now - lastCheckAt < MIN_OTA_CHECK_INTERVAL_MS) return;
    lastCheckAt = now;
    inFlight = true;
    try {
      await downloadPendingUpdate();
    } finally {
      inFlight = false;
    }
  };

  const sub = AppState.addEventListener("change", (state) => {
    if (state === "active") run();
  });

  return () => {
    cancelled = true;
    sub.remove();
  };
}
