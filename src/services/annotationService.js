import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../config/firebase";

const CACHE_PREFIX = "annotations:";

const getCacheKey = (uid, contentKey) =>
  `${CACHE_PREFIX}${uid}:${contentKey}`;

/**
 * Load annotations for a specific content item.
 * Tries Firestore first, falls back to AsyncStorage cache.
 */
export const loadAnnotations = async (uid, contentKey) => {
  if (!uid || !contentKey) return [];

  const docRef = doc(db, "users", uid, "annotations", contentKey);
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
        const annotations = Array.isArray(data.annotations)
          ? data.annotations
          : [];
        // Cache locally
        await AsyncStorage.setItem(
          getCacheKey(uid, contentKey),
          JSON.stringify(annotations),
        );
        return annotations;
      }

      // Doc doesn't exist on server — no data to restore
      return [];
    } catch (err) {
      console.warn(
        `Failed to load annotations (attempt ${attempt + 1}/${timeouts.length}):`,
        err?.message,
      );

      // Only fall back to cache on the final attempt
      if (attempt === timeouts.length - 1) {
        try {
          const cached = await AsyncStorage.getItem(getCacheKey(uid, contentKey));
          return cached ? JSON.parse(cached) : [];
        } catch {
          return [];
        }
      }
    }
  }

  return [];
};

/**
 * Save the full annotations array for a content item.
 */
export const saveAnnotations = async (uid, contentKey, annotations) => {
  if (!uid || !contentKey) return;

  const safe = Array.isArray(annotations) ? annotations : [];

  // Always cache locally first
  try {
    await AsyncStorage.setItem(
      getCacheKey(uid, contentKey),
      JSON.stringify(safe),
    );
  } catch (err) {
    console.warn("Failed to cache annotations:", err?.message);
  }

  // Sync to Firestore
  try {
    const docRef = doc(db, "users", uid, "annotations", contentKey);
    await setDoc(docRef, { annotations: safe }, { merge: true });
  } catch (err) {
    console.warn("Failed to sync annotations to Firestore:", err?.message);
  }
};

/**
 * Fetch all annotations for a user from Firestore and cache them locally.
 */
export const syncAllAnnotations = async (uid) => {
  if (!uid) return;

  try {
    const annotationsRef = collection(db, "users", uid, "annotations");
    const snapshot = await getDocs(annotationsRef);

    const cachePromises = snapshot.docs.map(async (docSnap) => {
      const contentKey = docSnap.id;
      const data = docSnap.data();
      if (data && Array.isArray(data.annotations)) {
        await AsyncStorage.setItem(
          getCacheKey(uid, contentKey),
          JSON.stringify(data.annotations)
        );
      }
    });

    await Promise.all(cachePromises);
  } catch (err) {
    console.warn("Failed to sync all annotations:", err?.message);
  }
};
