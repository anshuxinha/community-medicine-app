import {
  CONTENT_SECTIONS,
  getContentKey,
  getContentSignature,
  getEffectiveReadCount,
  getItemStatus,
  hydrateContentRegistry,
  isEntryReadForProgress,
  isItemPendingUpdate,
  isItemReadForProgress,
  LEAF_CONTENT_ENTRIES,
} from "../contentRegistry";

describe("silent library content updates (progress preservation)", () => {
  beforeEach(() => {
    hydrateContentRegistry([]);
  });

  it("keeps read progress when signature changes without recentlyUpdated", () => {
    const entry = LEAF_CONTENT_ENTRIES.find((e) => e.section === "theory");
    expect(entry).toBeTruthy();

    const staleVersions = { [entry.key]: "v-stale-old-signature" };
    const silentEntry = { ...entry, signature: "v-new-signature", recentlyUpdated: false };

    expect(isEntryReadForProgress(silentEntry, staleVersions)).toBe(true);
    expect(isEntryReadForProgress({ ...silentEntry, recentlyUpdated: true }, staleVersions)).toBe(
      false,
    );
  });

  it("shows NEW only when recentlyUpdated and signature is stale", () => {
    const item = {
      id: "silent-test-leaf",
      title: "Silent Test",
      content: "body v1",
      recentlyUpdated: true,
      updatedSegments: ["changed line"],
    };
    const key = getContentKey("theory", item.id);
    const oldSig = "v-old";
    const versions = { [key]: oldSig };

    expect(isItemPendingUpdate(versions, "theory", item)).toBe(true);
    expect(getItemStatus(item, "theory", versions)).toBe("updated");

    const silentItem = { ...item, recentlyUpdated: false, updatedSegments: [] };
    // Stale signature + silent edit: still "read", not NEW
    expect(isItemPendingUpdate(versions, "theory", silentItem)).toBe(false);
    expect(isItemReadForProgress(versions, "theory", silentItem)).toBe(true);
    expect(getItemStatus(silentItem, "theory", versions)).toBe("read");
  });

  it("does not flag silent overrides as recentlyUpdated", () => {
    const leaf = LEAF_CONTENT_ENTRIES.find(
      (e) => e.section === "theory" && e.item?.content,
    );
    expect(leaf).toBeTruthy();

    hydrateContentRegistry([
      {
        libraryId: leaf.id,
        proposedContent: `${leaf.item.content}\n\n<!-- silent review edit -->`,
        status: "active",
        markAsNew: false,
        updatedSegments: [],
      },
    ]);

    const updated = LEAF_CONTENT_ENTRIES.find((e) => e.key === leaf.key);
    expect(updated).toBeTruthy();
    expect(updated.recentlyUpdated).toBe(false);
    expect(updated.signature).not.toBe(leaf.signature);

    const versions = { [leaf.key]: leaf.signature };
    expect(isEntryReadForProgress(updated, versions)).toBe(true);
    expect(getItemStatus(updated.item, "theory", versions)).toBe("read");
    expect(getEffectiveReadCount(versions)).toBeGreaterThan(0);
  });

  it("flags overrides with markAsNew or highlight segments as recentlyUpdated", () => {
    const leaf = LEAF_CONTENT_ENTRIES.find(
      (e) => e.section === "theory" && e.item?.content,
    );
    expect(leaf).toBeTruthy();

    hydrateContentRegistry([
      {
        libraryId: leaf.id,
        proposedContent: `${leaf.item.content}\n\n<!-- announced update -->`,
        status: "active",
        markAsNew: true,
        updatedSegments: ["new programme line"],
      },
    ]);

    const updated = LEAF_CONTENT_ENTRIES.find((e) => e.key === leaf.key);
    expect(updated.recentlyUpdated).toBe(true);

    const versions = { [leaf.key]: leaf.signature };
    expect(getItemStatus(updated.item, "theory", versions)).toBe("updated");
    expect(isEntryReadForProgress(updated, versions)).toBe(false);
  });

  it("uses the cached registry signature instead of re-hashing live content", () => {
    const leaf = LEAF_CONTENT_ENTRIES.find(
      (e) => e.section === "theory" && e.item?.content,
    );
    expect(leaf).toBeTruthy();

    const versions = { [leaf.key]: leaf.signature };
    const mutatedItem = {
      ...leaf.item,
      content: `${leaf.item.content}\n\n<!-- should not change cached status -->`,
    };

    expect(isItemReadForProgress(versions, "theory", mutatedItem)).toBe(true);
    expect(getItemStatus(mutatedItem, "theory", versions)).toBe("read");
    expect(getContentSignature(mutatedItem)).not.toBe(leaf.signature);
  });

  it("treats legacy overrides without markAsNew and empty segments as silent", () => {
    const leaf = LEAF_CONTENT_ENTRIES.find(
      (e) => e.section === "theory" && e.item?.content,
    );
    hydrateContentRegistry([
      {
        libraryId: leaf.id,
        proposedContent: `${leaf.item.content}\n\n<!-- legacy skill publish -->`,
        status: "active",
        updatedSegments: [],
      },
    ]);
    const updated = LEAF_CONTENT_ENTRIES.find((e) => e.key === leaf.key);
    expect(updated.recentlyUpdated).toBe(false);
  });
});
