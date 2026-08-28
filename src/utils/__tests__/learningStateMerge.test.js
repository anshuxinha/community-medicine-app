import {
  CONTENT_ENTRY_BY_KEY,
  LEAF_CONTENT_ENTRIES,
  getEffectiveReadCount,
  getItemStatus,
  hydrateContentRegistry,
} from "../contentRegistry";
import {
  READ_UNREAD_TOMBSTONE,
  mergeReadItemVersions,
  sanitizeReadItemVersions,
} from "../learningStateMerge";

describe("mergeReadItemVersions", () => {
  let key;
  let signature;
  let item;
  let section;

  beforeAll(() => {
    hydrateContentRegistry([]);
    const entry = LEAF_CONTENT_ENTRIES.find((leaf) => leaf.section === "theory");
    expect(entry).toBeDefined();
    key = entry.key;
    signature = entry.signature;
    item = entry.item;
    section = entry.section;
  });

  test("live tombstone wins over a cloud matching signature", () => {
    const merged = mergeReadItemVersions([
      { readItemVersions: { [key]: READ_UNREAD_TOMBSTONE } },
      { readItemVersions: { [key]: signature } },
    ]);
    expect(merged[key]).toBe(READ_UNREAD_TOMBSTONE);
    expect(getEffectiveReadCount(merged)).toBe(0);
    expect(getItemStatus(item, section, merged)).not.toBe("read");
  });

  test("sparse live omits the key and cloud signature stays read", () => {
    const merged = mergeReadItemVersions([
      { readItemVersions: {} },
      { readItemVersions: { [key]: signature } },
    ]);
    expect(merged[key]).toBe(signature);
    expect(getEffectiveReadCount(merged)).toBeGreaterThan(0);
  });

  test("live current signature is kept when another device is stale", () => {
    const merged = mergeReadItemVersions(
      [
        { readItemVersions: { [key]: "current-sig" } },
        { readItemVersions: { [key]: "stale-sig" } },
      ],
      { getCurrentSignature: (contentKey) => (contentKey === key ? "current-sig" : null) },
    );
    expect(merged[key]).toBe("current-sig");
  });

  test("later current signature upgrades an earlier stale read, not a tombstone", () => {
    const upgraded = mergeReadItemVersions(
      [
        { readItemVersions: { [key]: "stale-sig" } },
        { readItemVersions: { [key]: "current-sig" } },
      ],
      { getCurrentSignature: (contentKey) => (contentKey === key ? "current-sig" : null) },
    );
    expect(upgraded[key]).toBe("current-sig");

    const unread = mergeReadItemVersions(
      [
        { readItemVersions: { [key]: READ_UNREAD_TOMBSTONE } },
        { readItemVersions: { [key]: "current-sig" } },
      ],
      { getCurrentSignature: (contentKey) => (contentKey === key ? "current-sig" : null) },
    );
    expect(unread[key]).toBe(READ_UNREAD_TOMBSTONE);
  });

  test("sanitize keeps tombstones and drops invalid keys", () => {
    const cleaned = sanitizeReadItemVersions({
      [key]: READ_UNREAD_TOMBSTONE,
      "not-a-real-key": signature,
    });
    expect(cleaned[key]).toBe(READ_UNREAD_TOMBSTONE);
    expect(cleaned["not-a-real-key"]).toBeUndefined();
    expect(CONTENT_ENTRY_BY_KEY.get(key)).toBeDefined();
  });
});
