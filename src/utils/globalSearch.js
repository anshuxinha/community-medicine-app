import { CONTENT_SECTIONS, getContentKey } from "./contentRegistry";
import { isVideoFree } from "../services/videoService";

export { isVideoFree };

const FREE_MUSEUM_CATEGORY = "Contraceptives";

export const SEARCH_TYPES = [
  { id: "library", label: "Library", icon: "menu-book" },
  { id: "gems", label: "Gems", icon: "diamond-stone" },
  { id: "museum", label: "Museum", icon: "museum" },
  { id: "videos", label: "Videos", icon: "ondemand-video" },
];

const stripMarkup = (value = "") =>
  String(value)
    .replace(/\*\[Image Placeholders?:\s*.+?\]\*/gi, "")
    .replace(/\[REF\].*?\[\/REF\]/gis, "")
    .replace(/[#*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normalize = (value = "") => String(value).toLowerCase();

const includesQuery = (value, query) => {
  if (!query) return false;
  return normalize(value).includes(query);
};

/**
 * Rank: title matches first, then body-only. Stable within each bucket.
 */
const rankMatches = (items) => {
  const titleHits = [];
  const bodyHits = [];
  items.forEach((item) => {
    if (item._titleMatch) titleHits.push(item);
    else bodyHits.push(item);
  });
  return [...titleHits, ...bodyHits].map(({ _titleMatch, ...rest }) => rest);
};

const isLibraryFree = (item) =>
  item.id === "1" ||
  item.title === "Man and Medicine" ||
  item.parentTitle === "Man and Medicine";

export const isMuseumItemFree = (item) =>
  item?.category === FREE_MUSEUM_CATEGORY;

/** Flatten library topics (including subsections) into searchable leaf-like rows. */
export const buildLibraryIndex = () => {
  const result = [];

  const walk = (items, section, parentTitle = null) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      if (Array.isArray(item.subsections) && item.subsections.length > 0) {
        walk(item.subsections, section, item.title || parentTitle);
        return;
      }
      const content = item.content || "";
      result.push({
        id: String(item.id),
        type: "library",
        title: item.title || "",
        subtitle: parentTitle
          ? `${section === "practical" ? "Practical" : "Theory"} · ${parentTitle}`
          : section === "practical"
            ? "Practical"
            : "Theory",
        searchText: `${item.title || ""} ${content}`,
        isFree: isLibraryFree({
          id: item.id,
          title: item.title,
          parentTitle,
        }),
        section,
        parentTitle,
        content,
        quizzes: item.quizzes,
        contentKey: getContentKey(section, item.id),
        rawItem: item,
      });
    });
  };

  walk(CONTENT_SECTIONS.theory, "theory");
  walk(CONTENT_SECTIONS.practical, "practical");
  return result;
};

export const buildGemsIndex = (gemsData = []) => {
  const result = [];
  gemsData.forEach((section) => {
    const sectionTitle = section.title || "";
    (section.gems || []).forEach((gem) => {
      const content = gem.content || "";
      result.push({
        id: String(gem.id),
        type: "gems",
        title: gem.title || "",
        subtitle: sectionTitle.replace(/SECTION \d+:\s*/i, ""),
        searchText: `${gem.title || ""} ${content}`,
        isFree: false,
        sectionId: section.id,
        sectionTitle,
        content,
        contentKey: `gems:${section.id}:${gem.id}`,
      });
    });
  });
  return result;
};

export const buildMuseumIndex = (museumItems = []) => {
  return museumItems.map((item) => {
    const description = item.description || "";
    const keyFact = item.keyFact || "";
    return {
      id: String(item.id),
      type: "museum",
      title: item.title || "",
      subtitle: item.category || "Museum",
      searchText: `${item.title || ""} ${description} ${keyFact} ${item.category || ""}`,
      isFree: isMuseumItemFree(item),
      emoji: item.emoji,
      category: item.category,
      image: item.image,
      description,
      content: description || keyFact,
    };
  });
};

export const buildVideosIndex = (videos = []) => {
  return videos.map((video) => {
    const description = video.description || video.summary || "";
    return {
      id: String(video.id),
      type: "videos",
      title: video.title || "Untitled video",
      subtitle: video.categoryLabel || video.category || "Video",
      searchText: `${video.title || ""} ${description} ${video.categoryLabel || ""} ${video.category || ""}`,
      isFree: isVideoFree(video),
      content: description,
      video,
    };
  });
};

export const matchIndex = (index = [], query = "") => {
  const q = normalize(query).trim();
  if (!q) return [];

  const hits = [];
  index.forEach((entry) => {
    const titleMatch = includesQuery(entry.title, q);
    const bodyMatch =
      !titleMatch &&
      (includesQuery(entry.searchText, q) || includesQuery(entry.subtitle, q));
    if (titleMatch || bodyMatch) {
      hits.push({ ...entry, _titleMatch: titleMatch });
    }
  });
  return rankMatches(hits);
};

/** Plain text used for result snippets (built only for displayed rows). */
export const getSnippetSource = (entry) =>
  stripMarkup(entry?.content || entry?.description || entry?.snippetSource || "");

export const searchAll = (indexes, query) => {
  const q = String(query || "").trim();
  if (!q) {
    return { library: [], gems: [], museum: [], videos: [] };
  }
  return {
    library: matchIndex(indexes.library, q),
    gems: matchIndex(indexes.gems, q),
    museum: matchIndex(indexes.museum, q),
    videos: matchIndex(indexes.videos, q),
  };
};

export const getExcerptAroundMatch = (text, query, context = 55) => {
  if (!text || !query) return null;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return null;
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return null;

  const start = Math.max(0, idx - context);
  const end = Math.min(text.length, idx + lowerQuery.length + context);
  return {
    prefix: (start > 0 ? "\u2026" : "") + text.slice(start, idx),
    match: text.slice(idx, idx + lowerQuery.length),
    suffix:
      text.slice(idx + lowerQuery.length, end) +
      (end < text.length ? "\u2026" : ""),
  };
};

export const typesWithResults = (grouped) =>
  SEARCH_TYPES.filter((t) => (grouped[t.id] || []).length > 0).map((t) => ({
    ...t,
    count: (grouped[t.id] || []).length,
  }));
