import {
  tokenizeInline,
  parseArticleMarkdown,
} from "../articleMarkdown";

describe("articleMarkdown", () => {
  describe("tokenizeInline", () => {
    it("handles empty or falsy text", () => {
      expect(tokenizeInline("")).toEqual([]);
      expect(tokenizeInline(null)).toEqual([]);
    });

    it("parses plain text without tokens", () => {
      expect(tokenizeInline("Plain text without formatting")).toEqual([
        { type: "text", content: "Plain text without formatting" },
      ]);
    });

    it("extracts bold tokens", () => {
      const tokens = tokenizeInline("This is **important** notice.");
      expect(tokens).toEqual([
        { type: "text", content: "This is " },
        { type: "bold", content: "important" },
        { type: "text", content: " notice." },
      ]);
    });

    it("extracts italic tokens", () => {
      const tokens = tokenizeInline("Vector is *Aedes aegypti* species.");
      expect(tokens).toEqual([
        { type: "text", content: "Vector is " },
        { type: "italic", content: "Aedes aegypti" },
        { type: "text", content: " species." },
      ]);
    });

    it("handles mixed bold and italic tokens in one line", () => {
      const tokens = tokenizeInline("**Alert:** Please inspect *water containers* weekly.");
      expect(tokens).toEqual([
        { type: "bold", content: "Alert:" },
        { type: "text", content: " Please inspect " },
        { type: "italic", content: "water containers" },
        { type: "text", content: " weekly." },
      ]);
    });
  });

  describe("parseArticleMarkdown", () => {
    it("returns empty array for empty input", () => {
      expect(parseArticleMarkdown("")).toEqual([]);
      expect(parseArticleMarkdown(null)).toEqual([]);
    });

    it("parses headings correctly", () => {
      const md = `
# Main Header
## Subheading Level 2
### Detailed Section 3
#### Note 4
`;
      const blocks = parseArticleMarkdown(md);
      expect(blocks).toEqual([
        { type: "h2", text: "Main Header" },
        { type: "h2", text: "Subheading Level 2" },
        { type: "h3", text: "Detailed Section 3" },
        { type: "h4", text: "Note 4" },
      ]);
    });

    it("parses blockquotes (> ...)", () => {
      const md = `
> This is a key public health directive.
> Must be implemented by next month.
`;
      const blocks = parseArticleMarkdown(md);
      expect(blocks).toEqual([
        {
          type: "quote",
          text: "This is a key public health directive.\nMust be implemented by next month.",
        },
      ]);
    });

    it("parses bullet and numbered lists with indentation", () => {
      const md = `
- Bullet item 1
  - Nested sub-bullet
1. Step one
2. Step two
`;
      const blocks = parseArticleMarkdown(md);
      expect(blocks).toEqual([
        { type: "bullet", text: "Bullet item 1", depth: 0 },
        { type: "bullet", text: "Nested sub-bullet", depth: 1 },
        { type: "numbered", number: "1.", text: "Step one", depth: 0 },
        { type: "numbered", number: "2.", text: "Step two", depth: 0 },
      ]);
    });

    it("parses horizontal divider rules", () => {
      const md = `
Section A
---
Section B
`;
      const blocks = parseArticleMarkdown(md);
      expect(blocks).toEqual([
        { type: "p", text: "Section A" },
        { type: "hr" },
        { type: "p", text: "Section B" },
      ]);
    });

    it("accumulates multi-line paragraphs separated by blank lines", () => {
      const md = `
First sentence of paragraph one.
Second sentence of paragraph one.

Paragraph two here.
`;
      const blocks = parseArticleMarkdown(md);
      expect(blocks).toEqual([
        {
          type: "p",
          text: "First sentence of paragraph one. Second sentence of paragraph one.",
        },
        { type: "p", text: "Paragraph two here." },
      ]);
    });
  });
});
