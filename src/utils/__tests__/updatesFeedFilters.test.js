jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));
jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(() => () => {}),
}));
jest.mock("../../config/firebase", () => ({
  db: {},
  auth: { currentUser: null },
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc } from "firebase/firestore";
import { auth } from "../../config/firebase";
import {
  getUpdateType,
  pickDashboardUpdates,
  normalizeMonthsMap,
  mergeMonthsMaps,
  loadUpdatesMonths,
  subscribeUpdatesFeed,
  __resetUpdatesFeedStateForTests,
  __setUpdatesFeedTimingsForTests,
} from "../../services/updatesService";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const freshSnap = {
  exists: () => true,
  data: () => ({
    months: {
      "2026-09": [
        {
          id: "fresh-news",
          date: "2026-09-21",
          title: "September guideline",
          tag: "NEWS",
        },
        {
          id: "fresh-article",
          date: "2026-09-20",
          title: "September article",
          tag: "ARTICLE",
        },
      ],
    },
  }),
};

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

  describe("loadUpdatesMonths auth and late scan", () => {
    beforeEach(async () => {
      __resetUpdatesFeedStateForTests();
      __setUpdatesFeedTimingsForTests({
        authWaitMs: 40,
        fetchTimeoutMs: 50,
        retryDelayMs: 0,
      });
      auth.currentUser = null;
      onAuthStateChanged.mockImplementation(() => () => {});
      getDoc.mockReset();
      await AsyncStorage.clear();
    });

    it("does not read Firestore until auth has restored", async () => {
      let authCallback;
      onAuthStateChanged.mockImplementation((_auth, callback) => {
        authCallback = callback;
        return () => {};
      });
      getDoc.mockResolvedValue({ exists: () => false });

      const pending = loadUpdatesMonths();
      await delay(15);
      expect(getDoc).not.toHaveBeenCalled();

      auth.currentUser = { uid: "user-1" };
      authCallback(auth.currentUser);
      const result = await pending;

      expect(getDoc).toHaveBeenCalled();
      expect(result.source).toBe("bundled");
    });

    it("scans again after a signed-out failure once the user is signed in", async () => {
      getDoc.mockResolvedValue({ exists: () => false });
      onAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(null);
        return () => {};
      });

      const first = await loadUpdatesMonths();
      expect(first.source).toBe("bundled");
      const callsAfterSignedOut = getDoc.mock.calls.length;
      expect(callsAfterSignedOut).toBeGreaterThan(0);

      auth.currentUser = { uid: "user-1" };
      getDoc.mockResolvedValue(freshSnap);
      const second = await loadUpdatesMonths();

      expect(getDoc.mock.calls.length).toBeGreaterThan(callsAfterSignedOut);
      expect(second.source).toBe("remote");
      expect(second.months["2026-09"].map((item) => item.id)).toEqual([
        "fresh-news",
        "fresh-article",
      ]);
    });

    it("applies a remote result that arrives after the paint timeout", async () => {
      auth.currentUser = { uid: "user-1" };
      const resolvers = [];
      getDoc.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvers.push(resolve);
          }),
      );
      const sources = [];
      const unsubscribe = subscribeUpdatesFeed((result) => {
        sources.push(result.source);
      });

      const pending = loadUpdatesMonths();
      await delay(80);
      const first = await pending;
      expect(first.source).toBe("bundled");
      expect(resolvers.length).toBeGreaterThan(0);

      resolvers.splice(0).forEach((resolve) => resolve(freshSnap));
      await delay(30);

      expect(sources).toContain("remote");
      const again = await loadUpdatesMonths();
      expect(again.source).toBe("remote");
      expect(again.months["2026-09"].some((item) => item.id === "fresh-article")).toBe(
        true,
      );
      unsubscribe();
    });

    it("force starts a new Firestore read while a remote result is still fresh", async () => {
      auth.currentUser = { uid: "user-1" };
      onAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(auth.currentUser);
        return () => {};
      });
      getDoc.mockResolvedValue(freshSnap);

      const first = await loadUpdatesMonths();
      expect(first.source).toBe("remote");
      const callsAfterFirst = getDoc.mock.calls.length;

      const cached = await loadUpdatesMonths();
      expect(cached.source).toBe("remote");
      expect(getDoc.mock.calls.length).toBe(callsAfterFirst);

      const forced = await loadUpdatesMonths({ force: true });
      expect(forced.source).toBe("remote");
      expect(getDoc.mock.calls.length).toBeGreaterThan(callsAfterFirst);
    });
  });
});

