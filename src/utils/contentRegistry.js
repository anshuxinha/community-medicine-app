import baseMockData from "../data/mockData.json";
import basePracticalData from "../data/practical.json";

const cloneDeep = (value) => JSON.parse(JSON.stringify(value));

export const CONTENT_SECTIONS = {
  theory: [],
  practical: [],
};

export const normalizeUpdatedSnippet = (value = "") =>
  value
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#{1,2}\s+/, "")
    .replace(/^\s*[-*]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();

export const getContentKey = (section, id) => `${section}:${String(id)}`;

const hashString = (value) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return `v${Math.abs(hash).toString(36)}`;
};

export const getContentSignature = (item = {}) => {
  const payload = JSON.stringify({
    title: item.title || "",
    content: item.content || "",
    updatedSegments: Array.isArray(item.updatedSegments)
      ? item.updatedSegments.map(normalizeUpdatedSnippet)
      : [],
  });
  return hashString(payload);
};

export const walkContentItems = (items, section, visitor) => {
  if (!Array.isArray(items)) return;
  items.forEach((item) => {
    visitor(item, section);
    if (Array.isArray(item.subsections) && item.subsections.length > 0) {
      walkContentItems(item.subsections, section, visitor);
    }
  });
};

export const LEAF_CONTENT_ENTRIES = [];
export let TOTAL_LEAF_CONTENT_ITEMS = 0;
export const VALID_CONTENT_KEYS = new Set();
export const VALID_MASTER_TITLES = new Set();
export const CONTENT_ENTRY_BY_KEY = new Map();
export const CONTENT_ENTRIES_BY_TITLE = new Map();

const replaceArrayContents = (target, next) => {
  target.splice(0, target.length, ...next);
};

const findItemById = (items, targetId) => {
  for (const item of items) {
    if (String(item?.id) === String(targetId)) {
      return item;
    }

    if (Array.isArray(item?.subsections) && item.subsections.length > 0) {
      const match = findItemById(item.subsections, targetId);
      if (match) {
        return match;
      }
    }
  }

  return null;
};

const applyOverrideToTheory = (theoryItems, override) => {
  const libraryId = override?.libraryId ?? override?.id;
  if (libraryId === undefined || libraryId === null) {
    return;
  }

  const targetItem = findItemById(theoryItems, libraryId);
  if (!targetItem) {
    return;
  }

  if (typeof override.proposedContent === "string" && override.proposedContent.trim()) {
    targetItem.content = override.proposedContent;
  }

  if (typeof override.libraryTitle === "string" && override.libraryTitle.trim()) {
    targetItem.title = override.libraryTitle;
  }

  targetItem.recentlyUpdated = true;
  targetItem.updatedSegments = Array.isArray(override.updatedSegments)
    ? override.updatedSegments
    : [];
  targetItem.overrideMetadata = {
    proposalId: override.proposalId || null,
    approvedAt: override.approvedAt || null,
    approvedBy: override.approvedBy || null,
  };
};

const getActiveOverrides = (approvedOverrides = []) =>
  approvedOverrides.filter(
    (override) =>
      override &&
      (override.status === "active" || override.status === "approved") &&
      typeof override.proposedContent === "string",
  );

// Practical content is never patched by overrides — always share the base array.
// Theory is shared by reference when there are no overrides (cold start), and
// deep-cloned only when overrides must be applied so baseMockData stays pure.
const buildSections = (approvedOverrides = []) => {
  const activeOverrides = getActiveOverrides(approvedOverrides);

  if (activeOverrides.length === 0) {
    return { theory: baseMockData, practical: basePracticalData, cloned: false };
  }

  const theory = cloneDeep(baseMockData);
  activeOverrides.forEach((override) => applyOverrideToTheory(theory, override));
  return { theory, practical: basePracticalData, cloned: true };
};

const rebuildDerivedIndexes = () => {
  LEAF_CONTENT_ENTRIES.splice(0, LEAF_CONTENT_ENTRIES.length);
  VALID_CONTENT_KEYS.clear();
  VALID_MASTER_TITLES.clear();
  CONTENT_ENTRY_BY_KEY.clear();
  CONTENT_ENTRIES_BY_TITLE.clear();

  Object.entries(CONTENT_SECTIONS).forEach(([section, items]) => {
    walkContentItems(items, section, (item, activeSection) => {
      if (Array.isArray(item.subsections) && item.subsections.length > 0) {
        return;
      }

      const entry = {
        key: getContentKey(activeSection, item.id),
        section: activeSection,
        id: String(item.id),
        title: item.title || "",
        recentlyUpdated: item.recentlyUpdated === true,
        signature: getContentSignature(item),
        item,
      };

      LEAF_CONTENT_ENTRIES.push(entry);
      VALID_CONTENT_KEYS.add(entry.key);
      VALID_MASTER_TITLES.add(entry.title);
      CONTENT_ENTRY_BY_KEY.set(entry.key, entry);

      const existingEntries = CONTENT_ENTRIES_BY_TITLE.get(entry.title) || [];
      existingEntries.push(entry);
      CONTENT_ENTRIES_BY_TITLE.set(entry.title, existingEntries);
    });
  });

  TOTAL_LEAF_CONTENT_ITEMS = LEAF_CONTENT_ENTRIES.length;
};

let lastHydrateOverrideCount = -1;

export const hydrateContentRegistry = (approvedOverrides = []) => {
  const activeCount = getActiveOverrides(approvedOverrides).length;

  // Skip rebuild when already on the base (no-override) tree — common on
  // cold start followed by a refresh that finds zero active overrides.
  if (
    activeCount === 0 &&
    lastHydrateOverrideCount === 0 &&
    TOTAL_LEAF_CONTENT_ITEMS > 0
  ) {
    return;
  }

  const nextSections = buildSections(approvedOverrides);
  replaceArrayContents(CONTENT_SECTIONS.theory, nextSections.theory);
  replaceArrayContents(CONTENT_SECTIONS.practical, nextSections.practical);
  rebuildDerivedIndexes();
  lastHydrateOverrideCount = activeCount;
};

hydrateContentRegistry();

export const getReadVersionForItem = (readItemVersions, section, item) =>
  readItemVersions?.[getContentKey(section, item.id)] || null;

export const isItemReadCurrent = (readItemVersions, section, item) =>
  getReadVersionForItem(readItemVersions, section, item) ===
  getContentSignature(item);

export const isItemPendingUpdate = (readItemVersions, section, item) =>
  item?.recentlyUpdated === true && !isItemReadCurrent(readItemVersions, section, item);

export const getItemStatus = (item, section, readItemVersions) => {
  if (!item) return "none";

  if (Array.isArray(item.subsections) && item.subsections.length > 0) {
    const childStatuses = item.subsections.map((child) =>
      getItemStatus(child, section, readItemVersions),
    );
    if (childStatuses.includes("updated")) {
      return "updated";
    }
    if (childStatuses.length > 0 && childStatuses.every((status) => status === "read")) {
      return "read";
    }
    return "none";
  }

  if (isItemPendingUpdate(readItemVersions, section, item)) {
    return "updated";
  }

  return isItemReadCurrent(readItemVersions, section, item) ? "read" : "none";
};

export const getEffectiveReadCount = (readItemVersions = {}) =>
  LEAF_CONTENT_ENTRIES.reduce(
    (count, entry) =>
      readItemVersions?.[entry.key] === entry.signature ? count + 1 : count,
    0,
  );

export const getLeafEntryIndex = (contentKey) => {
  if (!contentKey) return -1;
  return LEAF_CONTENT_ENTRIES.findIndex((entry) => entry.key === contentKey);
};

export const getNextLeafEntry = (contentKey) => {
  const index = getLeafEntryIndex(contentKey);
  if (index < 0 || index >= LEAF_CONTENT_ENTRIES.length - 1) {
    return null;
  }
  return LEAF_CONTENT_ENTRIES[index + 1] || null;
};

/**
 * Next unread leaf after contentKey in library order.
 * Skips the current key and any leaves already matching their signature.
 */
export const getNextUnreadLeafEntry = (contentKey, readItemVersions = {}) => {
  const startIndex = getLeafEntryIndex(contentKey);
  const from = startIndex >= 0 ? startIndex + 1 : 0;

  for (let i = from; i < LEAF_CONTENT_ENTRIES.length; i += 1) {
    const entry = LEAF_CONTENT_ENTRIES[i];
    if (readItemVersions?.[entry.key] !== entry.signature) {
      return entry;
    }
  }

  return null;
};

export const getReadTitles = (readItemVersions = {}) =>
  [...CONTENT_ENTRIES_BY_TITLE.entries()]
    .filter(([, entries]) =>
      entries.some((entry) => readItemVersions?.[entry.key] === entry.signature),
    )
    .map(([title]) => title);

export const getLeafContentRefsForItem = (item, section) => {
  if (!item) return [];

  if (Array.isArray(item.subsections) && item.subsections.length > 0) {
    return item.subsections.flatMap((child) => getLeafContentRefsForItem(child, section));
  }

  return [
    {
      contentKey: getContentKey(section, item.id),
      itemTitle: item.title || "",
    },
  ];
};

export const getUpdatedSegmentsForItem = (item = {}) =>
  Array.isArray(item.updatedSegments)
    ? item.updatedSegments.map(normalizeUpdatedSnippet).filter(Boolean)
    : [];

export const getCurrentContentEntry = ({ section, id, title, contentKey } = {}) => {
  if (contentKey && CONTENT_ENTRY_BY_KEY.has(contentKey)) {
    return CONTENT_ENTRY_BY_KEY.get(contentKey) || null;
  }

  if (section && id !== undefined) {
    const bySectionId = CONTENT_ENTRY_BY_KEY.get(getContentKey(section, id));
    if (bySectionId) return bySectionId;
  }

  if (title) {
    const matches = CONTENT_ENTRIES_BY_TITLE.get(title) || [];
    if (matches.length > 0) {
      return matches[0];
    }
  }

  return null;
};

export const getCurrentContentItem = (reference = {}) =>
  getCurrentContentEntry(reference)?.item || null;

export const migrateLegacyReadItems = (
  legacyTitles = [],
  existingReadItemVersions = {},
) => {
  const nextVersions = { ...existingReadItemVersions };

  legacyTitles.forEach((title) => {
    const matches = CONTENT_ENTRIES_BY_TITLE.get(title) || [];
    matches.forEach((entry) => {
      if (entry.recentlyUpdated || nextVersions[entry.key]) {
        return;
      }
      nextVersions[entry.key] = entry.signature;
    });
  });

  return nextVersions;
};
