jest.mock("../../services/videoService", () => ({
  isVideoFree: () => false,
}));

import { hydrateContentRegistry } from "../contentRegistry";
import {
  buildLibraryIndex,
  getSnippetSource,
  matchIndex,
} from "../globalSearch";

describe("globalSearch library index", () => {
  beforeAll(() => {
    hydrateContentRegistry([]);
  });

  it("does not copy full chapter bodies onto searchText", () => {
    const index = buildLibraryIndex();
    expect(index.length).toBeGreaterThan(10);
    expect(index.every((row) => row.searchText == null)).toBe(true);
    expect(index[0].rawItem).toBeTruthy();
  });

  it("matches a title query", () => {
    const index = buildLibraryIndex();
    const row = index.find((entry) => (entry.title || "").length > 6);
    expect(row).toBeTruthy();
    const hits = matchIndex(index, row.title);
    expect(hits.some((hit) => hit.id === row.id)).toBe(true);
    expect(hits[0].id).toBe(row.id);
  });

  it("matches a body-only token via rawItem.content", () => {
    const index = buildLibraryIndex();
    const withBody = index.find((entry) => {
      const content = entry.rawItem?.content || "";
      return content.length > 120 && !content.toLowerCase().includes(entry.title.toLowerCase().slice(0, 8));
    });
    expect(withBody).toBeTruthy();
    const token = String(withBody.rawItem.content)
      .replace(/[#*_`\[\]()]/g, " ")
      .split(/\s+/)
      .find((word) => word.length > 10);
    expect(token).toBeTruthy();
    const hits = matchIndex(index, token);
    expect(hits.some((hit) => hit.id === withBody.id)).toBe(true);
  });

  it("builds snippets from rawItem.content", () => {
    const index = buildLibraryIndex();
    const row = index.find((entry) => entry.rawItem?.content);
    const snippet = getSnippetSource(row);
    expect(snippet.length).toBeGreaterThan(0);
  });
});
