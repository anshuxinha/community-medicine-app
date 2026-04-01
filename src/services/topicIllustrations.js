import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { DEFAULT_TOPIC_ILLUSTRATION_MAP } from "../data/defaultTopicIllustrations";

const COLLECTION_NAME = "topicIllustrations";
const remoteIllustrationCache = new Map();

const normalizeIllustration = (image = {}) => {
  // Ensure source is never undefined - use a placeholder if needed
  let source = image.source;
  if (!source && image.fileName) {
    // Try to get source from default imports
    const {
      DEFAULT_TOPIC_ILLUSTRATION_MAP,
    } = require("../data/defaultTopicIllustrations");
    const contentKey = image.contentKey || "";
    const defaultImages = DEFAULT_TOPIC_ILLUSTRATION_MAP.get(contentKey) || [];
    const matchingImage = defaultImages.find(
      (img) => img.fileName === image.fileName,
    );
    if (matchingImage && matchingImage.source) {
      source = matchingImage.source;
    }
  }

  console.log("normalizeIllustration:", {
    id: image.id,
    fileName: image.fileName,
    source: source ? "defined" : "undefined",
    url: image.url,
  });
  return {
    id: image.id || null,
    alt: image.alt || "Topic illustration",
    caption: image.caption || "",
    purpose: image.purpose || "",
    url: image.url || null,
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
      "source",
      normalized.source,
      "url",
      normalized.url,
    );
    merged.set(key, normalized);
  });

  remote.forEach((image) => {
    const normalized = normalizeIllustration(image);
    const key = normalized.id || `${normalized.anchorText}:${normalized.alt}`;
    const existing = merged.get(key) || {};
    merged.set(key, {
      ...existing,
      ...normalized,
      source: normalized.source || existing.source,
      url: normalized.url || existing.url || null,
    });
  });

  const filtered = [...merged.values()].filter(
    (image) => image.source || image.url,
  );
  console.log("mergeIllustrations: after filtering", filtered.length, "images");
  filtered.forEach((img) =>
    console.log(" -", img.id, "source", img.source, "url", img.url),
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
