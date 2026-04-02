import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { DEFAULT_TOPIC_ILLUSTRATION_MAP } from "../data/defaultTopicIllustrations";

const COLLECTION_NAME = "topicIllustrations";
const remoteIllustrationCache = new Map();

const normalizeIllustration = (image = {}) => {
  // Prioritize Firebase Storage URL over local source
  // If we have a URL, we don't need a local source
  let url = image.url || null;

  // If no URL but we have a fileName, construct Firebase Storage URL
  if (!url && image.fileName) {
    // Base URL for Firebase Storage bucket
    const storageBucket = "community-med-app.firebasestorage.app";
    url = `https://storage.googleapis.com/${storageBucket}/reading-illustrations/${image.fileName}`;
  }

  // Only keep source if no URL is available (for fallback/offline support)
  // But for Firebase hosting, we expect URL to always be present
  const source = url ? null : image.source;

  console.log("normalizeIllustration:", {
    id: image.id,
    fileName: image.fileName,
    hasUrl: !!url,
    hasSource: !!source,
    constructedUrl: !image.url && image.fileName ? "yes" : "no",
  });

  return {
    id: image.id || null,
    alt: image.alt || "Topic illustration",
    caption: image.caption || "",
    purpose: image.purpose || "",
    url: url,
    source: source,
    anchorText: image.anchorText || "",
    placement:
      image.placement === "before"
        ? "before"
        : image.placement === "bottom"
          ? "bottom"
          : image.placement === "top"
            ? "top"
            : "after",
    aspectRatio:
      typeof image.aspectRatio === "number" && image.aspectRatio > 0
        ? image.aspectRatio
        : 1,
  };
};

const mergeIllustrations = (defaults = [], remote = []) => {
  console.log(
    "mergeIllustrations: defaults count",
    defaults.length,
    "remote count",
    remote.length,
  );
  const merged = new Map();

  defaults.forEach((image) => {
    const normalized = normalizeIllustration(image);
    const key = normalized.id || `${normalized.anchorText}:${normalized.alt}`;
    console.log(
      "default image key",
      key,
      "hasUrl",
      !!normalized.url,
      "hasSource",
      !!normalized.source,
    );
    merged.set(key, normalized);
  });

  remote.forEach((image) => {
    const normalized = normalizeIllustration(image);
    const key = normalized.id || `${normalized.anchorText}:${normalized.alt}`;
    const existing = merged.get(key) || {};

    // Remote images (from Firebase) should have URLs
    // Prefer remote URL over local source
    merged.set(key, {
      ...existing,
      ...normalized,
      // Keep source only if no URL is available
      source: normalized.url ? null : normalized.source || existing.source,
      url: normalized.url || existing.url || null,
    });
  });

  // Filter: keep images that have either a URL (Firebase) or source (local fallback)
  const filtered = [...merged.values()].filter(
    (image) => image.url || image.source,
  );
  console.log("mergeIllustrations: after filtering", filtered.length, "images");
  filtered.forEach((img) =>
    console.log(" -", img.id, "hasUrl", !!img.url, "hasSource", !!img.source),
  );
  return filtered;
};

const buildIllustrationDocId = (section, topicId) =>
  `${section}__${String(topicId)}`;

export const getTopicIllustrations = async ({
  section,
  topicId,
  contentKey,
}) => {
  if (!section || topicId === undefined || topicId === null) {
    console.log("getTopicIllustrations: missing section or topicId", {
      section,
      topicId,
    });
    return [];
  }

  const resolvedContentKey = contentKey || `${section}:${String(topicId)}`;
  console.log("getTopicIllustrations: resolvedContentKey", resolvedContentKey);
  const defaultIllustrations =
    DEFAULT_TOPIC_ILLUSTRATION_MAP.get(resolvedContentKey) || [];
  console.log(
    "getTopicIllustrations: defaultIllustrations count",
    defaultIllustrations.length,
  );
  const docId = buildIllustrationDocId(section, topicId);

  if (remoteIllustrationCache.has(docId)) {
    console.log(
      "getTopicIllustrations: using cached remote illustrations for",
      docId,
    );
    return mergeIllustrations(
      defaultIllustrations,
      remoteIllustrationCache.get(docId),
    );
  }

  try {
    const snapshot = await getDoc(doc(db, COLLECTION_NAME, docId));
    const remoteImages =
      snapshot.exists() && Array.isArray(snapshot.data()?.images)
        ? snapshot.data().images
        : [];

    console.log(
      "getTopicIllustrations: fetched remoteImages count",
      remoteImages.length,
      "for docId",
      docId,
    );
    remoteIllustrationCache.set(docId, remoteImages);
    return mergeIllustrations(defaultIllustrations, remoteImages);
  } catch (error) {
    console.log(
      "getTopicIllustrations: error fetching remote illustrations",
      error,
    );
    return mergeIllustrations(defaultIllustrations, []);
  }
};
