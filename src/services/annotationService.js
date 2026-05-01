import { doc, getDoc, setDoc, collection, getDocs, getDocFromServer, getDocsFromServer, onSnapshot } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../config/firebase";

const CACHE_PREFIX = "annotations:";

const getCacheKey = (uid, contentKey) =>
  `${CACHE_PREFIX}${uid}:${contentKey}`;

/**
 * Load annotations for a specific content item.
 * Returns cached data immediately and fetches from Firestore in the background.
 * The onUpdate callback is called if the server returns different data.
 */
export const loadAnnotations = async (uid, contentKey, onUpdate) => {
  if (!uid || !contentKey) return [];

  // 1. Try AsyncStorage cache first (instant, populated by syncAllAnnotations)
  let cached = null;
  try {
    const raw = await AsyncStorage.getItem(getCacheKey(uid, contentKey));
    if (raw) cached = JSON.parse(raw);
  } catch {}

  // 2. Fetch from Firestore server (authoritative)
  const fetchFromServer = async () => {
    try {
      const docRef = doc(db, "users", uid, "annotations", contentKey);
      const snapshot = await Promise.race([
        getDocFromServer(docRef),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 10000),
        ),
      ]);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const annotations = Array.isArray(data.annotations)
          ? data.annotations
          : [];
        // Update cache
        await AsyncStorage.setItem(
          getCacheKey(uid, contentKey),
          JSON.stringify(annotations),
        );
        return annotations;
      }

      return [];
    } catch (err) {
      console.warn("Failed to load annotations from server:", err?.message);
      return null; // null = server unavailable, keep cached
    }
  };

  if (cached && cached.length > 0) {
    // Return cache immediately, refresh from server in the background
    fetchFromServer().then((serverData) => {
      if (serverData !== null && onUpdate) {
        onUpdate(serverData);
      }
    });
    return cached;
  }

  // No cache — must wait for server
  const serverData = await fetchFromServer();
  return serverData !== null ? serverData : [];
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
    await setDoc(docRef, { annotations: safe });
  } catch (err) {
    console.warn("Failed to sync annotations to Firestore:", err?.message);
  }
};

/**
 * Subscribe to annotations for a specific content item in real-time.
 */
export const subscribeAnnotations = (uid, contentKey, onUpdate) => {
  if (!uid || !contentKey) return () => {};

  const docRef = doc(db, "users", uid, "annotations", contentKey);
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      const annotations = Array.isArray(data.annotations) ? data.annotations : [];
      AsyncStorage.setItem(getCacheKey(uid, contentKey), JSON.stringify(annotations)).catch(() => {});
      if (onUpdate) onUpdate(annotations);
    } else {
      if (onUpdate) onUpdate([]);
    }
  }, (err) => {
    console.warn("Failed to subscribe to annotations:", err?.message);
  });

  return unsubscribe;
};

/**
 * Fetch all annotations for a user from Firestore and cache them locally.
 */
export const syncAllAnnotations = async (uid) => {
  if (!uid) return;

  try {
    const annotationsRef = collection(db, "users", uid, "annotations");
    const snapshot = await getDocsFromServer(annotationsRef);

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
