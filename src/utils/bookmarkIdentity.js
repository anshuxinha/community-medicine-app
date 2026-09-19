import {
  VALID_CONTENT_KEYS,
  VALID_MASTER_TITLES,
  getContentKey,
} from "./contentRegistry";

const getGemsData = () => require("../data/gemsData.json");

export const buildGemContentKey = (sectionId, gemId) => {
  if (!sectionId || gemId == null || gemId === "") return null;
  return `gems:${sectionId}:${String(gemId)}`;
};

export const parseGemContentKey = (contentKey) => {
  if (typeof contentKey !== "string" || !contentKey.startsWith("gems:")) {
    return null;
  }
  const rest = contentKey.slice("gems:".length);
  const colon = rest.indexOf(":");
  if (colon <= 0 || colon === rest.length - 1) return null;
  return {
    sectionId: rest.slice(0, colon),
    gemId: rest.slice(colon + 1),
  };
};

export const isGemBookmark = (item) => {
  if (!item || typeof item !== "object") return false;
  if (item.isGem === true) return true;
  if (item.category === "Gems") return true;
  return (
    typeof item.contentKey === "string" && item.contentKey.startsWith("gems:")
  );
};

export const findGemRecord = (item) => {
  if (!item || typeof item !== "object") return null;

  const gemsData = getGemsData();
  const parsed = parseGemContentKey(item.contentKey);
  if (parsed) {
    const section = gemsData.find((entry) => entry.id === parsed.sectionId);
    const gem = section?.gems?.find(
      (entry) => String(entry.id) === String(parsed.gemId),
    );
    if (section && gem) {
      return { gem, sectionId: section.id, sectionTitle: section.title };
    }
  }

  if (item.sectionId && item.id != null) {
    const section = gemsData.find((entry) => entry.id === item.sectionId);
    const gem = section?.gems?.find(
      (entry) => String(entry.id) === String(item.id),
    );
    if (section && gem) {
      return { gem, sectionId: section.id, sectionTitle: section.title };
    }
  }

  if (typeof item.title === "string" && isGemBookmark(item)) {
    for (const section of gemsData) {
      const gem = (section.gems || []).find(
        (entry) => entry.title === item.title,
      );
      if (gem) {
        return { gem, sectionId: section.id, sectionTitle: section.title };
      }
    }
  }

  return null;
};

export const resolveBookmarkContentKey = (item) => {
  if (!item || typeof item !== "object") return null;

  if (isGemBookmark(item)) {
    if (parseGemContentKey(item.contentKey)) return item.contentKey;
    const fromIds = buildGemContentKey(item.sectionId, item.id);
    if (fromIds) return fromIds;
    const record = findGemRecord(item);
    if (record) return buildGemContentKey(record.sectionId, record.gem.id);
    return typeof item.contentKey === "string" ? item.contentKey : null;
  }

  if (
    typeof item.contentKey === "string" &&
    VALID_CONTENT_KEYS.has(item.contentKey)
  ) {
    return item.contentKey;
  }
  if (typeof item.section === "string" && item.id !== undefined) {
    const derivedKey = getContentKey(item.section, item.id);
    if (VALID_CONTENT_KEYS.has(derivedKey)) {
      return derivedKey;
    }
  }
  return typeof item.contentKey === "string" ? item.contentKey : null;
};

export const getBookmarkIdentity = (itemOrTitle) => {
  if (!itemOrTitle) return null;
  if (typeof itemOrTitle === "string") return `lib-title:${itemOrTitle}`;
  const key = resolveBookmarkContentKey(itemOrTitle);
  if (key) return key;
  if (typeof itemOrTitle.title !== "string") return null;
  return `${isGemBookmark(itemOrTitle) ? "gem-title" : "lib-title"}:${itemOrTitle.title}`;
};

export const bookmarksMatch = (left, right) => {
  if (!left || !right) return false;
  const idLeft = getBookmarkIdentity(left);
  const idRight = getBookmarkIdentity(right);
  if (idLeft && idRight && idLeft === idRight) return true;

  const objLeft = typeof left === "object" ? left : { title: left };
  const objRight = typeof right === "object" ? right : { title: right };
  if (isGemBookmark(objLeft) !== isGemBookmark(objRight)) return false;

  const titleLeft =
    typeof objLeft.title === "string"
      ? objLeft.title
      : typeof left === "string"
        ? left
        : null;
  const titleRight =
    typeof objRight.title === "string"
      ? objRight.title
      : typeof right === "string"
        ? right
        : null;
  if (!titleLeft || titleLeft !== titleRight) return false;

  const keyLeft = resolveBookmarkContentKey(objLeft);
  const keyRight = resolveBookmarkContentKey(objRight);
  if (keyLeft && keyRight) return keyLeft === keyRight;
  return true;
};

export const normalizeBookmarks = (items) => {
  if (!Array.isArray(items)) return [];
  const map = new Map();
  items.forEach((item) => {
    if (!item || typeof item.title !== "string") return;
    const gem = isGemBookmark(item);
    if (!gem) {
      const key = resolveBookmarkContentKey(item);
      const validLibrary =
        (key && VALID_CONTENT_KEYS.has(key)) ||
        VALID_MASTER_TITLES.has(item.title);
      if (!validLibrary) return;
    }
    const contentKey =
      resolveBookmarkContentKey(item) || item.contentKey || null;
    const next = {
      ...item,
      contentKey,
      isGem: gem,
    };
    const identity = getBookmarkIdentity(next);
    if (!identity || map.has(identity)) return;
    map.set(identity, next);
  });
  return [...map.values()];
};

export const mergeBookmarksLists = (...lists) =>
  normalizeBookmarks(lists.flat());
