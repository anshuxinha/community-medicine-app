/**
 * Replace hardcoded light-mode hex inside createStyles(colors) blocks with tokens.
 */
const fs = require("fs");
const path = require("path");

const MAP = {
  "#FFFFFF": "colors.surfacePrimary",
  "#FFF": "colors.surfacePrimary",
  "#FBFCFE": "colors.backgroundMain",
  "#F3F4F6": "colors.surfaceSecondary",
  "#F9FAFB": "colors.surfaceTertiary",
  "#F8FAFC": "colors.surfaceMuted",
  "#E5E7EB": "colors.border",
  "#D1D5DB": "colors.borderStrong",
  "#111827": "colors.textTitle",
  "#1F2937": "colors.textPrimary",
  "#374151": "colors.textBody",
  "#4B5563": "colors.textSecondary",
  "#6B7280": "colors.textTertiary",
  "#9CA3AF": "colors.textPlaceholder",
  "#000000": "colors.textTitle",
  "#F3E8FF": "colors.primarySoft",
  "#EDE9FE": "colors.primaryLight",
  "#DDD6FE": "colors.primaryMuted",
  "#6B21A8": "colors.primary",
  "#581C87": "colors.primaryDark",
  "#8A2BE2": "colors.secondary",
  "#A855F7": "colors.secondary",
  "#9333EA": "colors.secondary",
  "#4CAF50": "colors.success",
  "#15803D": "colors.successStrong",
  "#047857": "colors.successStrong",
  "#DCFCE7": "colors.successSoft",
  "#EF4444": "colors.error",
  "#B91C1C": "colors.errorStrong",
  "#FEE2E2": "colors.errorLight",
  "#F59E0B": "colors.warning",
  "#FFFBEB": "colors.warningBackground",
  "#92400E": "colors.warningText",
  "#B45309": "colors.warningStrong",
  "#3B82F6": "colors.chartBlue",
  "#10B981": "colors.chartGreen",
  "#8B5CF6": "colors.chartPurple",
  "#D4A853": "colors.highlightBorder",
  "#FDFAF3": "colors.highlightBg",
  "#FEF9C3": "colors.userHighlightBg",
  "#FEF08A": "colors.userHighlightSentence",
  "#0D1B2A": "colors.inverseSurface",
  "#4C1D95": "colors.primaryDark",
  "#E8F5E9": "colors.successSoft",
};

function normalizeHex(hex) {
  let h = hex.toUpperCase();
  if (h.length === 4) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h;
}

function walk(dir, files = []) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (full.endsWith(".js") && !full.includes("__tests__")) files.push(full);
  }
  return files;
}

let total = 0;
for (const f of walk(path.join(__dirname, "../src/screens")).concat(
  walk(path.join(__dirname, "../src/components")),
)) {
  let s = fs.readFileSync(f, "utf8");
  const idx = s.indexOf("const createStyles");
  if (idx === -1) continue;
  const head = s.slice(0, idx);
  let tail = s.slice(idx);
  let n = 0;
  tail = tail.replace(/['"]#([0-9a-fA-F]{3,8})['"]/g, (m, raw) => {
    const hex = normalizeHex(`#${raw}`);
    const tok = MAP[hex] || MAP[hex.toLowerCase()] || MAP[`#${raw}`];
    if (tok) {
      n++;
      return tok;
    }
    return m;
  });
  if (n > 0) {
    fs.writeFileSync(f, head + tail);
    console.log(path.basename(f), n);
    total += n;
  }
}
console.log("total replacements", total);
