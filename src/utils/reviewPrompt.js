import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const STORAGE_KEY_HAS_SHOWN = "reviewPrompt_hasShown";
const STORAGE_KEY_LAST_PROGRESS = "reviewPrompt_lastProgress";

/**
 * Evaluate whether to show the in-app review pre-prompt.
 *
 * Uses the same readingProgress value displayed on the Dashboard
 * progress bar (0–1 fraction), converted to an integer percentage.
 *
 * Trigger: first time percentage >= 1% AND has increased by at least
 *          1 percentage point since the last evaluation.
 *
 * For existing users updating to this version, the first call seeds
 * lastProgressTracked with the current value and skips the prompt,
 * so they only see it after reading their next chapter.
 *
 * The prompt fires at most ONCE in the app's entire lifetime.
 *
 * @param {number} readingProgress - 0–1 fraction (same as Dashboard bar)
 */
export async function maybePromptReview(readingProgress) {
  try {
    const currentPercent = Math.round(readingProgress * 100);

    const [rawHasShown, rawLastProgress] = await AsyncStorage.multiGet([
      STORAGE_KEY_HAS_SHOWN,
      STORAGE_KEY_LAST_PROGRESS,
    ]);

    const hasShownReview = rawHasShown[1] === "true";

    // Seed for existing users: key has never been set but progress > 0
    if (rawLastProgress[1] === null && currentPercent > 0) {
      await AsyncStorage.setItem(
        STORAGE_KEY_LAST_PROGRESS,
        String(currentPercent),
      );
      return;
    }

    const lastProgressTracked = Number(rawLastProgress[1]) || 0;

    if (
      !hasShownReview &&
      currentPercent >= 1 &&
      currentPercent >= lastProgressTracked + 1
    ) {
      showPrePrompt();
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

function showPrePrompt() {
  Alert.alert(
    "Enjoying STROMA?",
    "Are you finding the app helpful so far?",
    [
      {
        text: "Not Really",
        style: "cancel",
        onPress: () => markAsShown(),
      },
      {
        text: "Yes!",
        onPress: () => requestNativeReview(),
      },
    ],
    { cancelable: false },
  );
}

async function requestNativeReview() {
  try {
    const available = await StoreReview.hasAction();
    if (available) {
      await StoreReview.requestReview();
    }
  } catch (err) {
    console.warn("reviewPrompt: native review request failed", err?.message);
  } finally {
    await markAsShown();
  }
}

async function markAsShown() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_HAS_SHOWN, "true");
  } catch (err) {
    console.warn("reviewPrompt: failed to persist hasShown", err?.message);
  }
}
