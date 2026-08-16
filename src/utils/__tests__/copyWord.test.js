import { extractCopyWord, splitCopyablePieces } from "../copyWord";

describe("extractCopyWord", () => {
  test("trims whitespace and surrounding punctuation", () => {
    expect(extractCopyWord("  epidemiology. ")).toBe("epidemiology");
    expect(extractCopyWord("(HIV)")).toBe("HIV");
    expect(extractCopyWord('"word"')).toBe("word");
    expect(extractCopyWord("risk,")).toBe("risk");
  });

  test("keeps compound medical tokens", () => {
    expect(extractCopyWord("COVID-19")).toBe("COVID-19");
    expect(extractCopyWord("HIV/AIDS")).toBe("HIV/AIDS");
    expect(extractCopyWord("25.4%")).toBe("25.4%");
    expect(extractCopyWord("DALY's")).toBe("DALY's");
  });

  test("returns empty for blank input", () => {
    expect(extractCopyWord("")).toBe("");
    expect(extractCopyWord("   ")).toBe("");
    expect(extractCopyWord(null)).toBe("");
  });
});

describe("splitCopyablePieces", () => {
  test("attaches trailing space to the preceding word", () => {
    expect(splitCopyablePieces("herd immunity.")).toEqual([
      { text: "herd ", copyable: true },
      { text: "immunity.", copyable: true },
    ]);
  });

  test("keeps leading whitespace as a non-copyable piece", () => {
    expect(splitCopyablePieces("  lead")).toEqual([
      { text: "  ", copyable: false },
      { text: "lead", copyable: true },
    ]);
  });

  test("returns empty for blank input", () => {
    expect(splitCopyablePieces("")).toEqual([]);
  });
});
