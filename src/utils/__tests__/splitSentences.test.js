import { splitSentences } from "../splitSentences";

describe("splitSentences", () => {
  test("keeps a trailing sentence after earlier periods", () => {
    const text =
      "They are an alternative generic denominator. QALY and DALY are compared in the effects leaf.";
    const parts = splitSentences(text);
    expect(parts[parts.length - 1]).toBe(
      "QALY and DALY are compared in the effects leaf.",
    );
    expect(parts.join(" ")).toContain("effects leaf");
  });

  test("keeps a remainder that has no closing punctuation", () => {
    const text = "First sentence. Trailing clause without a stop";
    expect(splitSentences(text)).toEqual([
      "First sentence.",
      "Trailing clause without a stop",
    ]);
  });

  test("returns the whole string when there is no sentence punctuation", () => {
    expect(splitSentences("effects leaf")).toEqual(["effects leaf"]);
  });
});
