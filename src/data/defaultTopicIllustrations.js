import illustrationSeed from "./topicIllustrations.seed.json";

// No local image imports - all images will be loaded from Firebase Storage URLs
// This reduces app bundle size significantly

// Placeholder image source for fallback (only used if absolutely needed)
const PLACEHOLDER_SOURCE = require("../../assets/icon.png");

export const DEFAULT_TOPIC_ILLUSTRATION_MAP = illustrationSeed.reduce(
  (accumulator, entry) => {
    const images = Array.isArray(entry.images)
      ? entry.images.map((image) => {
          // For Firebase hosting, we don't need local sources
          // Images will be loaded from Firebase Storage URLs
          const source = null; // No local source - images will come from Firebase URLs

          console.log(
            `Default illustration mapping (Firebase): ${entry.contentKey} -> ${image.fileName} - using Firebase URL`,
          );
          return {
            ...image,
            source, // null - images will be loaded from Firebase URLs
          };
        })
      : [];

    accumulator.set(entry.contentKey, images);
    return accumulator;
  },
  new Map(),
);

export const TOPIC_ILLUSTRATION_SEED = illustrationSeed;
