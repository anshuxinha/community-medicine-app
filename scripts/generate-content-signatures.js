/**
 * Writes src/data/contentSignatures.json from bundled library JSON.
 * Hash algorithm must stay identical to getContentSignature in
 * src/utils/contentRegistry.js (stored readItemVersions depend on it).
 *
 * Usage: node scripts/generate-content-signatures.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MOCK_PATH = path.join(ROOT, "src", "data", "mockData.json");
const PRACTICAL_PATH = path.join(ROOT, "src", "data", "practical.json");
const OUT_PATH = path.join(ROOT, "src", "data", "contentSignatures.json");

const normalizeUpdatedSnippet = (value = "") =>
  value
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#{1,2}\s+/, "")
    .replace(/^\s*[-*]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();

const getContentKey = (section, id) => `${section}:${String(id)}`;

const hashString = (value) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return `v${Math.abs(hash).toString(36)}`;
};

const getContentSignature = (item = {}) => {
  const payload = JSON.stringify({
    title: item.title || "",
    content: item.content || "",
    updatedSegments: Array.isArray(item.updatedSegments)
      ? item.updatedSegments.map(normalizeUpdatedSnippet)
      : [],
  });
  return hashString(payload);
};

const walkLeaves = (items, section, visitor, rootChapterId = null) => {
  if (!Array.isArray(items)) return;
  items.forEach((item) => {
    const currentRoot =
      rootChapterId !== null && rootChapterId !== undefined
        ? String(rootChapterId)
        : String(item.id);
    if (Array.isArray(item.subsections) && item.subsections.length > 0) {
      walkLeaves(item.subsections, section, visitor, currentRoot);
      return;
    }
    visitor(item, section, currentRoot);
  });
};

const theory = JSON.parse(fs.readFileSync(MOCK_PATH, "utf8"));
const practical = JSON.parse(fs.readFileSync(PRACTICAL_PATH, "utf8"));

const signatures = {};
walkLeaves(theory, "theory", (item, section) => {
  signatures[getContentKey(section, item.id)] = getContentSignature(item);
});
walkLeaves(practical, "practical", (item, section) => {
  signatures[getContentKey(section, item.id)] = getContentSignature(item);
});

const ordered = {};
Object.keys(signatures)
  .sort()
  .forEach((key) => {
    ordered[key] = signatures[key];
  });

fs.writeFileSync(OUT_PATH, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");
console.log(
  `Wrote ${Object.keys(ordered).length} signatures to ${path.relative(ROOT, OUT_PATH)}`,
);
