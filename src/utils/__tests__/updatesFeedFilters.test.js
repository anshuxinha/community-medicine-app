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
});
