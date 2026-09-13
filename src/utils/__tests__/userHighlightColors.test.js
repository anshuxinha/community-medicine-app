import {
  DEFAULT_HIGHLIGHT_COLOR,
  normalizeHighlightColor,
  nextHighlightValue,
} from "../userHighlightColors";

describe("normalizeHighlightColor", () => {
  test("maps true and yellow to yellow", () => {
    expect(normalizeHighlightColor(true)).toBe("yellow");
    expect(normalizeHighlightColor("yellow")).toBe("yellow");
  });

  test("passes through green and pink", () => {
    expect(normalizeHighlightColor("green")).toBe("green");
    expect(normalizeHighlightColor("pink")).toBe("pink");
  });

  test("returns null for empty values", () => {
    expect(normalizeHighlightColor(undefined)).toBeNull();
    expect(normalizeHighlightColor(null)).toBeNull();
    expect(normalizeHighlightColor(false)).toBeNull();
    expect(normalizeHighlightColor("")).toBeNull();
  });

  test("falls unknown truthy values back to yellow", () => {
    expect(normalizeHighlightColor("blue")).toBe("yellow");
    expect(normalizeHighlightColor(1)).toBe("yellow");
  });
});

describe("nextHighlightValue", () => {
  test("sets the selected color when none is present", () => {
    expect(nextHighlightValue(undefined, "green")).toBe("green");
    expect(nextHighlightValue(false, "pink")).toBe("pink");
  });

  test("clears when the same color is applied again", () => {
    expect(nextHighlightValue("green", "green")).toBeNull();
    expect(nextHighlightValue(true, "yellow")).toBeNull();
  });

  test("recolors when a different color is applied", () => {
    expect(nextHighlightValue(true, "pink")).toBe("pink");
    expect(nextHighlightValue("green", "yellow")).toBe("yellow");
  });

  test("falls unknown selected colors back to yellow on apply", () => {
    expect(nextHighlightValue(undefined, "blue")).toBe(DEFAULT_HIGHLIGHT_COLOR);
    expect(nextHighlightValue("green", "blue")).toBe(DEFAULT_HIGHLIGHT_COLOR);
    expect(nextHighlightValue(true, "not-a-color")).toBeNull();
  });
});
