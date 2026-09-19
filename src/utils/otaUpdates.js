import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo-modules-core";

export const LAST_SEEN_OTA_ID_KEY = "stromaLastSeenOtaUpdateId";
export const EXPO_HOST_MODULES_OK_KEY = "stromaExpoHostModulesOk";
export const EXPO_HOST_MODULES_SURVIVE_MS = 15 * 1000;

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

function getExpoUpdates() {
  try {
    return requireOptionalNativeModule("ExpoUpdates");
  } catch (_) {
    return null;
  }
}

function runningUpdateId(native) {
  const module = native || getExpoUpdates();
  if (!module) return null;
  try {
    if (module.updateId && typeof module.updateId === "string") {
      return module.updateId.toLowerCase();
    }
  } catch (_) {
    return null;
  }
  return null;
}

/**
 * Whether this launch should show "App updated". Does not persist.
 * Persist only after the toast has actually laid out, so a crash on first
 * open of a new OTA still announces on the next launch.
 *
 * Do not import expo-updates here. That package registers a native state
 * listener at module load; ON_LOAD download events then JSON.parse in JS and
 * can kill the React host.
 */
export async function peekAppliedOtaToast() {
  try {
    const native = getExpoUpdates();
    if (!native?.isEnabled) return false;
    const currentId = runningUpdateId(native);
    if (!currentId) return false;
    const lastSeen = await AsyncStorage.getItem(LAST_SEEN_OTA_ID_KEY);
    return shouldShowAppUpdatedToast(
      lastSeen,
      currentId,
      native.isEmbeddedLaunch === true,
    );
  } catch (error) {
    console.warn("OTA toast peek failed:", error?.message);
    return false;
  }
}

/** Record the running update id after the toast is on screen. */
export async function markAppUpdatedToastShown() {
  try {
    const currentId = runningUpdateId();
    if (!currentId) return;
    await AsyncStorage.setItem(LAST_SEEN_OTA_ID_KEY, currentId);
  } catch (error) {
    console.warn("OTA toast mark failed:", error?.message);
  }
}

/**
 * expo-notifications imports `expo` (Expo.fx → expo-constants), which
 * JSON.parse(ExpoUpdates.manifestString) with no try/catch. On the first
 * process of a new OTA that throw kills the host. Skip those modules until
 * this updateId has already survived one launch.
 */
export function shouldAllowExpoHostModules({
  updateId,
  isEmbeddedLaunch,
  lastOkId,
}) {
  if (isEmbeddedLaunch) return true;
  if (!updateId) return true;
  return lastOkId === updateId;
}

export async function canLoadExpoHostModules() {
  try {
    const native = getExpoUpdates();
    const updateId = runningUpdateId(native);
    const lastOkId = await AsyncStorage.getItem(EXPO_HOST_MODULES_OK_KEY);
    return shouldAllowExpoHostModules({
      updateId,
      isEmbeddedLaunch: native?.isEmbeddedLaunch === true,
      lastOkId,
    });
  } catch (_) {
    return false;
  }
}

export async function markExpoHostModulesSafe() {
  try {
    const currentId = runningUpdateId();
    if (!currentId) return;
    await AsyncStorage.setItem(EXPO_HOST_MODULES_OK_KEY, currentId);
  } catch (error) {
    console.warn("Expo host-module gate mark failed:", error?.message);
  }
}

export function runWhenExpoHostModulesAllowed(fn) {
  let cancelled = false;
  (async () => {
    const allowed = await canLoadExpoHostModules();
    if (cancelled || !allowed) return;
    try {
      fn();
    } catch (error) {
      console.warn("Deferred Expo host module failed:", error?.message);
    }
  })();
  return () => {
    cancelled = true;
  };
}

export function startExpoHostModulesSurvivalMark() {
  if (__DEV__) return () => {};
  const timer = setTimeout(() => {
    void markExpoHostModulesSafe();
  }, EXPO_HOST_MODULES_SURVIVE_MS);
  return () => clearTimeout(timer);
}

async function downloadPendingUpdate() {
  try {
    if (__DEV__) return;
    const native = getExpoUpdates();
    if (!native?.isEnabled) return;
    if (typeof native.checkForUpdateAsync !== "function") return;
    const result = await native.checkForUpdateAsync();
    if (!result?.isAvailable) return;
    if (typeof native.fetchUpdateAsync !== "function") return;
    await native.fetchUpdateAsync();
  } catch (error) {
    console.warn("Silent OTA check failed:", error?.message);
  }
}

/**
 * Never fetch on cold start and never call reloadAsync. Native ON_LOAD (older
 * binaries) already downloads then; a JS fetch on that launch can restart the
 * React host. Splash hide often emits AppState "active"; ignore that until the
 * first delayed check. After that, fetch so NEVER binaries still pick up OTAs.
 * The new bundle runs on the next process start.
 */
export const MIN_OTA_CHECK_INTERVAL_MS = 2 * 60 * 1000;
export const FIRST_CHECK_DELAY_MS = 60 * 1000;

export function canRunSilentOtaCheck(resumeChecksAllowed, lastCheckAt, now) {
  if (!resumeChecksAllowed) return false;
  if (lastCheckAt && now - lastCheckAt < MIN_OTA_CHECK_INTERVAL_MS) return false;
  return true;
}

export function startSilentOtaDownloads() {
  if (__DEV__) return () => {};

  let cancelled = false;
  let inFlight = false;
  let lastCheckAt = 0;
  let resumeChecksAllowed = false;

  const run = async () => {
    if (cancelled || inFlight) return;
    const now = Date.now();
    if (!canRunSilentOtaCheck(resumeChecksAllowed, lastCheckAt, now)) return;
    lastCheckAt = now;
    inFlight = true;
    try {
      await downloadPendingUpdate();
    } finally {
      inFlight = false;
    }
  };

  const initialTimer = setTimeout(() => {
    resumeChecksAllowed = true;
    run();
  }, FIRST_CHECK_DELAY_MS);

  const sub = AppState.addEventListener("change", (state) => {
    if (state === "active") run();
  });

  return () => {
    cancelled = true;
    clearTimeout(initialTimer);
    sub.remove();
  };
}
