import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo-modules-core";

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
  if (module.updateId && typeof module.updateId === "string") {
    return module.updateId.toLowerCase();
  }
  try {
    const manifest = module.manifestString
      ? JSON.parse(module.manifestString)
      : module.manifest;
    const id = manifest?.id;
    return typeof id === "string" && id ? id.toLowerCase() : null;
  } catch (_) {
    return null;
  }
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
