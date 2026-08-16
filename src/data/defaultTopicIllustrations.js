import illustrationSeed from "./topicIllustrations.seed.json";

// No local image imports - all images will be loaded from Firebase Storage URLs
// This reduces app bundle size significantly

export const DEFAULT_TOPIC_ILLUSTRATION_MAP = illustrationSeed.reduce(
  (accumulator, entry) => {
    const images = Array.isArray(entry.images)
      ? entry.images.map((image) => ({
          ...image,
          source: null,
        }))
      : [];

    accumulator.set(entry.contentKey, images);
    return accumulator;
  },
  new Map(),
);

export const TOPIC_ILLUSTRATION_SEED = illustrationSeed;
