jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));
jest.mock("../../config/firebase", () => ({
  db: {},
}));

import {
  getUpdateType,
  pickDashboardUpdates,
  normalizeMonthsMap,
  mergeMonthsMaps,
} from "../../services/updatesService";

describe("updatesFeedFilters", () => {
  describe("getUpdateType", () => {
    it("defaults to NEWS when tag and type are undefined", () => {
      expect(getUpdateType({})).toBe("NEWS");
      expect(getUpdateType(null)).toBe("NEWS");
      expect(getUpdateType(undefined)).toBe("NEWS");
    });

    it("identifies NEWS tag or type (case-insensitive)", () => {
      expect(getUpdateType({ tag: "NEWS" })).toBe("NEWS");
      expect(getUpdateType({ tag: "news" })).toBe("NEWS");
      expect(getUpdateType({ type: "NEWS" })).toBe("NEWS");
    });

    it("identifies ARTICLE tag or type (case-insensitive)", () => {
      expect(getUpdateType({ tag: "ARTICLE" })).toBe("ARTICLE");
      expect(getUpdateType({ tag: "article" })).toBe("ARTICLE");
      expect(getUpdateType({ type: "ARTICLE" })).toBe("ARTICLE");
      expect(getUpdateType({ type: "Article" })).toBe("ARTICLE");
    });
  });

  describe("pickDashboardUpdates with filters", () => {
    const mockMonths = {
      "2026-09": [
        { id: "1", title: "News 1", date: "2026-09-18", tag: "NEWS" },
        { id: "2", title: "Article 1", date: "2026-09-17", tag: "ARTICLE" },
        { id: "3", title: "News 2", date: "2026-09-15", tag: "NEWS" },
      ],
    };

    it("returns all items when filter is ALL", () => {
      const items = pickDashboardUpdates(mockMonths, { filter: "ALL" });
      expect(items.length).toBe(3);
    });

    it("returns only NEWS items when filter is NEWS", () => {
      const items = pickDashboardUpdates(mockMonths, { filter: "NEWS" });
      expect(items.length).toBe(2);
      expect(items.every((i) => i.tag === "NEWS")).toBe(true);
    });

    it("returns only ARTICLE items when filter is ARTICLE", () => {
      const items = pickDashboardUpdates(mockMonths, { filter: "ARTICLE" });
      expect(items.length).toBe(1);
      expect(items[0].id).toBe("2");
      expect(items[0].tag).toBe("ARTICLE");
    });
  });

  describe("normalizeMonthsMap", () => {
    it("ensures every item has a normalized tag property", () => {
      const raw = {
        months: {
          "2026-09": [
            { id: "u1", date: "2026-09-10", title: "Old Untagged" },
            { id: "u2", date: "2026-09-09", title: "Special Article", tag: "ARTICLE" },
          ],
        },
      };

      const normalized = normalizeMonthsMap(raw);
      expect(normalized["2026-09"][0].tag).toBe("NEWS");
      expect(normalized["2026-09"][1].tag).toBe("ARTICLE");
    });
  });

  describe("mergeMonthsMaps", () => {
    it("combines news and article maps into one sorted month map", () => {
      const newsMap = {
        "2026-09": [
          { id: "n1", date: "2026-09-10", title: "News 1", tag: "NEWS" },
        ],
      };
      const articlesMap = {
        "2026-09": [
          { id: "a1", date: "2026-09-15", title: "Article 1", tag: "ARTICLE" },
        ],
        "2026-08": [
          { id: "a0", date: "2026-08-20", title: "Article 0", tag: "ARTICLE" },
        ],
      };

      const merged = mergeMonthsMaps(newsMap, articlesMap);
      expect(Object.keys(merged)).toEqual(["2026-09", "2026-08"]);
      // 2026-09 should be sorted by date desc: a1 (15th) before n1 (10th)
      expect(merged["2026-09"][0].id).toBe("a1");
      expect(merged["2026-09"][1].id).toBe("n1");
    });

    it("deduplicates items with identical IDs", () => {
      const map1 = {
        "2026-09": [{ id: "dup1", date: "2026-09-10", title: "Item 1" }],
      };
      const map2 = {
        "2026-09": [{ id: "dup1", date: "2026-09-10", title: "Item 1" }],
      };

      const merged = mergeMonthsMaps(map1, map2);
      expect(merged["2026-09"].length).toBe(1);
    });
  });
});

