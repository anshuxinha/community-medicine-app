import { createLruCache } from "./lruCache";

export const MARKDOWN_PARSE_CACHE_LIMIT = 8;

export const markdownParseCache = createLruCache(MARKDOWN_PARSE_CACHE_LIMIT);

export const makeMarkdownParseCacheKey = ({
  contentKey,
  contentSignature,
  isGem = false,
} = {}) => {
  const key = String(contentKey || "").trim();
  const signature = String(contentSignature || "").trim();
  if (!key && !signature) return null;
  return `${key}|${signature}|${isGem ? 1 : 0}`;
};
