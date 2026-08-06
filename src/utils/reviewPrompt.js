import { Alert, InteractionManager, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const STORAGE_KEY_HAS_SHOWN = "reviewPrompt_hasShown";
const STORAGE_KEY_HAS_RATED = "reviewPrompt_hasRated";
const STORAGE_KEY_LAST_PROGRESS = "reviewPrompt_lastProgress";
const STORAGE_KEY_RESET_VERSION = "reviewPrompt_resetVersion";
/** Bump to re-show the chapter-complete review CTA for all devices once. */
const REVIEW_PROMPT_RESET_VERSION = "2026-08-06-chapter-complete-retest";

const ANDROID_PACKAGE = "com.communitymed.app";
/** HTTPS listing: works with package-visibility https queries in the manifest. */
const ANDROID_PLAY_WEB_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
const ANDROID_MARKET_URL = `market://details?id=${ANDROID_PACKAGE}`;
/** Opens the Play write-review surface when supported by the store app. */
const ANDROID_PLAY_REVIEW_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&showAllReviews=true`;

/** Opens the global feedback modal (registered by ReviewFeedbackModal). */
let openFeedbackFormHandler = null;

/**
 * Register the UI that shows the post-"Not Really" feedback form.
 * @param {(handlers: { onSoftDismiss?: () => void }) => void} handler
 * @returns {() => void} unregister
 */
export function registerOpenFeedbackForm(handler) {
  openFeedbackFormHandler = handler;
  return () => {
    if (openFeedbackFormHandler === handler) {
      openFeedbackFormHandler = null;
    }
  };
}

/**
 * @param {{ onSoftDismiss?: () => void }} [handlers]
 */
function showFeedbackForm(handlers = {}) {
  if (typeof openFeedbackFormHandler === "function") {
    openFeedbackFormHandler(handlers);
    return;
  }
  handlers.onSoftDismiss?.();
}

/**
 * Clear local review CTA flags (device AsyncStorage, not cloud).
 * Used for admin retesting and one-time version migrations.
 * @returns {Promise<void>}
 */
export async function resetReviewPromptState() {
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEY_HAS_SHOWN, "false"],
      [STORAGE_KEY_HAS_RATED, "false"],
      [STORAGE_KEY_LAST_PROGRESS, "0"],
      [STORAGE_KEY_RESET_VERSION, REVIEW_PROMPT_RESET_VERSION],
    ]);
  } catch (err) {
    console.warn("reviewPrompt: failed to reset state", err?.message);
  }
}

/**
 * One-time migration when REVIEW_PROMPT_RESET_VERSION changes.
 * Clears hasRated so the chapter-complete 5-star CTA can show again.
 * @returns {Promise<boolean>} true if a reset was applied
 */
export async function ensureReviewPromptMigrated() {
  try {
    const rawVersion = await AsyncStorage.getItem(STORAGE_KEY_RESET_VERSION);
    if (rawVersion === REVIEW_PROMPT_RESET_VERSION) {
      return false;
    }
    await resetReviewPromptState();
    return true;
  } catch (err) {
    console.warn("reviewPrompt: migration failed", err?.message);
    return false;
  }
}

/**
 * Whether the user has already completed the 5-star native review path.
 * Play/App Store APIs do not report stars submitted; we treat "tapped 5 and
 * launched the review flow" as rated so the CTA can stop showing.
 *
 * State is device-local AsyncStorage (not tied to Firebase user id).
 * @returns {Promise<boolean>}
 */
export async function getHasRatedFiveStarReview() {
  try {
    await ensureReviewPromptMigrated();
    const raw = await AsyncStorage.getItem(STORAGE_KEY_HAS_RATED);
    return raw === "true";
  } catch (err) {
    console.warn("reviewPrompt: failed to read hasRated", err?.message);
    return false;
  }
}

/**
 * Wait until interactions finish, then an extra frame for modals to unmount.
 * Native in-app review often fails silently while a Paper Dialog is still up.
 * @param {number} [extraMs]
 * @returns {Promise<void>}
 */
export function waitForUiSettle(extraMs = 400) {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(resolve, extraMs);
    });
  });
}

/**
 * Evaluate whether to show the legacy Alert in-app review pre-prompt.
 *
 * Prefer the chapter-complete sheet CTA (`ChapterCompleteSheet`). This
 * function is retained for optional call sites but no longer auto-fires
 * from AppContext after progress changes.
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
      await resetReviewPromptState();
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

    await AsyncStorage.setItem(
      STORAGE_KEY_LAST_PROGRESS,
      String(currentPercent),
    );
  } catch (err) {
    console.warn("reviewPrompt: evaluation failed", err?.message);
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
          showFeedbackForm({ onSoftDismiss });
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
    "Leave a 5-star review ⭐⭐⭐⭐⭐",
    "If you're enjoying STROMA, please tap all 5 stars in the store. A 5-star rating helps other students find us. Thank you!",
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
          void requestNativeStoreReview({ markRated: true }).finally(() => {
            onReviewed?.();
          });
        },
      },
    ],
    { cancelable: false },
  );
}

/**
 * Try Play / App Store in-app review, then always open the store listing for
 * explicit user taps (5-star CTA).
 *
 * Why store always opens after: `StoreReview.requestReview()` often resolves
 * successfully without showing any UI (Play quota / policy). Returning early
 * on that promise left users with no dialog and no store page.
 *
 * Callers that show a modal must dismiss it first and await waitForUiSettle().
 *
 * @param {{ markRated?: boolean, openStoreListing?: boolean }} [options]
 *   openStoreListing defaults true for user-initiated rate actions.
 */
export async function requestNativeStoreReview(options = {}) {
  const markRated = options.markRated !== false;
  const openStoreListing = options.openStoreListing !== false;

  try {
    // 1) Prefer native in-app review when the module reports support.
    //    Do not use hasAction() alone: it is true merely if playStoreUrl is set.
    let nativeAvailable = false;
    try {
      if (typeof StoreReview.isAvailableAsync === "function") {
        nativeAvailable = await StoreReview.isAvailableAsync();
      }
    } catch (err) {
      console.warn("reviewPrompt: isAvailableAsync failed", err?.message);
      nativeAvailable = false;
    }

    if (nativeAvailable) {
      try {
        await StoreReview.requestReview();
      } catch (err) {
        console.warn(
          "reviewPrompt: requestReview threw",
          err?.message,
        );
      }
    }

    // 2) Always open the store listing for explicit rate CTAs so the user
    //    always sees a review surface even when the OS suppresses the native UI.
    if (openStoreListing) {
      await openStoreReviewPage();
    }
  } catch (err) {
    console.warn("reviewPrompt: native review request failed", err?.message);
    if (openStoreListing) {
      await openStoreReviewPage();
    }
  } finally {
    await markAsShown();
    if (markRated) {
      await markAsRated();
    }
  }
}

/**
 * Open the public store listing. Prefer HTTPS Play URL (manifest allows
 * https VIEW intents). Do not gate on canOpenURL for market:// (often false
 * under Android package visibility).
 * @returns {Promise<boolean>} true if openURL was invoked without throw
 */
async function openStoreReviewPage() {
  const candidates = [];

  if (Platform.OS === "android") {
    candidates.push(
      ANDROID_PLAY_REVIEW_URL,
      ANDROID_PLAY_WEB_URL,
      ANDROID_MARKET_URL,
    );
  }

  try {
    const fromExpo = StoreReview.storeUrl?.();
    if (fromExpo) {
      candidates.push(fromExpo);
    }
  } catch (_err) {
    // ignore
  }

  const seen = new Set();
  for (const url of candidates) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    try {
      // Do not require canOpenURL: it is unreliable for market:// and some
      // Play hosts. Try openURL directly (same pattern as Profile Rate App).
      await Linking.openURL(url);
      return true;
    } catch (err) {
      console.warn("reviewPrompt: openURL failed for", url, err?.message);
    }
  }

  return false;
}

async function markAsShown() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_HAS_SHOWN, "true");
  } catch (err) {
    console.warn("reviewPrompt: failed to persist hasShown", err?.message);
  }
}

export async function markAsRated() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_HAS_RATED, "true");
  } catch (err) {
    console.warn("reviewPrompt: failed to persist hasRated", err?.message);
  }
}
