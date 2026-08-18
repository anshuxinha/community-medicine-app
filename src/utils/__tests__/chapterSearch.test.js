import {
  collectChapterSearchMatches,
  collectOccurrences,
  normalizeSearchQuery,
} from "../chapterSearch";

describe("normalizeSearchQuery", () => {
  test("trims and lowercases", () => {
    expect(normalizeSearchQuery("  Herd Immunity  ")).toBe("herd immunity");
  });

  test("empty for blank input", () => {
    expect(normalizeSearchQuery("")).toBe("");
    expect(normalizeSearchQuery("   ")).toBe("");
    expect(normalizeSearchQuery(null)).toBe("");
  });
});

describe("collectOccurrences", () => {
  test("finds several hits in one string", () => {
    expect(collectOccurrences("iron iron iron", "iron")).toEqual([0, 5, 10]);
  });

  test("is case-insensitive", () => {
    expect(collectOccurrences("Iron and IRON", "iron")).toHaveLength(2);
  });

  test("splits on markdown bold the same way highlights paint", () => {
    expect(collectOccurrences("**Iron** stores and iron", "iron")).toHaveLength(2);
  });

  test("empty query or text yields no hits", () => {
    expect(collectOccurrences("iron", "")).toEqual([]);
    expect(collectOccurrences("", "iron")).toEqual([]);
    expect(collectOccurrences(null, "iron")).toEqual([]);
  });
});

describe("collectChapterSearchMatches", () => {
  test("empty query yields no matches", () => {
    expect(
      collectChapterSearchMatches([{ type: "body", text: "iron" }], "  "),
    ).toEqual([]);
  });

  test("counts several hits in one paragraph as separate matches", () => {
    const matches = collectChapterSearchMatches(
      [{ type: "body", text: "iron and iron" }],
      "iron",
    );
    expect(matches).toEqual([{ blockIndex: 0 }, { blockIndex: 0 }]);
  });

  test("walks body then bullets in render order", () => {
    const matches = collectChapterSearchMatches(
      [
        { type: "body", text: "iron stores" },
        { type: "bullets", items: ["calcium", "more iron"] },
      ],
      "iron",
    );
    expect(matches).toEqual([{ blockIndex: 0 }, { blockIndex: 1 }]);
  });

  test("walks table headers then cells left to right", () => {
    const matches = collectChapterSearchMatches(
      [
        {
          type: "table",
          headers: ["Iron", "Calcium"],
          rows: [
            ["low iron", "ok"],
            ["x", "iron rich"],
          ],
        },
      ],
      "iron",
    );
    expect(matches.map((m) => m.blockIndex)).toEqual([0, 0, 0]);
  });

  test("is case-insensitive across blocks", () => {
    const matches = collectChapterSearchMatches(
      [{ type: "body", text: "Herd Immunity and HERD" }],
      "herd",
    );
    expect(matches).toHaveLength(2);
  });

  test("returns no hits when the query is absent", () => {
    expect(
      collectChapterSearchMatches([{ type: "body", text: "calcium" }], "iron"),
    ).toEqual([]);
  });

  test("skips exercise internals", () => {
    const matches = collectChapterSearchMatches(
      [
        {
          type: "exercise",
          question: "Define iron",
          answerBlocks: [{ type: "body", text: "iron is a metal" }],
        },
      ],
      "iron",
    );
    expect(matches).toEqual([]);
  });
});
