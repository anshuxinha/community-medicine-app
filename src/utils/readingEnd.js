export const REACH_END_PIXELS = 120;
export const SHORT_CONTENT_TOLERANCE = 24;
export const MIN_SCROLL_TO_COUNT_AS_END = 24;

/**
 * Classify whether the reader has reached the end of a chapter.
 *
 * Returns:
 * - "not-ready": still paging in blocks, or missing layout numbers
 * - "reading": long content and the user is not near the bottom
 * - "reached": user scrolled down to the bottom
 * - "pending-fit": offset is ~0 and remaining space is small (short chapter
 *   or a first layout that has not grown yet). Caller must wait until height
 *   is stable before completing.
 */
export const classifyReadingEnd = ({
  contentOffsetY = 0,
  viewportHeight = 0,
  contentHeight = 0,
  allBlocksVisible = false,
  bottomPadding = 0,
} = {}) => {
  if (!allBlocksVisible) return "not-ready";
  if (!(contentHeight > 0) || !(viewportHeight > 0)) return "not-ready";

  const offset = Math.max(0, Number(contentOffsetY) || 0);
  const remaining = contentHeight - viewportHeight - offset;
  const readableHeight = contentHeight - Math.max(0, Number(bottomPadding) || 0);
  const readableOverflow = readableHeight - viewportHeight;

  if (readableOverflow <= SHORT_CONTENT_TOLERANCE) {
    return "pending-fit";
  }

  if (remaining > REACH_END_PIXELS) {
    return "reading";
  }

  if (offset >= MIN_SCROLL_TO_COUNT_AS_END) {
    return "reached";
  }

  return "pending-fit";
};
