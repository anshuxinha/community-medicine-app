import {
  FEEDBACK_KIND_VIDEO_REQUEST,
  VIDEO_REQUEST_SOURCE,
  buildVideoRequestMessage,
  isVideoRequestItem,
} from "../feedbackService";

jest.mock("../../config/firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  serverTimestamp: jest.fn(),
}));

describe("feedbackService helpers", () => {
  test("buildVideoRequestMessage includes topic, category, and details", () => {
    expect(
      buildVideoRequestMessage({
        topic: "  Screening tests  ",
        details: "Cover sensitivity and specificity.",
        categoryLabel: "Lectures",
      }),
    ).toBe(
      "Topic: Screening tests\nCategory: Lectures\n\nCover sensitivity and specificity.",
    );
  });

  test("buildVideoRequestMessage omits empty optional lines", () => {
    expect(buildVideoRequestMessage({ topic: "Bias" })).toBe("Topic: Bias");
  });

  test("buildVideoRequestMessage supports topic and details without category", () => {
    expect(
      buildVideoRequestMessage({
        topic: "Bias",
        details: "Selection vs information.",
      }),
    ).toBe("Topic: Bias\n\nSelection vs information.");
  });

  test("isVideoRequestItem detects kind and source", () => {
    expect(isVideoRequestItem({ kind: FEEDBACK_KIND_VIDEO_REQUEST })).toBe(
      true,
    );
    expect(isVideoRequestItem({ source: VIDEO_REQUEST_SOURCE })).toBe(true);
    expect(isVideoRequestItem({ source: "review_prompt_negative" })).toBe(
      false,
    );
    expect(isVideoRequestItem(undefined)).toBe(false);
  });
});
