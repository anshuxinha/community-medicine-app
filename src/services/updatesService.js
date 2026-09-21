/**
 * Remote Updates feed: Firestore appContent/updatesFeed with offline cache
 * and bundled JSON fallback.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import bundledCurrent from "../data/updates.json";
import bundledArchive from "../data/updates_archive.json";

export const UPDATES_FEED_CACHE_KEY = "updatesFeedCache";
export const UPDATES_FEED_DOC_PATH = ["appContent", "updatesFeed"];

export const ARTICLES_FEED_DOC_PATH = ["appContent", "articlesFeed"];
export const ARTICLES_FEED_ALT_DOC_PATH = ["appContent", "artcilesFeed"];

const FETCH_TIMEOUT_MS = 5000;

function timeoutPromise(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Updates feed request timed out")), ms),
  );
}

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
    const key = item?.id || item?.link || item?.title;
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(item);
  }
  return out;
}

export function getUpdateType(item, fallback = "NEWS") {
  const val = String(item?.tag || item?.type || "").trim().toUpperCase();
  if (val === "ARTICLE") return "ARTICLE";
  if (val === "NEWS") return "NEWS";
  return fallback;
}

function normalizeItem(item, defaultTag = "NEWS") {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    tag: getUpdateType(item, defaultTag),
  };
}

/**
 * Merge multiple months maps into one combined { "YYYY-MM": Update[] } map.
 */
export function mergeMonthsMaps(...maps) {
  const combined = {};
  for (const map of maps) {
    if (!map || typeof map !== "object") continue;
    for (const [key, list] of Object.entries(map)) {
      if (!Array.isArray(list)) continue;
      combined[key] = combined[key] || [];
      combined[key].push(...list);
    }
  }
  for (const key of Object.keys(combined)) {
    combined[key] = sortItemsDesc(dedupeByLink(combined[key]));
  }
  return combined;
}

/**
 * Normalize any feed shape into { months: { "YYYY-MM": Update[] } }.
 */
export function normalizeMonthsMap(raw, defaultTag = "NEWS") {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  // If raw is an array directly
  if (Array.isArray(raw)) {
    const months = {};
    for (const item of raw) {
      const key = monthKeyFromDate(item?.date) || yearMonthKey();
      months[key] = months[key] || [];
      months[key].push(normalizeItem(item, defaultTag));
    }
    for (const key of Object.keys(months)) {
      months[key] = sortItemsDesc(dedupeByLink(months[key]));
    }
    return months;
  }

  if (raw.months && typeof raw.months === "object" && !Array.isArray(raw.months)) {
    const months = {};
    for (const [key, list] of Object.entries(raw.months)) {
      if (!Array.isArray(list)) continue;
      months[key] = sortItemsDesc(dedupeByLink(list.map((it) => normalizeItem(it, defaultTag))));
    }
    return months;
  }

  // Articles / items list shape: { articles: [...] } or { items: [...] }
  const arraySource = raw.articles || raw.items;
  if (Array.isArray(arraySource)) {
    const months = {};
    for (const item of arraySource) {
      const key = monthKeyFromDate(item?.date) || yearMonthKey();
      months[key] = months[key] || [];
      months[key].push(normalizeItem(item, defaultTag));
    }
    for (const key of Object.keys(months)) {
      months[key] = sortItemsDesc(dedupeByLink(months[key]));
    }
    return months;
  }

  // Legacy: { current: [], archive: { "YYYY-MM": [] } }
  const months = {};
  if (raw.archive && typeof raw.archive === "object") {
    for (const [key, list] of Object.entries(raw.archive)) {
      if (!Array.isArray(list)) continue;
      months[key] = sortItemsDesc(dedupeByLink(list.map((it) => normalizeItem(it, defaultTag))));
    }
  }
  if (Array.isArray(raw.current)) {
    for (const item of raw.current) {
      const key = monthKeyFromDate(item?.date);
      if (!key) continue;
      months[key] = months[key] || [];
      months[key].push(normalizeItem(item, defaultTag));
    }
    for (const key of Object.keys(months)) {
      months[key] = sortItemsDesc(dedupeByLink(months[key]));
    }
  }
  return months;
}

/** Merge bundled updates.json + updates_archive.json into months map. */
export function monthsFromBundled() {
  const months = {};
  if (bundledArchive && typeof bundledArchive === "object") {
    for (const [key, list] of Object.entries(bundledArchive)) {
      if (!Array.isArray(list)) continue;
      months[key] = sortItemsDesc(dedupeByLink(list.map(normalizeItem)));
    }
  }
  if (Array.isArray(bundledCurrent)) {
    for (const item of bundledCurrent) {
      const key = monthKeyFromDate(item?.date);
      if (!key) continue;
      months[key] = months[key] || [];
      months[key].push(normalizeItem(item));
    }
    for (const key of Object.keys(months)) {
      months[key] = sortItemsDesc(dedupeByLink(months[key]));
    }
  }
  return months;
}

export async function readCachedUpdatesMonths() {
  try {
    const raw = await AsyncStorage.getItem(UPDATES_FEED_CACHE_KEY);
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
      UPDATES_FEED_CACHE_KEY,
      JSON.stringify({ months, cachedAt: new Date().toISOString() }),
    );
  } catch (err) {
    console.warn("Failed to cache updates feed:", err?.message);
  }
}

/**
 * Fetch remote feed. Returns months map or null on failure.
 * Does not throw.
 */
export async function fetchRemoteUpdatesMonths() {
  try {
    const fetchDocSafe = async (path) => {
      try {
        const snap = await Promise.race([
          getDoc(doc(db, ...path)),
          timeoutPromise(FETCH_TIMEOUT_MS),
        ]);
        return snap?.exists?.() ? snap.data() : null;
      } catch (_) {
        return null;
      }
    };

    const [newsData, articlesDataMain, articlesDataAlt, articlesDataTop] =
      await Promise.all([
        fetchDocSafe(UPDATES_FEED_DOC_PATH),
        fetchDocSafe(ARTICLES_FEED_DOC_PATH),
        fetchDocSafe(ARTICLES_FEED_ALT_DOC_PATH),
        fetchDocSafe(["articlesFeed", "current"]),
      ]);

    const newsMonths = newsData ? normalizeMonthsMap(newsData, "NEWS") : {};
    const articlesRaw = articlesDataMain || articlesDataAlt || articlesDataTop;
    const articlesMonths = articlesRaw ? normalizeMonthsMap(articlesRaw, "ARTICLE") : {};

    const combined = mergeMonthsMaps(newsMonths, articlesMonths);
    if (Object.keys(combined).length === 0) return null;

    await writeCachedUpdatesMonths(combined);
    return combined;
  } catch (err) {
    console.warn("Updates feed fetch failed:", err?.message);
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
 * Resolve feed with fallback order: network → cache → bundled.
 * Concurrent callers share one in-flight request.
 * @returns {Promise<{ months: Object, source: 'remote'|'cache'|'bundled' }>}
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

/** Kick off the feed fetch at app start so Dashboard is not waiting on first paint. */
export function prefetchUpdatesMonths() {
  return loadUpdatesMonths();
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
 * Display slice applied by caller.
 */
export function pickDashboardUpdates(months, { maxItems = 5, filter = "ALL" } = {}) {
  const filterNonAcademic = (list) =>
    (list || []).filter((u) => u?.category !== "Academic Content Update");

  const normalizedFilter = String(filter || "ALL").trim().toUpperCase();
  const matchesFilter = (u) =>
    normalizedFilter === "ALL" || getUpdateType(u) === normalizedFilter;

  const now = new Date();
  const currentKey = yearMonthKey(now);
  const prevKey = previousYearMonthKey(now);

  let list = filterNonAcademic(months?.[currentKey]).filter(matchesFilter);
  if (!list.length) {
    list = filterNonAcademic(months?.[prevKey]).filter(matchesFilter);
  }
  if (!list.length) {
    const all = [];
    for (const items of Object.values(months || {})) {
      if (Array.isArray(items)) all.push(...items);
    }
    list = sortItemsDesc(filterNonAcademic(all).filter(matchesFilter));
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
