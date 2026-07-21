import {
  LEAF_CONTENT_ENTRIES,
  getLeafEntryIndex,
  getNextLeafEntry,
  getNextUnreadLeafEntry,
} from "../contentRegistry";

describe("contentRegistry next-leaf helpers", () => {
  test("registry has leaf entries after hydrate", () => {
    expect(LEAF_CONTENT_ENTRIES.length).toBeGreaterThan(1);
  });

  test("getLeafEntryIndex finds known keys", () => {
    const first = LEAF_CONTENT_ENTRIES[0];
    expect(getLeafEntryIndex(first.key)).toBe(0);
    expect(getLeafEntryIndex("not-a-real-key")).toBe(-1);
  });

  test("getNextLeafEntry returns the following leaf", () => {
    const first = LEAF_CONTENT_ENTRIES[0];
    const second = LEAF_CONTENT_ENTRIES[1];
    expect(getNextLeafEntry(first.key)?.key).toBe(second.key);
  });

  test("getNextLeafEntry returns null at end of library", () => {
    const last = LEAF_CONTENT_ENTRIES[LEAF_CONTENT_ENTRIES.length - 1];
    expect(getNextLeafEntry(last.key)).toBeNull();
  });

  test("getNextUnreadLeafEntry skips already-read leaves", () => {
    const first = LEAF_CONTENT_ENTRIES[0];
    const second = LEAF_CONTENT_ENTRIES[1];
    const third = LEAF_CONTENT_ENTRIES[2];

    const versions = {
      [first.key]: first.signature,
      [second.key]: second.signature,
    };

    const next = getNextUnreadLeafEntry(first.key, versions);
    expect(next?.key).toBe(third.key);
  });

  test("getNextUnreadLeafEntry returns null when all later leaves are read", () => {
    const versions = {};
    LEAF_CONTENT_ENTRIES.forEach((entry) => {
      versions[entry.key] = entry.signature;
    });
    const first = LEAF_CONTENT_ENTRIES[0];
    expect(getNextUnreadLeafEntry(first.key, versions)).toBeNull();
  });
});
