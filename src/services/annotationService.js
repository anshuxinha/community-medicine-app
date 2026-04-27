import { doc, getDoc, setDoc } from "firebase/firestore";
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

  try {
    const docRef = doc(db, "users", uid, "annotations", contentKey);
    const snapshot = await Promise.race([
      getDoc(docRef),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000),
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

    return [];
  } catch (err) {
    console.warn("Failed to load annotations from Firestore:", err?.message);
    // Fallback to cache
    try {
      const cached = await AsyncStorage.getItem(getCacheKey(uid, contentKey));
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }
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
