import {
  doc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { DEFAULT_TOPIC_ILLUSTRATION_MAP } from "../data/defaultTopicIllustrations";

const COLLECTION_NAME = "topicIllustrations";
const remoteIllustrationCache = new Map();

const normalizeIllustration = (image = {}, basePath = "reading-illustrations") => {
  // Prioritize Firebase Storage URL over local source
  // If we have a URL, we don't need a local source
  let url = image.url || null;

  // If no URL but we have a fileName, construct Firebase Storage URL
  if (!url && image.fileName) {
    // Base URL for Firebase Storage bucket
    const storageBucket = "community-med-app.firebasestorage.app";
    // Sanitize fileName to prevent path traversal (T-02-01)
    const sanitizedFileName = String(image.fileName).replace(/\.\.\//g, "");
    url = `https://storage.googleapis.com/${storageBucket}/${basePath}/${sanitizedFileName}`;
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

const mergeIllustrations = (
  defaults = [],
  remote = [],
  basePath = "reading-illustrations",
) => {
  console.log(
    "mergeIllustrations: defaults count",
    defaults.length,
    "remote count",
    remote.length,
    "basePath",
    basePath,
  );
  const merged = new Map();

  defaults.forEach((image) => {
    const normalized = normalizeIllustration(image, basePath);
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
    const normalized = normalizeIllustration(image, basePath);
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
  const basePath = resolvedContentKey.startsWith("gems:")
    ? "gems"
    : "reading-illustrations";

  console.log(
    "getTopicIllustrations: resolvedContentKey",
    resolvedContentKey,
    "basePath",
    basePath,
  );

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
      basePath,
    );
  }

  let fetchStatus = "idle";
  let errorDetail = null;

  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    let snapshot = null;
    fetchStatus = "trying_getDoc";
    try {
      snapshot = await getDoc(docRef);
    } catch (e) {
      console.warn(`getTopicIllustrations: getDoc failed for ${docId}`, e);
      errorDetail = `getDoc_failed: ${e.message}`;
    }

    let remoteImages = [];

    if (snapshot && snapshot.exists() && Array.isArray(snapshot.data()?.images)) {
      remoteImages = snapshot.data().images;
      fetchStatus = "success_getDoc";
    } else {
      // Fallback query by contentKey (D-02, D-03)
      fetchStatus = "trying_query";
      const q = query(
        collection(db, COLLECTION_NAME),
        where("contentKey", "==", resolvedContentKey),
        limit(1),
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        remoteImages = Array.isArray(docData.images) ? docData.images : [];
        fetchStatus = "success_query";
      } else {
        fetchStatus = "not_found";
      }
    }

    console.log(
      "getTopicIllustrations: finished fetching",
      remoteImages.length,
      "images for",
      resolvedContentKey,
    );
    remoteIllustrationCache.set(docId, remoteImages);
    return mergeIllustrations(defaultIllustrations, remoteImages, basePath);
  } catch (error) {
    console.error(
      "getTopicIllustrations: FATAL error fetching remote illustrations",
      error,
    );
    return mergeIllustrations(defaultIllustrations, [], basePath);
  }
};
