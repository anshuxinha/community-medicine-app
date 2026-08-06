import { Alert, InteractionManager, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const STORAGE_KEY_HAS_SHOWN = "reviewPrompt_hasShown";
const STORAGE_KEY_HAS_RATED = "reviewPrompt_hasRated";
const STORAGE_KEY_LAST_PROGRESS = "reviewPrompt_lastProgress";
const STORAGE_KEY_RESET_VERSION = "reviewPrompt_resetVersion";
const REVIEW_PROMPT_RESET_VERSION = "2026-05-04-review-flow-fix";

const ANDROID_PACKAGE = "com.communitymed.app";
const ANDROID_PLAY_WEB_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
const ANDROID_MARKET_URL = `market://details?id=${ANDROID_PACKAGE}`;

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
 * Launch platform in-app review (Play In-App Review / StoreKit) when available.
 * Falls back to the public store listing URL.
 *
 * Callers that show a modal must dismiss it first and await waitForUiSettle()
 * before this, or the native review UI often never appears on Android.
 *
 * @param {{ markRated?: boolean, preferStoreListing?: boolean }} [options]
 *   When markRated is true (default for the 5-star CTA), persist hasRated so
 *   the chapter-complete CTA stops showing. Store SDKs do not confirm stars.
 *   preferStoreListing: skip in-app API and open the store page (rare).
 */
export async function requestNativeStoreReview(options = {}) {
  const markRated = options.markRated !== false;
  const preferStoreListing = options.preferStoreListing === true;

  try {
    if (!preferStoreListing) {
      // Always attempt the native flow first when the platform reports support.
      // hasAction can be true while the dialog still fails (quota / overlay);
      // we still try, then fall back to the store page only if the API rejects.
      let available = false;
      try {
        available = await StoreReview.hasAction();
      } catch (_err) {
        available = false;
      }

      if (available) {
        try {
          await StoreReview.requestReview();
          // Success path: requestReview resolves even when the OS decides not
          // to show UI (quota). That is expected; we still mark rated for CTA.
          return;
        } catch (err) {
          console.warn(
            "reviewPrompt: requestReview threw, falling back to store",
            err?.message,
          );
        }
      }
    }

    await openStoreReviewPage();
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
  const candidates = [];

  try {
    const fromExpo = StoreReview.storeUrl?.();
    if (fromExpo) {
      candidates.push(fromExpo);
    }
  } catch (_err) {
    // ignore
  }

  if (Platform.OS === "android") {
    candidates.push(ANDROID_MARKET_URL, ANDROID_PLAY_WEB_URL);
  }

  const seen = new Set();
  for (const url of candidates) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return;
      }
    } catch (err) {
      console.warn("reviewPrompt: openURL failed for", url, err?.message);
    }
  }

  // Last resort: try Play web URL without canOpenURL (some devices lie).
  if (Platform.OS === "android") {
    try {
      await Linking.openURL(ANDROID_PLAY_WEB_URL);
    } catch (err) {
      console.warn("reviewPrompt: final store open failed", err?.message);
    }
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
