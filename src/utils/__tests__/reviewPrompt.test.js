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

  test("first show is due when never shown and not rated", () => {
    expect(
      isReviewRequestDue({
        hasRated: false,
        lastShownAt: null,
        now,
      }),
    ).toBe(true);
    expect(
      isReviewRequestDue({
        hasRated: false,
        lastShownAt: "",
        now,
      }),
    ).toBe(true);
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

  test("should show immediately, then hide until interval elapses", async () => {
    await expect(shouldShowReviewRequest("user-a")).resolves.toBe(true);
    await markReviewPromptShown("user-a");
    await expect(shouldShowReviewRequest("user-a")).resolves.toBe(false);
  });

  test("stops after 5-star mark even if never shown", async () => {
    await markAsRated("user-a");
    await expect(shouldShowReviewRequest("user-a")).resolves.toBe(false);
  });

  test("reset makes the prompt due again", async () => {
    await markAsRated("user-a");
    await markReviewPromptShown("user-a");
    await resetReviewPromptState("user-a");
    await expect(shouldShowReviewRequest("user-a")).resolves.toBe(true);
  });

  test("reset clears every account on the device", async () => {
    await markAsRated("user-a");
    await markAsRated("user-b");
    await markReviewPromptShown("user-a");
    await markReviewPromptShown("user-b");
    await resetReviewPromptState("user-a");
    await expect(shouldShowReviewRequest("user-a")).resolves.toBe(true);
    await expect(shouldShowReviewRequest("user-b")).resolves.toBe(true);
  });

  test("alternates copy index between the two variants", async () => {
    expect(REVIEW_REQUEST_VARIANTS).toHaveLength(2);
    await expect(takeNextReviewCopyIndex("user-a")).resolves.toBe(0);
    await expect(takeNextReviewCopyIndex("user-a")).resolves.toBe(1);
    await expect(takeNextReviewCopyIndex("user-a")).resolves.toBe(0);
  });
});
