import AsyncStorage from "@react-native-async-storage/async-storage";

export const DASHBOARD_LAST_SEEN_PROGRESS_KEY =
  "dashboard_lastSeenReadingProgress";

/**
 * @param {number} progress - 0–1 fraction
 * @returns {number} integer percent 0–100
 */
export const progressToPercent = (progress) =>
  Math.round(Math.min(Math.max(Number(progress) || 0, 0), 1) * 100);

/**
 * @returns {Promise<number|null>} last-seen 0–1, or null if never stored
 */
export async function getLastSeenReadingProgress() {
  try {
    const raw = await AsyncStorage.getItem(DASHBOARD_LAST_SEEN_PROGRESS_KEY);
    if (raw === null || raw === undefined || raw === "") {
      return null;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      return null;
    }
    return Math.min(Math.max(value, 0), 1);
  } catch {
    return null;
  }
}

/**
 * @param {number} progress - 0–1 fraction
 */
export async function setLastSeenReadingProgress(progress) {
  try {
    const safe = Math.min(Math.max(Number(progress) || 0, 0), 1);
    await AsyncStorage.setItem(
      DASHBOARD_LAST_SEEN_PROGRESS_KEY,
      String(safe),
    );
  } catch (err) {
    console.warn(
      "progressPresentation: failed to persist last-seen progress",
      err?.message,
    );
  }
}
