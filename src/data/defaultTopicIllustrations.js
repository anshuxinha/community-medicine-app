import illustrationSeed from "./topicIllustrations.seed.json";

// No local image imports - all images will be loaded from Firebase Storage URLs
// This reduces app bundle size significantly

// Placeholder image source for fallback (only used if absolutely needed)
const PLACEHOLDER_SOURCE = require("../../assets/icon.png");

export const DEFAULT_TOPIC_ILLUSTRATION_MAP = illustrationSeed.reduce(
  (accumulator, entry) => {
    const images = Array.isArray(entry.images)
      ? entry.images.map((image) => {
          // For Firebase hosting, we prefer URLs from Firebase Storage
          // Use placeholder source as fallback to ensure images pass filter
          // This will be overridden by Firebase URLs when available
          const source = PLACEHOLDER_SOURCE;

          console.log(
            `Default illustration mapping (Firebase): ${entry.contentKey} -> ${image.fileName} - using placeholder with Firebase URL fallback`,
          );
          return {
            ...image,
            source, // Placeholder source to pass filter, will be overridden by Firebase URLs
          };
        })
      : [];

    accumulator.set(entry.contentKey, images);
    return accumulator;
  },
  new Map(),
);

export const TOPIC_ILLUSTRATION_SEED = illustrationSeed;
