import illustrationSeed from "./topicIllustrations.seed.json";

// No local image imports - all images will be loaded from Firebase Storage URLs
// This reduces app bundle size significantly

export const DEFAULT_TOPIC_ILLUSTRATION_MAP = illustrationSeed.reduce(
  (accumulator, entry) => {
    const images = Array.isArray(entry.images)
      ? entry.images.map((image) => {
          // For Firebase hosting, we don't use local sources
          // Images will be loaded from Firebase Storage URLs
          // Keep source as null - Firebase URLs will be added during merge
          console.log(
            `Default illustration mapping (Firebase): ${entry.contentKey} -> ${image.fileName} - expecting Firebase URL`,
          );
          return {
            ...image,
            source: null, // No local source - images will come from Firebase URLs
          };
        })
      : [];

    accumulator.set(entry.contentKey, images);
    return accumulator;
  },
  new Map(),
);

export const TOPIC_ILLUSTRATION_SEED = illustrationSeed;
