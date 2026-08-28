import { CONTENT_ENTRY_BY_KEY, VALID_CONTENT_KEYS } from "./contentRegistry";

export const READ_UNREAD_TOMBSTONE = "";

export const isUnreadTombstone = (version) =>
  version === READ_UNREAD_TOMBSTONE || version == null;

export const sanitizeReadItemVersions = (
  value,
  validKeys = VALID_CONTENT_KEYS,
) => {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value).reduce((accumulator, [key, version]) => {
    if (!validKeys.has(key)) return accumulator;
    if (version === READ_UNREAD_TOMBSTONE) {
      accumulator[key] = READ_UNREAD_TOMBSTONE;
      return accumulator;
    }
    if (typeof version === "string" && version) {
      accumulator[key] = version;
    }
    return accumulator;
  }, {});
};

const versionMap = (state) => state?.readItemVersions || {};

const hasOwnVersion = (map, key) =>
  Object.prototype.hasOwnProperty.call(map, key);

/**
 * Merge read maps from highest-priority snapshot first.
 *
 * A missing key is sparse (fall through). An explicit tombstone is unread and
 * must not be filled from a later snapshot. A later matching signature may
 * upgrade an earlier *read* value so NEW badges do not return after a silent
 * content update on another device.
 */
export const mergeReadItemVersions = (
  states = [],
  { getCurrentSignature } = {},
) => {
  const maps = (Array.isArray(states) ? states : []).map(versionMap);
  const keys = new Set();
  maps.forEach((map) => {
    Object.keys(map).forEach((key) => keys.add(key));
  });

  const signatureOf =
    getCurrentSignature ||
    ((key) => CONTENT_ENTRY_BY_KEY.get(key)?.signature);

  const merged = {};
  keys.forEach((key) => {
    let first = null;
    let sawExplicit = false;

    for (const map of maps) {
      if (!hasOwnVersion(map, key)) continue;
      const version = map[key];
      sawExplicit = true;
      if (isUnreadTombstone(version) || version === READ_UNREAD_TOMBSTONE) {
        first = READ_UNREAD_TOMBSTONE;
      } else if (typeof version === "string" && version) {
        first = version;
      } else {
        first = READ_UNREAD_TOMBSTONE;
      }
      break;
    }

    if (!sawExplicit) return;

    if (first === READ_UNREAD_TOMBSTONE) {
      merged[key] = READ_UNREAD_TOMBSTONE;
      return;
    }

    const currentSignature = signatureOf(key);
    if (currentSignature && first !== currentSignature) {
      for (const map of maps) {
        if (!hasOwnVersion(map, key)) continue;
        const version = map[key];
        if (typeof version === "string" && version === currentSignature) {
          merged[key] = currentSignature;
          return;
        }
      }
    }

    merged[key] = first;
  });

  return merged;
};
