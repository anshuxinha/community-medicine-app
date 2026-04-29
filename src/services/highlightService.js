import { doc, getDoc, setDoc, collection, getDocs, getDocFromServer, getDocsFromServer } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../config/firebase";

const CACHE_PREFIX = "highlights:";

const getCacheKey = (uid, contentKey) =>
  `${CACHE_PREFIX}${uid}:${contentKey}`;

/**
 * Load highlights for a specific content item.
 * Returns cached data immediately and fetches from Firestore in the background.
 * The onUpdate callback is called if the server returns different data.
 */
export const loadHighlights = async (uid, contentKey, onUpdate) => {
  if (!uid || !contentKey) return {};

  // 1. Try AsyncStorage cache first (instant, populated by syncAllHighlights)
  let cached = null;
  try {
    const raw = await AsyncStorage.getItem(getCacheKey(uid, contentKey));
    if (raw) cached = JSON.parse(raw);
  } catch {}

  // 2. Fetch from Firestore server (authoritative)
  const fetchFromServer = async () => {
    try {
      const docRef = doc(db, "users", uid, "highlights", contentKey);
      const snapshot = await Promise.race([
        getDocFromServer(docRef),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 10000),
        ),
      ]);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const highlights = data.highlights && typeof data.highlights === "object"
          ? data.highlights
          : {};
        // Update cache
        await AsyncStorage.setItem(
          getCacheKey(uid, contentKey),
          JSON.stringify(highlights),
        );
        return highlights;
      }

      return {};
    } catch (err) {
      console.warn("Failed to load highlights from server:", err?.message);
      return null; // null = server unavailable, keep cached
    }
  };

  if (cached && Object.keys(cached).length > 0) {
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
  return serverData !== null ? serverData : {};
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
    const snapshot = await getDocsFromServer(highlightsRef);

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
