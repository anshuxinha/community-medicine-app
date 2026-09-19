import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  isReviewRequestDue,
  REVIEW_PROMPT_INTERVAL_MS,
  REVIEW_REQUEST_VARIANTS,
  takeNextReviewCopyIndex,
  resetReviewPromptState,
  shouldShowReviewRequest,
  markReviewPromptShown,
  markAsRated,
} from "../reviewPrompt";

const DAY = 24 * 60 * 60 * 1000;

describe("isReviewRequestDue", () => {
  const now = 1_700_000_000_000;

  test("first open is not due when never shown and not rated", () => {
    expect(
      isReviewRequestDue({
        hasRated: false,
        lastShownAt: null,
        now,
      }),
    ).toBe(false);
    expect(
      isReviewRequestDue({
        hasRated: false,
        lastShownAt: "",
        now,
      }),
    ).toBe(false);
  });

  test("is not due inside the 5-day window", () => {
    expect(
      isReviewRequestDue({
        hasRated: false,
        lastShownAt: now - 2 * DAY,
        now,
      }),
    ).toBe(false);
  });

  test("is due after 5 days", () => {
    expect(
      isReviewRequestDue({
        hasRated: false,
        lastShownAt: now - REVIEW_PROMPT_INTERVAL_MS,
        now,
      }),
    ).toBe(true);
    expect(
      isReviewRequestDue({
        hasRated: false,
        lastShownAt: now - 6 * DAY,
        now,
      }),
    ).toBe(true);
  });

  test("is not due after a 5-star path", () => {
    expect(
      isReviewRequestDue({
        hasRated: true,
        lastShownAt: null,
        now,
      }),
    ).toBe(false);
    expect(
      isReviewRequestDue({
        hasRated: true,
        lastShownAt: now - 10 * DAY,
        now,
      }),
    ).toBe(false);
  });
});

describe("reviewPrompt storage cadence", () => {
  beforeEach(async () => {
    await resetReviewPromptState("user-a");
  });

  test("first open starts the 5-day clock without showing", async () => {
    await expect(shouldShowReviewRequest("user-a")).resolves.toBe(false);
    const stored = await AsyncStorage.getItem("reviewPrompt_lastShownAt:user-a");
    expect(Number(stored)).toBeGreaterThan(0);
    await expect(shouldShowReviewRequest("user-a")).resolves.toBe(false);
  });

  test("shows after the 5-day clock from first open", async () => {
    await shouldShowReviewRequest("user-a");
    await AsyncStorage.setItem(
      "reviewPrompt_lastShownAt:user-a",
      String(Date.now() - REVIEW_PROMPT_INTERVAL_MS),
    );
    await expect(shouldShowReviewRequest("user-a")).resolves.toBe(true);
    await markReviewPromptShown("user-a");
    await expect(shouldShowReviewRequest("user-a")).resolves.toBe(false);
  });

  test("stops after 5-star mark even if never shown", async () => {
    await markAsRated("user-a");
    await expect(shouldShowReviewRequest("user-a")).resolves.toBe(false);
  });

  test("stops after feedback mark even after the 5-day clock", async () => {
    await shouldShowReviewRequest("user-a");
    await markAsRated("user-a");
    await AsyncStorage.setItem(
      "reviewPrompt_lastShownAt:user-a",
      String(Date.now() - 6 * DAY),
    );
    await expect(shouldShowReviewRequest("user-a")).resolves.toBe(false);
  });

  test("reset restarts the 5-day clock without showing immediately", async () => {
    await markAsRated("user-a");
    await markReviewPromptShown("user-a");
    await resetReviewPromptState("user-a");
    await expect(shouldShowReviewRequest("user-a")).resolves.toBe(false);
    const stored = await AsyncStorage.getItem("reviewPrompt_lastShownAt:user-a");
    expect(Number(stored)).toBeGreaterThan(0);
  });

  test("reset clears every account on the device", async () => {
    await markAsRated("user-a");
    await markAsRated("user-b");
    await markReviewPromptShown("user-a");
    await markReviewPromptShown("user-b");
    await resetReviewPromptState("user-a");
    await expect(shouldShowReviewRequest("user-a")).resolves.toBe(false);
    await expect(shouldShowReviewRequest("user-b")).resolves.toBe(false);
  });

  test("rotates copy index through five variants", async () => {
    expect(REVIEW_REQUEST_VARIANTS).toHaveLength(5);
    REVIEW_REQUEST_VARIANTS.forEach((copy) => {
      expect(copy.title.length).toBeGreaterThan(0);
      expect(copy.body.length).toBeGreaterThan(0);
    });
    await expect(takeNextReviewCopyIndex("user-a")).resolves.toBe(0);
    await expect(takeNextReviewCopyIndex("user-a")).resolves.toBe(1);
    await expect(takeNextReviewCopyIndex("user-a")).resolves.toBe(2);
    await expect(takeNextReviewCopyIndex("user-a")).resolves.toBe(3);
    await expect(takeNextReviewCopyIndex("user-a")).resolves.toBe(4);
    await expect(takeNextReviewCopyIndex("user-a")).resolves.toBe(0);
  });
});
