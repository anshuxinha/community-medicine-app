import {
  classifyReadingEnd,
  REACH_END_PIXELS,
  SHORT_CONTENT_TOLERANCE,
  MIN_SCROLL_TO_COUNT_AS_END,
} from "../readingEnd";

const longLayout = {
  viewportHeight: 700,
  contentHeight: 5000,
  allBlocksVisible: true,
  bottomPadding: 114,
};

describe("classifyReadingEnd", () => {
  test("waits until every block is on screen", () => {
    expect(
      classifyReadingEnd({
        ...longLayout,
        allBlocksVisible: false,
        contentOffsetY: 0,
      }),
    ).toBe("not-ready");
  });

  test("ignores missing layout measurements", () => {
    expect(
      classifyReadingEnd({
        allBlocksVisible: true,
        contentOffsetY: 0,
        viewportHeight: 0,
        contentHeight: 5000,
      }),
    ).toBe("not-ready");
    expect(
      classifyReadingEnd({
        allBlocksVisible: true,
        contentOffsetY: 0,
        viewportHeight: 700,
        contentHeight: 0,
      }),
    ).toBe("not-ready");
  });

  test("does not complete a long chapter while still at the top", () => {
    expect(classifyReadingEnd({ ...longLayout, contentOffsetY: 0 })).toBe(
      "reading",
    );
  });

  test("does not treat a first undersized layout as reached", () => {
    expect(
      classifyReadingEnd({
        allBlocksVisible: true,
        contentOffsetY: 0,
        viewportHeight: 700,
        contentHeight: 700,
        bottomPadding: 114,
      }),
    ).toBe("pending-fit");
  });

  test("does not complete when progress would have been 1 because nothing was scrollable yet", () => {
    expect(
      classifyReadingEnd({
        allBlocksVisible: true,
        contentOffsetY: 0,
        viewportHeight: 700,
        contentHeight: 680,
        bottomPadding: 80,
      }),
    ).toBe("pending-fit");
  });

  test("marks reached after the user scrolls to the bottom", () => {
    const contentOffsetY = longLayout.contentHeight - longLayout.viewportHeight - 40;
    expect(classifyReadingEnd({ ...longLayout, contentOffsetY })).toBe(
      "reached",
    );
    expect(contentOffsetY).toBeGreaterThanOrEqual(MIN_SCROLL_TO_COUNT_AS_END);
  });

  test("stays reading until within the bottom pixel window", () => {
    const contentOffsetY =
      longLayout.contentHeight -
      longLayout.viewportHeight -
      (REACH_END_PIXELS + 40);
    expect(classifyReadingEnd({ ...longLayout, contentOffsetY })).toBe(
      "reading",
    );
  });

  test("pending-fit for readable content that fits besides bottom padding", () => {
    expect(
      classifyReadingEnd({
        allBlocksVisible: true,
        contentOffsetY: 0,
        viewportHeight: 700,
        contentHeight: 700 + 114,
        bottomPadding: 114,
      }),
    ).toBe("pending-fit");
  });

  test("short content stays pending-fit so a first layout cannot complete it", () => {
    expect(
      classifyReadingEnd({
        allBlocksVisible: true,
        contentOffsetY: 8,
        viewportHeight: 700,
        contentHeight: 700 + SHORT_CONTENT_TOLERANCE,
        bottomPadding: 0,
      }),
    ).toBe("pending-fit");
  });
});
