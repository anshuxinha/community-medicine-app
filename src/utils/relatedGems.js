import gemsData from "../data/gemsData.json";

const RELATED_GEM_RE =
  /\[RELATED_GEM\]\s*([^:\]]+)\s*:\s*([^|\]]+)\s*\|\s*([^\[]+?)\s*\[\/RELATED_GEM\]/gi;

/** Build O(1) lookup: "sectionId:gemId" -> gem entry + section title */
export function buildGemLookup(data = gemsData) {
  const map = new Map();
  for (const section of data) {
    for (const gem of section.gems || []) {
      map.set(`${section.id}:${gem.id}`, {
        sectionId: section.id,
        sectionTitle: section.title,
        gemId: gem.id,
        title: gem.title,
        content: gem.content,
        contentKey: `gems:${section.id}:${gem.id}`,
      });
    }
  }
  return map;
}

const DEFAULT_LOOKUP = buildGemLookup();

/**
 * Parse related gems from structured field and/or [RELATED_GEM] tags in explanation.
 * Returns resolved gems with content when found in gemsData.
 */
export function getRelatedGemsForQuestion(question, lookup = DEFAULT_LOOKUP) {
  const found = new Map();

  const push = (sectionId, gemId, titleHint) => {
    if (!sectionId || !gemId) return;
    const key = `${sectionId}:${gemId}`;
    if (found.has(key)) return;
    const resolved = lookup.get(key);
    if (resolved) {
      found.set(key, resolved);
      return;
    }
    // Unresolved fallback (still show title if tagged)
    found.set(key, {
      sectionId,
      sectionTitle: "Study Gems",
      gemId,
      title: titleHint || key,
      content: "",
      contentKey: `gems:${sectionId}:${gemId}`,
      missing: true,
    });
  };

  const list = question?.relatedGems;
  if (Array.isArray(list)) {
    for (const item of list) {
      push(item.sectionId, item.gemId, item.title);
    }
  }

  const explanation = question?.explanation || "";
  let m;
  const re = new RegExp(RELATED_GEM_RE.source, RELATED_GEM_RE.flags);
  while ((m = re.exec(explanation)) !== null) {
    push(m[1].trim(), m[2].trim(), m[3].trim());
  }

  return Array.from(found.values()).filter((g) => !g.missing && g.content);
}

/** Remove RELATED_GEM tags for plain-text display */
export function stripRelatedGemTags(explanation = "") {
  return String(explanation)
    .replace(RELATED_GEM_RE, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function readingParamsForGem(gem) {
  return {
    id: gem.gemId,
    content: gem.content,
    title: gem.title,
    section: gem.sectionTitle,
    contentKey: gem.contentKey,
    isGem: true,
  };
}
