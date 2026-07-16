import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";

const RELOAD_GUARD_KEY = "@stroma/updateReloadGuard";
const RELOAD_COOLDOWN_MS = 45_000;

/**
 * Apply a downloaded OTA. Safe to call multiple times; concurrent calls share one promise.
 * Rate-limited so a broken pending update cannot infinite-loop reloadAsync.
 */
let inFlight = null;

async function shouldSkipAutoReload() {
  try {
    const raw = await AsyncStorage.getItem(RELOAD_GUARD_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const id = Updates.updateId || "unknown";
    const pendingKey = Updates.isUpdatePending ? "pending" : "none";
    if (
      parsed?.at &&
      Date.now() - Number(parsed.at) < RELOAD_COOLDOWN_MS &&
      parsed?.runningId === id &&
      parsed?.pendingKey === pendingKey
    ) {
      return true;
    }
  } catch (_) {
    /* ignore */
  }
  return false;
}

async function markReloadAttempt() {
  try {
    await AsyncStorage.setItem(
      RELOAD_GUARD_KEY,
      JSON.stringify({
        at: Date.now(),
        runningId: Updates.updateId || "unknown",
        pendingKey: Updates.isUpdatePending ? "pending" : "none",
      }),
    );
  } catch (_) {
    /* ignore */
  }
}

export async function applyPendingUpdateIfNeeded(
  reason = "unspecified",
  { force = false } = {},
) {
  if (__DEV__ || !Updates.isEnabled) return false;

  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      if (!Updates.isUpdatePending) {
        return false;
      }

      if (!force && (await shouldSkipAutoReload())) {
        console.warn(
          `[updates] Skipping auto-reload (${reason}) — cooldown after recent attempt`,
        );
        return false;
      }

      await markReloadAttempt();
      console.log(`[updates] Applying pending OTA (${reason})…`);
      await Updates.reloadAsync();
      return true;
    } catch (error) {
      console.warn(
        `[updates] reloadAsync failed (${reason}):`,
        error?.message || error,
      );
      return false;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * Download the latest OTA if available, then apply immediately.
 */
export async function checkFetchAndApplyUpdate() {
  if (__DEV__ || !Updates.isEnabled) {
    return { status: "disabled" };
  }

  try {
    if (Updates.isUpdatePending) {
      const applied = await applyPendingUpdateIfNeeded("already-pending");
      return { status: applied ? "applying" : "pending-cooldown" };
    }

    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) {
      return { status: "up-to-date" };
    }

    await Updates.fetchUpdateAsync();
    const applied = await applyPendingUpdateIfNeeded("after-fetch");
    return { status: applied ? "applying" : "pending-cooldown" };
  } catch (error) {
    console.warn("[updates] check/fetch failed:", error?.message || error);
    return { status: "error", error };
  }
}
