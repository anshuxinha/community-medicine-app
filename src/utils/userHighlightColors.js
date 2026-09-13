export const HIGHLIGHT_COLOR_IDS = ["yellow", "green", "pink"];
export const DEFAULT_HIGHLIGHT_COLOR = "yellow";

export const HIGHLIGHT_COLOR_SWATCHES = {
  yellow: "#EAB308",
  green: "#22C55E",
  pink: "#EC4899",
};

export const HIGHLIGHT_COLOR_LABELS = {
  yellow: "Yellow highlight",
  green: "Green highlight",
  pink: "Pink highlight",
};

export function normalizeHighlightColor(value) {
  if (!value) return null;
  if (value === true || value === DEFAULT_HIGHLIGHT_COLOR) {
    return DEFAULT_HIGHLIGHT_COLOR;
  }
  if (HIGHLIGHT_COLOR_IDS.includes(value)) return value;
  return DEFAULT_HIGHLIGHT_COLOR;
}

export function nextHighlightValue(current, selectedColor) {
  const currentId = normalizeHighlightColor(current);
  const nextId = HIGHLIGHT_COLOR_IDS.includes(selectedColor)
    ? selectedColor
    : DEFAULT_HIGHLIGHT_COLOR;
  if (currentId === nextId) return null;
  return nextId;
}
