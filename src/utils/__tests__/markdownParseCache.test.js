import {
  MARKDOWN_PARSE_CACHE_LIMIT,
  makeMarkdownParseCacheKey,
  markdownParseCache,
} from "../markdownParseCache";
import { createLruCache } from "../lruCache";

describe("makeMarkdownParseCacheKey", () => {
  test("returns null without identity", () => {
    expect(makeMarkdownParseCacheKey({})).toBeNull();
    expect(makeMarkdownParseCacheKey({ isGem: true })).toBeNull();
  });

  test("includes key, signature, and gem flag", () => {
    expect(
      makeMarkdownParseCacheKey({
        contentKey: "theory:2",
        contentSignature: "vabc",
      }),
    ).toBe("theory:2|vabc|0");
    expect(
      makeMarkdownParseCacheKey({
        contentKey: "theory:2",
        contentSignature: "vabc",
        isGem: true,
      }),
    ).toBe("theory:2|vabc|1");
  });

  test("signature-only still caches", () => {
    expect(
      makeMarkdownParseCacheKey({ contentSignature: "v1" }),
    ).toBe("|v1|0");
  });
});

describe("markdownParseCache identity", () => {
  test("stores and drops the oldest entry past the limit", () => {
    const cache = createLruCache(MARKDOWN_PARSE_CACHE_LIMIT);
    for (let i = 0; i < MARKDOWN_PARSE_CACHE_LIMIT + 2; i += 1) {
      cache.set(`k${i}`, i);
    }
    expect(cache.size).toBe(MARKDOWN_PARSE_CACHE_LIMIT);
    expect(cache.get("k0")).toBeUndefined();
    expect(cache.get("k1")).toBeUndefined();
    expect(cache.get("k2")).toBe(2);
    expect(cache.get(`k${MARKDOWN_PARSE_CACHE_LIMIT + 1}`)).toBe(
      MARKDOWN_PARSE_CACHE_LIMIT + 1,
    );
  });

  test("get refreshes recency so a hit is not evicted next", () => {
    const cache = createLruCache(2);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.get("a")).toBe(1);
    cache.set("c", 3);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
  });

  test("module cache accepts a set/get roundtrip", () => {
    markdownParseCache.clear();
    const key = makeMarkdownParseCacheKey({
      contentKey: "theory:21",
      contentSignature: "vtest",
    });
    markdownParseCache.set(key, [{ type: "p", text: "hello" }]);
    expect(markdownParseCache.get(key)).toEqual([
      { type: "p", text: "hello" },
    ]);
    markdownParseCache.clear();
  });
});
