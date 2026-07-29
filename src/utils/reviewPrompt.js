import { Alert, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const STORAGE_KEY_HAS_SHOWN = "reviewPrompt_hasShown";
const STORAGE_KEY_LAST_PROGRESS = "reviewPrompt_lastProgress";
const STORAGE_KEY_RESET_VERSION = "reviewPrompt_resetVersion";
const STORAGE_KEY_VIDEO_PROMPTED_IDS = "reviewPrompt_videoPromptedIds";
const REVIEW_PROMPT_RESET_VERSION = "2026-05-04-review-flow-fix";

/** In-memory guard so rapid fullscreen toggles cannot stack Alerts. */
let videoPromptInFlight = false;

/**
 * Evaluate whether to show the in-app review pre-prompt.
 *
 * Uses the same readingProgress value displayed on the Dashboard
 * progress bar (0-1 fraction), converted to an integer percentage.
 *
 * Trigger: first time percentage >= 1% AND has increased by at least
 *          1 percentage point since the last evaluation.
 *
 * REVIEW_PROMPT_RESET_VERSION resets the local prompt counters once for
 * every installed user so fixed review flows can become eligible again.
 *
 * The prompt fires at most once per reset version.
 *
 * Soft dismiss permanently suppresses (Library path).
 *
 * @param {number} readingProgress - 0-1 fraction (same as Dashboard bar)
 */
export async function maybePromptReview(readingProgress) {
  try {
    const currentPercent = Math.round(readingProgress * 100);

    const [rawHasShown, rawLastProgress, rawResetVersion] =
      await AsyncStorage.multiGet([
        STORAGE_KEY_HAS_SHOWN,
        STORAGE_KEY_LAST_PROGRESS,
        STORAGE_KEY_RESET_VERSION,
      ]);

    const shouldResetPrompt =
      rawResetVersion[1] !== REVIEW_PROMPT_RESET_VERSION;
    const hasShownReview = shouldResetPrompt ? false : rawHasShown[1] === "true";
    const rawTrackedProgress = shouldResetPrompt ? "0" : rawLastProgress[1];

    if (shouldResetPrompt) {
      await AsyncStorage.multiSet([
        [STORAGE_KEY_HAS_SHOWN, "false"],
        [STORAGE_KEY_LAST_PROGRESS, "0"],
        [STORAGE_KEY_RESET_VERSION, REVIEW_PROMPT_RESET_VERSION],
      ]);
    }

    const lastProgressTracked = Number(rawTrackedProgress) || 0;

    if (
      !hasShownReview &&
      currentPercent >= 1 &&
      currentPercent >= lastProgressTracked + 1
    ) {
      showPrePrompt({
        onSoftDismiss: () => {
          void markAsShown();
        },
      });
    }

    // Always update the tracked progress
    await AsyncStorage.setItem(
      STORAGE_KEY_LAST_PROGRESS,
      String(currentPercent),
    );
  } catch (err) {
    console.warn("reviewPrompt: evaluation failed", err?.message);
  }
}

/**
 * Video path: prompt after the user exits fullscreen having watched ≥90%.
 *
 * Soft dismiss records the video id only (ask again on other videos).
 * Review Now sets global hasShown so all prompts stop.
 * Same video is never re-prompted after a soft dismiss or successful show.
 *
 * @param {string} videoId
 */
export async function maybePromptReviewAfterVideo(videoId) {
  if (!videoId || videoPromptInFlight) {
    return;
  }

  try {
    const [rawHasShown, rawResetVersion, rawVideoIds] =
      await AsyncStorage.multiGet([
        STORAGE_KEY_HAS_SHOWN,
        STORAGE_KEY_RESET_VERSION,
        STORAGE_KEY_VIDEO_PROMPTED_IDS,
      ]);

    const shouldResetPrompt =
      rawResetVersion[1] !== REVIEW_PROMPT_RESET_VERSION;
    if (shouldResetPrompt) {
      await AsyncStorage.multiSet([
        [STORAGE_KEY_HAS_SHOWN, "false"],
        [STORAGE_KEY_LAST_PROGRESS, "0"],
        [STORAGE_KEY_RESET_VERSION, REVIEW_PROMPT_RESET_VERSION],
      ]);
    }

    const hasShownReview = shouldResetPrompt
      ? false
      : rawHasShown[1] === "true";
    if (hasShownReview) {
      return;
    }

    const promptedIds = parseVideoPromptedIds(
      shouldResetPrompt ? null : rawVideoIds[1],
    );
    if (promptedIds.includes(String(videoId))) {
      return;
    }

    // Mark before showing so FS flicker cannot double-prompt this video.
    videoPromptInFlight = true;
    await markVideoPrompted(videoId, promptedIds);

    showPrePrompt({
      onSoftDismiss: () => {
        videoPromptInFlight = false;
      },
      onReviewed: () => {
        videoPromptInFlight = false;
      },
    });
  } catch (err) {
    videoPromptInFlight = false;
    console.warn("reviewPrompt: video evaluation failed", err?.message);
  }
}

/**
 * @param {{ onSoftDismiss?: () => void, onReviewed?: () => void }} [handlers]
 */
function showPrePrompt(handlers = {}) {
  const { onSoftDismiss, onReviewed } = handlers;

  Alert.alert(
    "Enjoying STROMA?",
    "Are you finding the app helpful so far?",
    [
      {
        text: "Not Really",
        style: "cancel",
        onPress: () => {
          onSoftDismiss?.();
        },
      },
      {
        text: "Yes!",
        onPress: () => showFiveStarPrompt({ onSoftDismiss, onReviewed }),
      },
    ],
    { cancelable: false },
  );
}

/**
 * @param {{ onSoftDismiss?: () => void, onReviewed?: () => void }} [handlers]
 */
function showFiveStarPrompt(handlers = {}) {
  const { onSoftDismiss, onReviewed } = handlers;

  Alert.alert(
    "Rate STROMA",
    "Would you like to leave a 5-star review?",
    [
      {
        text: "Maybe Later",
        style: "cancel",
        onPress: () => {
          onSoftDismiss?.();
        },
      },
      {
        text: "Review Now",
        onPress: () => {
          void requestNativeReview().finally(() => {
            onReviewed?.();
          });
        },
      },
    ],
    { cancelable: false },
  );
}

async function requestNativeReview() {
  try {
    if (Platform.OS === "android") {
      await openStoreReviewPage();
      return;
    }

    const available = await StoreReview.hasAction();
    if (available) {
      await StoreReview.requestReview();
    } else {
      await openStoreReviewPage();
    }
  } catch (err) {
    console.warn("reviewPrompt: native review request failed", err?.message);
    await openStoreReviewPage();
  } finally {
    await markAsShown();
  }
}

async function openStoreReviewPage() {
  const storeUrl = StoreReview.storeUrl?.();
  if (!storeUrl) return;

  const supported = await Linking.canOpenURL(storeUrl);
  if (supported) {
    await Linking.openURL(storeUrl);
  }
}

async function markAsShown() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_HAS_SHOWN, "true");
  } catch (err) {
    console.warn("reviewPrompt: failed to persist hasShown", err?.message);
  }
}

function parseVideoPromptedIds(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).filter(Boolean);
  } catch (_err) {
    return [];
  }
}

async function markVideoPrompted(videoId, existingIds) {
  const id = String(videoId);
  const next = existingIds.includes(id) ? existingIds : [...existingIds, id];
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY_VIDEO_PROMPTED_IDS,
      JSON.stringify(next),
    );
  } catch (err) {
    console.warn(
      "reviewPrompt: failed to persist video prompted ids",
      err?.message,
    );
  }
}
