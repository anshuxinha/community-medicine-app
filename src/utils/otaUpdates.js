import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";

export const LAST_SEEN_OTA_ID_KEY = "stromaLastSeenOtaUpdateId";

/**
 * True when this launch is running a different OTA than the last one we recorded.
 * First launch (no stored id) does not count.
 */
export function shouldShowAppUpdatedToast(lastSeenId, currentId) {
  if (!currentId) return false;
  if (!lastSeenId) return false;
  return lastSeenId !== currentId;
}

/**
 * Record the running update id. Returns true once, on the launch that applied a new OTA.
 * Never calls reloadAsync; Expo applies a downloaded update on the next process start.
 */
export async function consumeAppliedOtaToast() {
  if (__DEV__ || !Updates.isEnabled) return false;
  try {
    const currentId = Updates.updateId;
    if (!currentId) return false;
    const lastSeen = await AsyncStorage.getItem(LAST_SEEN_OTA_ID_KEY);
    await AsyncStorage.setItem(LAST_SEEN_OTA_ID_KEY, currentId);
    return shouldShowAppUpdatedToast(lastSeen, currentId);
  } catch (error) {
    console.warn("OTA toast state failed:", error?.message);
    return false;
  }
}

async function downloadPendingUpdate() {
  if (__DEV__ || !Updates.isEnabled) return;
  try {
    if (Updates.isUpdatePending) return;
    const result = await Updates.checkForUpdateAsync();
    if (!result?.isAvailable) return;
    await Updates.fetchUpdateAsync();
  } catch (error) {
    console.warn("Silent OTA check failed:", error?.message);
  }
}

/**
 * Download OTAs in the background. The new bundle runs the next time the app process starts.
 */
const MIN_OTA_CHECK_INTERVAL_MS = 2 * 60 * 1000;

export function startSilentOtaDownloads() {
  if (__DEV__ || !Updates.isEnabled) {
    return () => {};
  }

  let cancelled = false;
  let inFlight = false;
  let lastCheckAt = 0;

  const run = async () => {
    if (cancelled || inFlight) return;
    const now = Date.now();
    if (lastCheckAt && now - lastCheckAt < MIN_OTA_CHECK_INTERVAL_MS) return;
    lastCheckAt = now;
    inFlight = true;
    try {
      await downloadPendingUpdate();
    } finally {
      inFlight = false;
    }
  };

  run();

  const sub = AppState.addEventListener("change", (state) => {
    if (state === "active") run();
  });

  return () => {
    cancelled = true;
    sub.remove();
  };
}
