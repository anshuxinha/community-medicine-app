export const createLruCache = (maxSize = 8) => {
  const map = new Map();
  const limit = Math.max(1, maxSize);

  return {
    get(key) {
      if (!map.has(key)) return undefined;
      const value = map.get(key);
      map.delete(key);
      map.set(key, value);
      return value;
    },
    set(key, value) {
      if (map.has(key)) map.delete(key);
      map.set(key, value);
      while (map.size > limit) {
        const oldest = map.keys().next().value;
        map.delete(oldest);
      }
    },
    has(key) {
      return map.has(key);
    },
    clear() {
      map.clear();
    },
    get size() {
      return map.size;
    },
  };
};
