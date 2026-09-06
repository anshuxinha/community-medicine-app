import BASE_CONTENT_SIGNATURES from "../../data/contentSignatures.json";
import {
  CONTENT_SECTIONS,
  getContentKey,
  getContentSignature,
  hydrateContentRegistry,
  LEAF_CONTENT_ENTRIES,
  walkContentItemsWithRoot,
} from "../contentRegistry";

const liveSignaturesForSection = (section) => {
  const live = {};
  walkContentItemsWithRoot(CONTENT_SECTIONS[section], section, (item, activeSection) => {
    live[getContentKey(activeSection, item.id)] = getContentSignature(item);
  });
  return live;
};

describe("precomputed content signatures", () => {
  beforeEach(() => {
    hydrateContentRegistry([]);
  });

  it("committed map matches live getContentSignature for every bundled leaf", () => {
    const live = {
      ...liveSignaturesForSection("theory"),
      ...liveSignaturesForSection("practical"),
    };

    expect(Object.keys(live).sort()).toEqual(
      Object.keys(BASE_CONTENT_SIGNATURES).sort(),
    );
    Object.entries(live).forEach(([key, signature]) => {
      expect(BASE_CONTENT_SIGNATURES[key]).toBe(signature);
    });
  });

  it("registry entries use the committed signature on the base tree", () => {
    expect(LEAF_CONTENT_ENTRIES.length).toBe(
      Object.keys(BASE_CONTENT_SIGNATURES).length,
    );
    LEAF_CONTENT_ENTRIES.forEach((entry) => {
      expect(entry.signature).toBe(BASE_CONTENT_SIGNATURES[entry.key]);
      expect(entry.signature).toBe(getContentSignature(entry.item));
    });
  });

  it("rehashes only overridden theory leaves", () => {
    const leaf = LEAF_CONTENT_ENTRIES.find(
      (entry) => entry.section === "theory" && entry.item?.content,
    );
    expect(leaf).toBeTruthy();
    const untouched = LEAF_CONTENT_ENTRIES.find(
      (entry) => entry.section === "theory" && entry.key !== leaf.key,
    );
    expect(untouched).toBeTruthy();

    const baseUntouchedSig = untouched.signature;
    const patchedContent = `${leaf.item.content}\n\n<!-- signature rehash check -->`;

    hydrateContentRegistry([
      {
        libraryId: leaf.id,
        proposedContent: patchedContent,
        status: "active",
        markAsNew: false,
        updatedSegments: [],
      },
    ]);

    const updated = LEAF_CONTENT_ENTRIES.find((entry) => entry.key === leaf.key);
    const stillUntouched = LEAF_CONTENT_ENTRIES.find(
      (entry) => entry.key === untouched.key,
    );
    expect(updated.signature).toBe(
      getContentSignature({ ...updated.item, content: patchedContent }),
    );
    expect(updated.signature).not.toBe(BASE_CONTENT_SIGNATURES[leaf.key]);
    expect(stillUntouched.signature).toBe(baseUntouchedSig);
  });
});
