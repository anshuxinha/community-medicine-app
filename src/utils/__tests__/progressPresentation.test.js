import { progressToPercent } from "../progressPresentation";

describe("progressToPercent", () => {
  test("converts fractions to integer percent", () => {
    expect(progressToPercent(0)).toBe(0);
    expect(progressToPercent(0.125)).toBe(13);
    expect(progressToPercent(1)).toBe(100);
  });

  test("clamps out-of-range values", () => {
    expect(progressToPercent(-0.2)).toBe(0);
    expect(progressToPercent(1.5)).toBe(100);
  });

  test("handles invalid input", () => {
    expect(progressToPercent(undefined)).toBe(0);
    expect(progressToPercent(null)).toBe(0);
    expect(progressToPercent(NaN)).toBe(0);
  });
});
