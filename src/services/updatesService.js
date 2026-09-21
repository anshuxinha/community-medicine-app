/**
 * Remote Updates feed: Firestore appContent/updatesFeed (usual short Updates),
 * plus parallel PH Digest articles: appContent/articlesFeed.
 * Offline cache and bundled JSON fallback for both.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import bundledCurrent from "../data/updates.json";
import bundledArticles from "../data/articles.json";
import bundledArchive from "../data/updates_archive.json";

export const UPDATES_FEED_DOC_PRODUCTION = ["appContent", "updatesFeed"];
export const ARTICLES_FEED_DOC = ["appContent", "articlesFeed"];

/** @deprecated Prefer UPDATES_FEED_DOC_PRODUCTION */
export const UPDATES_FEED_DOC_PATH = UPDATES_FEED_DOC_PRODUCTION;

const FETCH_TIMEOUT_MS = 5000;

function timeoutPromise(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Feed request timed out")), ms),
  );
}

export function resolveUpdatesFeedDocPath() {
  return UPDATES_FEED_DOC_PRODUCTION;
}

export function updatesFeedCacheKey() {
  return "updatesFeedCache";
}

export function articlesFeedCacheKey() {
  return "articlesFeedCache";
}

/** @deprecated Prefer updatesFeedCacheKey() */
export const UPDATES_FEED_CACHE_KEY = "updatesFeedCache";

function monthKeyFromDate(dateStr) {
  if (typeof dateStr === "string" && dateStr.length >= 7) {
    return dateStr.slice(0, 7);
  }
  return null;
}

function sortItemsDesc(items) {
  return [...items].sort((a, b) =>
    String(b?.date || "").localeCompare(String(a?.date || "")),
  );
}

function dedupeByLink(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const link = item?.link;
    if (link) {
      if (seen.has(link)) continue;
      seen.add(link);
    }
    out.push(item);
  }
  return out;
}

/**
 * Normalize any feed shape into { months: { "YYYY-MM": Update[] } }.
 */
export function normalizeMonthsMap(raw) {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  if (raw.months && typeof raw.months === "object" && !Array.isArray(raw.months)) {
    const months = {};
    for (const [key, list] of Object.entries(raw.months)) {
      if (!Array.isArray(list)) continue;
      months[key] = sortItemsDesc(dedupeByLink(list));
    }
    return months;
  }

  // Legacy: { current: [], archive: { "YYYY-MM": [] } }
  const months = {};
  if (raw.archive && typeof raw.archive === "object") {
    for (const [key, list] of Object.entries(raw.archive)) {
      if (!Array.isArray(list)) continue;
      months[key] = sortItemsDesc(dedupeByLink(list));
    }
  }
  if (Array.isArray(raw.current)) {
    for (const item of raw.current) {
      const key = monthKeyFromDate(item?.date);
      if (!key) continue;
      months[key] = months[key] || [];
      months[key].push(item);
    }
    for (const key of Object.keys(months)) {
      months[key] = sortItemsDesc(dedupeByLink(months[key]));
    }
  }
  return months;
}

/** Merge bundled updates JSON + archive into months map. */
export function monthsFromBundled() {
  const months = {};
  if (bundledArchive && typeof bundledArchive === "object") {
    for (const [key, list] of Object.entries(bundledArchive)) {
      if (!Array.isArray(list)) continue;
      months[key] = sortItemsDesc(dedupeByLink(list));
    }
  }
  if (Array.isArray(bundledCurrent)) {
    for (const item of bundledCurrent) {
      const key = monthKeyFromDate(item?.date);
      if (!key) continue;
      months[key] = months[key] || [];
      months[key].push(item);
    }
    for (const key of Object.keys(months)) {
      months[key] = sortItemsDesc(dedupeByLink(months[key]));
    }
  }
  return months;
}

/** Bundled PH Digest articles only (no Updates archive). */
export function articlesMonthsFromBundled() {
  const months = {};
  if (Array.isArray(bundledArticles)) {
    for (const item of bundledArticles) {
      const key = monthKeyFromDate(item?.date);
      if (!key) continue;
      months[key] = months[key] || [];
      months[key].push(item);
    }
    for (const key of Object.keys(months)) {
      months[key] = sortItemsDesc(dedupeByLink(months[key]));
    }
  }
  return months;
}

export async function readCachedUpdatesMonths() {
  try {
    const raw = await AsyncStorage.getItem(updatesFeedCacheKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const months = normalizeMonthsMap(parsed);
    return Object.keys(months).length > 0 ? months : null;
  } catch (err) {
    console.warn("Failed to read updates feed cache:", err?.message);
    return null;
  }
}

async function writeCachedUpdatesMonths(months) {
  try {
    await AsyncStorage.setItem(
      updatesFeedCacheKey(),
      JSON.stringify({ months, cachedAt: new Date().toISOString() }),
    );
  } catch (err) {
    console.warn("Failed to cache updates feed:", err?.message);
  }
}

export async function readCachedArticlesMonths() {
  try {
    const raw = await AsyncStorage.getItem(articlesFeedCacheKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const months = normalizeMonthsMap(parsed);
    return Object.keys(months).length > 0 ? months : null;
  } catch (err) {
    console.warn("Failed to read articles feed cache:", err?.message);
    return null;
  }
}

async function writeCachedArticlesMonths(months) {
  try {
    await AsyncStorage.setItem(
      articlesFeedCacheKey(),
      JSON.stringify({ months, cachedAt: new Date().toISOString() }),
    );
  } catch (err) {
    console.warn("Failed to cache articles feed:", err?.message);
  }
}

/**
 * Fetch remote Updates feed. Returns months map or null on failure.
 */
export async function fetchRemoteUpdatesMonths() {
  try {
    const snap = await Promise.race([
      getDoc(doc(db, ...resolveUpdatesFeedDocPath())),
      timeoutPromise(FETCH_TIMEOUT_MS),
    ]);
    if (!snap?.exists?.()) return null;
    const months = normalizeMonthsMap(snap.data());
    if (Object.keys(months).length === 0) return null;
    await writeCachedUpdatesMonths(months);
    return months;
  } catch (err) {
    console.warn("Updates feed fetch failed:", err?.message);
    return null;
  }
}

/**
 * Fetch remote PH Digest articles feed. Returns months map or null on failure.
 */
export async function fetchRemoteArticlesMonths() {
  try {
    const snap = await Promise.race([
      getDoc(doc(db, ...ARTICLES_FEED_DOC)),
      timeoutPromise(FETCH_TIMEOUT_MS),
    ]);
    if (!snap?.exists?.()) return null;
    const months = normalizeMonthsMap(snap.data());
    if (Object.keys(months).length === 0) return null;
    await writeCachedArticlesMonths(months);
    return months;
  } catch (err) {
    console.warn("Articles feed fetch failed:", err?.message);
    return null;
  }
}

let inFlightLoad = null;
let lastResult = null;
let lastResultAt = 0;
const RESULT_TTL_MS = 30 * 1000;

async function loadUpdatesMonthsInner() {
  const remote = await fetchRemoteUpdatesMonths();
  if (remote) {
    return { months: remote, source: "remote" };
  }

  const cached = await readCachedUpdatesMonths();
  if (cached) {
    return { months: cached, source: "cache" };
  }

  return { months: monthsFromBundled(), source: "bundled" };
}

/**
 * Resolve Updates feed: network → cache → bundled.
 */
export function loadUpdatesMonths() {
  if (lastResult && Date.now() - lastResultAt < RESULT_TTL_MS) {
    return Promise.resolve(lastResult);
  }
  if (!inFlightLoad) {
    inFlightLoad = loadUpdatesMonthsInner()
      .then((result) => {
        lastResult = result;
        lastResultAt = Date.now();
        return result;
      })
      .finally(() => {
        inFlightLoad = null;
      });
  }
  return inFlightLoad;
}

let inFlightArticles = null;
let lastArticles = null;
let lastArticlesAt = 0;

async function loadArticlesMonthsInner() {
  const remote = await fetchRemoteArticlesMonths();
  if (remote) {
    return { months: remote, source: "remote" };
  }

  const cached = await readCachedArticlesMonths();
  if (cached) {
    return { months: cached, source: "cache" };
  }

  return { months: articlesMonthsFromBundled(), source: "bundled" };
}

/**
 * Resolve articles feed: network → cache → bundled.
 * Next app version can treat this as a separate post type from Updates.
 */
export function loadArticlesMonths() {
  if (lastArticles && Date.now() - lastArticlesAt < RESULT_TTL_MS) {
    return Promise.resolve(lastArticles);
  }
  if (!inFlightArticles) {
    inFlightArticles = loadArticlesMonthsInner()
      .then((result) => {
        lastArticles = result;
        lastArticlesAt = Date.now();
        return result;
      })
      .finally(() => {
        inFlightArticles = null;
      });
  }
  return inFlightArticles;
}

/** Kick off Updates feed fetch at app start. */
export function prefetchUpdatesMonths() {
  return loadUpdatesMonths();
}

/** Kick off articles feed fetch (safe to call even if UI not wired yet). */
export function prefetchArticlesMonths() {
  return loadArticlesMonths();
}

export function yearMonthKey(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export function previousYearMonthKey(date = new Date()) {
  const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return yearMonthKey(prev);
}

/**
 * Dashboard strip: current month → previous → all non-academic, newest first.
 */
export function pickDashboardUpdates(months, { maxItems = 5 } = {}) {
  const filterNonAcademic = (list) =>
    (list || []).filter((u) => u?.category !== "Academic Content Update");

  const now = new Date();
  const currentKey = yearMonthKey(now);
  const prevKey = previousYearMonthKey(now);

  let list = filterNonAcademic(months[currentKey]);
  if (!list.length) {
    list = filterNonAcademic(months[prevKey]);
  }
  if (!list.length) {
    const all = [];
    for (const items of Object.values(months || {})) {
      if (Array.isArray(items)) all.push(...items);
    }
    list = sortItemsDesc(filterNonAcademic(all));
  } else {
    list = sortItemsDesc(list);
  }

  return list.slice(0, maxItems);
}

/**
 * Build monthIndex (0-11) → items[] for a given calendar year.
 */
export function monthsToYearIndexMap(months, year) {
  const map = {};
  const yearStr = String(year);
  for (const [key, list] of Object.entries(months || {})) {
    if (!key.startsWith(yearStr)) continue;
    const mIdx = parseInt(key.slice(5, 7), 10) - 1;
    if (mIdx < 0 || mIdx > 11) continue;
    map[mIdx] = sortItemsDesc(dedupeByLink([...(map[mIdx] || []), ...list]));
  }
  return map;
}
