import {
  hydrateContentRegistry,
  LEAF_CONTENT_ENTRIES,
} from "../contentRegistry";
import {
  bookmarksMatch,
  buildGemContentKey,
  getBookmarkIdentity,
  isGemBookmark,
  mergeBookmarksLists,
  normalizeBookmarks,
  resolveBookmarkContentKey,
} from "../bookmarkIdentity";

describe("bookmarkIdentity", () => {
  let libraryEntry;

  beforeAll(() => {
    hydrateContentRegistry([]);
    libraryEntry = LEAF_CONTENT_ENTRIES.find(
      (leaf) => leaf.section === "theory" && leaf.item?.title,
    );
    expect(libraryEntry).toBeDefined();
  });

  test("gems list payload matches reading payload for the same gem", () => {
    const fromList = {
      id: "gem_1",
      title: "Pearl Index and Life Table Analysis",
      section: "SECTION 1: CONTRACEPTION",
      isGem: true,
      category: "Gems",
    };
    const fromReading = {
      id: "gem_1",
      title: "Pearl Index and Life Table Analysis",
      section: "SECTION 1: CONTRACEPTION",
      contentKey: "gems:section_1:gem_1",
      isGem: true,
    };
    expect(resolveBookmarkContentKey(fromList)).toBe("gems:section_1:gem_1");
    expect(getBookmarkIdentity(fromList)).toBe("gems:section_1:gem_1");
    expect(getBookmarkIdentity(fromReading)).toBe("gems:section_1:gem_1");
    expect(bookmarksMatch(fromList, fromReading)).toBe(true);
  });

  test("gem and library items with the same title stay distinct", () => {
    const gem = {
      id: "gem_1",
      title: libraryEntry.item.title,
      isGem: true,
      contentKey: "gems:section_1:gem_1",
    };
    const library = {
      id: libraryEntry.item.id,
      title: libraryEntry.item.title,
      section: libraryEntry.section,
      contentKey: libraryEntry.key,
    };
    expect(bookmarksMatch(gem, library)).toBe(false);
    expect(getBookmarkIdentity(gem)).not.toBe(getBookmarkIdentity(library));
  });

  test("normalize keeps gems that are not library titles and drops duplicate keys", () => {
    const gem = {
      id: "gem_1",
      title: "Pearl Index and Life Table Analysis",
      isGem: true,
    };
    const duplicate = {
      id: "gem_1",
      title: "Pearl Index and Life Table Analysis",
      contentKey: "gems:section_1:gem_1",
      isGem: true,
    };
    const normalized = normalizeBookmarks([gem, duplicate, { title: 1 }]);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].contentKey).toBe("gems:section_1:gem_1");
    expect(normalized[0].isGem).toBe(true);
  });

  test("mergeBookmarksLists does not collapse gem and library by title", () => {
    const gem = {
      id: "gem_1",
      title: libraryEntry.item.title,
      isGem: true,
      contentKey: buildGemContentKey("section_1", "gem_1"),
    };
    const library = {
      id: libraryEntry.item.id,
      title: libraryEntry.item.title,
      section: libraryEntry.section,
      contentKey: libraryEntry.key,
    };
    const merged = mergeBookmarksLists([gem], [library]);
    expect(merged).toHaveLength(2);
    expect(merged.some((item) => isGemBookmark(item))).toBe(true);
    expect(merged.some((item) => !isGemBookmark(item))).toBe(true);
  });

  test("legacy library title-only bookmark matches a contentKey payload", () => {
    const stored = { title: libraryEntry.item.title };
    const fromReading = {
      id: libraryEntry.item.id,
      title: libraryEntry.item.title,
      section: libraryEntry.section,
      contentKey: libraryEntry.key,
    };
    expect(bookmarksMatch(stored, fromReading)).toBe(true);
  });
});
