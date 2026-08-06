import { Alert, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const STORAGE_KEY_HAS_SHOWN = "reviewPrompt_hasShown";
const STORAGE_KEY_HAS_RATED = "reviewPrompt_hasRated";
const STORAGE_KEY_LAST_PROGRESS = "reviewPrompt_lastProgress";
const STORAGE_KEY_RESET_VERSION = "reviewPrompt_resetVersion";
const REVIEW_PROMPT_RESET_VERSION = "2026-05-04-review-flow-fix";

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
  // Modal not mounted yet; still run soft-dismiss side effects.
  handlers.onSoftDismiss?.();
}

/**
 * Whether the user has already completed the 5-star native review path.
 * Play/App Store APIs do not report stars submitted; we treat "tapped 5 and
 * launched the in-app review SDK" as rated so the CTA can stop showing.
 * @returns {Promise<boolean>}
 */
export async function getHasRatedFiveStarReview() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_HAS_RATED);
    return raw === "true";
  } catch (err) {
    console.warn("reviewPrompt: failed to read hasRated", err?.message);
    return false;
  }
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
          // Ask for improvement feedback; soft-dismiss runs after submit/skip.
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
 * Launch platform in-app review (Play In-App Review / StoreKit) when available.
 * Falls back to the public store listing URL.
 *
 * @param {{ markRated?: boolean }} [options]
 *   When markRated is true (default for the 5-star CTA), persist hasRated so
 *   the chapter-complete CTA stops showing. Store SDKs do not confirm stars.
 */
export async function requestNativeStoreReview(options = {}) {
  const markRated = options.markRated !== false;

  try {
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
    if (markRated) {
      await markAsRated();
    }
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

export async function markAsRated() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_HAS_RATED, "true");
  } catch (err) {
    console.warn("reviewPrompt: failed to persist hasRated", err?.message);
  }
}
