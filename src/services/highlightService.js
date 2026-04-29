import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../config/firebase";

const CACHE_PREFIX = "highlights:";

const getCacheKey = (uid, contentKey) =>
  `${CACHE_PREFIX}${uid}:${contentKey}`;

/**
 * Load highlights for a specific content item.
 * Returns an object where keys are highlight IDs (e.g. "12:0") and values are true.
 * Tries Firestore first, falls back to AsyncStorage cache.
 */
export const loadHighlights = async (uid, contentKey) => {
  if (!uid || !contentKey) return {};

  const docRef = doc(db, "users", uid, "highlights", contentKey);
  const timeouts = [5000, 8000, 12000];

  for (let attempt = 0; attempt < timeouts.length; attempt++) {
    try {
      const snapshot = await Promise.race([
        getDoc(docRef),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), timeouts[attempt]),
        ),
      ]);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const highlights = data.highlights && typeof data.highlights === "object"
          ? data.highlights
          : {};
        // Cache locally
        await AsyncStorage.setItem(
          getCacheKey(uid, contentKey),
          JSON.stringify(highlights),
        );
        return highlights;
      }

      // Doc doesn't exist on server — no data to restore
      return {};
    } catch (err) {
      console.warn(
        `Failed to load highlights (attempt ${attempt + 1}/${timeouts.length}):`,
        err?.message,
      );

      // Only fall back to cache on the final attempt
      if (attempt === timeouts.length - 1) {
        try {
          const cached = await AsyncStorage.getItem(getCacheKey(uid, contentKey));
          return cached ? JSON.parse(cached) : {};
        } catch {
          return {};
        }
      }
    }
  }

  return {};
};

/**
 * Save the full highlights object for a content item.
 */
export const saveHighlights = async (uid, contentKey, highlights) => {
  if (!uid || !contentKey) return;

  const safe = highlights && typeof highlights === "object" ? highlights : {};

  // Always cache locally first
  try {
    await AsyncStorage.setItem(
      getCacheKey(uid, contentKey),
      JSON.stringify(safe),
    );
  } catch (err) {
    console.warn("Failed to cache highlights:", err?.message);
  }

  // Sync to Firestore
  try {
    const docRef = doc(db, "users", uid, "highlights", contentKey);
    await setDoc(docRef, { highlights: safe }, { merge: true });
  } catch (err) {
    console.warn("Failed to sync highlights to Firestore:", err?.message);
  }
};

/**
 * Fetch all highlights for a user from Firestore and cache them locally.
 */
export const syncAllHighlights = async (uid) => {
  if (!uid) return;

  try {
    const highlightsRef = collection(db, "users", uid, "highlights");
    const snapshot = await getDocs(highlightsRef);

    const cachePromises = snapshot.docs.map(async (docSnap) => {
      const contentKey = docSnap.id;
      const data = docSnap.data();
      if (data && data.highlights && typeof data.highlights === "object") {
        await AsyncStorage.setItem(
          getCacheKey(uid, contentKey),
          JSON.stringify(data.highlights)
        );
      }
    });

    await Promise.all(cachePromises);
  } catch (err) {
    console.warn("Failed to sync all highlights:", err?.message);
  }
};
