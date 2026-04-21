import React, { createContext, useState, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
  subscribeToScreenCaptureChange,
} from "../utils/screenCaptureProtection";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { db, auth } from "../config/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  FieldValue,
} from "firebase/firestore";
import { getDeviceId, getDeviceInfo } from "../utils/deviceUtils";
import { onAuthStateChanged, getIdTokenResult, signOut } from "firebase/auth";
import * as Notifications from "expo-notifications";
import { theme } from "../styles/theme";
import { triggerStreakMilestone } from "../services/notificationService";
import {
  VALID_MASTER_TITLES,
  VALID_CONTENT_KEYS,
  TOTAL_LEAF_CONTENT_ITEMS,
  getEffectiveReadCount,
  getContentKey,
  getReadTitles,
  migrateLegacyReadItems,
} from "../utils/contentRegistry";

let Purchases;
let GoogleSignin;
if (Constants.appOwnership !== "expo") {
  Purchases = require("react-native-purchases").default;
  GoogleSignin =
    require("@react-native-google-signin/google-signin").GoogleSignin;
  GoogleSignin.configure({
    webClientId:
      "856703659616-8e0k1obmgom04783jjf695hkianm4hme.apps.googleusercontent.com",
  });
}

// Device limit constant — single device enforcement
const MAX_DEVICES = 1;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const getAccountStateKey = (uid) => `accountState:${uid}`;
const hasRevenueCatPremiumEntitlement = (customerInfo) =>
  customerInfo?.entitlements?.active?.Premium != null;

const sanitizeReadItemVersions = (value) => {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value).reduce((accumulator, [key, version]) => {
    if (VALID_CONTENT_KEYS.has(key) && typeof version === "string") {
      accumulator[key] = version;
    }
    return accumulator;
  }, {});
};

const resolveBookmarkContentKey = (item) => {
  if (!item || typeof item !== "object") return null;
  if (
    typeof item.contentKey === "string" &&
    VALID_CONTENT_KEYS.has(item.contentKey)
  ) {
    return item.contentKey;
  }
  if (typeof item.section === "string" && item.id !== undefined) {
    const derivedKey = getContentKey(item.section, item.id);
    if (VALID_CONTENT_KEYS.has(derivedKey)) {
      return derivedKey;
    }
  }
  return null;
};

const normalizeBookmarks = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .filter(
      (item) =>
        item &&
        typeof item.title === "string" &&
        VALID_MASTER_TITLES.has(item.title),
    )
    .map((item) => ({
      ...item,
      contentKey: resolveBookmarkContentKey(item) || item.contentKey || null,
    }));
};

const sanitizeCloudState = (data = {}) => ({
  readItems: Array.isArray(data.readItems)
    ? data.readItems.filter((title) => VALID_MASTER_TITLES.has(title))
    : [],
  readItemVersions: sanitizeReadItemVersions(data.readItemVersions),
  bookmarks: normalizeBookmarks(data.bookmarks),
  currentStreak:
    typeof data.currentStreak === "number" ? data.currentStreak : 0,
  lastReadDate:
    typeof data.lastReadDate === "string" ? data.lastReadDate : null,
  studyScore: typeof data.studyScore === "number" ? data.studyScore : 0,
  dailyReadHistory:
    data.dailyReadHistory && typeof data.dailyReadHistory === "object"
      ? data.dailyReadHistory
      : {},
});

const dayDiffFromToday = (dateString) => {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return null;

  const today = new Date();
  const startToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startParsed = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  );
  return Math.round((startToday - startParsed) / MS_PER_DAY);
};

// SafeNotifications wrapper removed — notificationService.js now handles
// notification handler setup via ensureNotificationHandler() to avoid duplicates.
const SafeNotifications = Notifications;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [readItems, setReadItems] = useState([]);
  const [readItemVersions, setReadItemVersions] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [highlights, setHighlights] = useState({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastReadDate, setLastReadDate] = useState(null);
  const [studyScore, setStudyScore] = useState(0);
  const [dailyReadHistory, setDailyReadHistory] = useState({});

  const [user, setUser] = useState(undefined);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumType, setPremiumType] = useState(null);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState(null);
  const [accountPremium, setAccountPremium] = useState(false);
  const [revenueCatPremium, setRevenueCatPremium] = useState(false);
  const [deviceConflict, setDeviceConflict] = useState(null);
  const [registeredDevices, setRegisteredDevices] = useState([]);
  const [isScreenCapturePrevented, setIsScreenCapturePrevented] =
    useState(false);
  const isLoggingOutRef = useRef(false);
  const cloudHydratedRef = useRef(false);
  const currentDeviceIdRef = useRef(null);
  const lastRefreshRef = useRef(0);

  const totalItems =
    TOTAL_LEAF_CONTENT_ITEMS > 0 ? TOTAL_LEAF_CONTENT_ITEMS : 1;

  const timeoutPromise = (ms) =>
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error("Firebase Request Timed Out (Offline/Slow Network)"),
          ),
        ms,
      ),
    );

  const hydrateStoredState = (rawState = {}) => {
    const parsedState = sanitizeCloudState(rawState);
    const migratedReadItemVersions = migrateLegacyReadItems(
      parsedState.readItems,
      parsedState.readItemVersions,
    );

    setReadItems(parsedState.readItems);
    setReadItemVersions(migratedReadItemVersions);
    setBookmarks(parsedState.bookmarks);
    setCurrentStreak(parsedState.currentStreak);
    setLastReadDate(parsedState.lastReadDate);
    setStudyScore(parsedState.studyScore);
    setDailyReadHistory(parsedState.dailyReadHistory);

    return {
      ...parsedState,
      readItemVersions: migratedReadItemVersions,
    };
  };

  useEffect(() => {
    setIsPremium(accountPremium || revenueCatPremium);
  }, [accountPremium, revenueCatPremium]);

  // Register device and check device limit (single device enforcement)
  const registerDeviceForUser = async (userId) => {
    try {
      const deviceInfo = await getDeviceInfo();
      const deviceId = deviceInfo.deviceId;
      currentDeviceIdRef.current = deviceId;

      const userDocRef = doc(db, "users", userId);
      const userDoc = await Promise.race([
        getDoc(userDocRef),
        timeoutPromise(5000),
      ]);

      const userData = userDoc.exists() ? userDoc.data() : {};
      const devices = userData.devices || [];

      // Check if this device is already registered
      const existingDeviceIndex = devices.findIndex(
        (d) => d.deviceId === deviceId,
      );
      const isExistingDevice = existingDeviceIndex >= 0;

      const updatedDeviceInfo = {
        ...deviceInfo,
        lastActive: new Date().toISOString(),
        isCurrentDevice: true,
      };

      if (isExistingDevice) {
        // This device is already registered — update last active time
        const updatedDevices = [...devices];
        updatedDevices[existingDeviceIndex] = updatedDeviceInfo;

        await updateDoc(userDocRef, { devices: updatedDevices });
        setRegisteredDevices(updatedDevices);
      } else {
        // New device — check limit
        if (devices.length >= MAX_DEVICES) {
          // Another device is active — return conflict info (don't sign out)
          return {
            success: false,
            limitReached: true,
            devices,
            currentDeviceId: deviceId,
            currentDeviceInfo: updatedDeviceInfo,
          };
        }

        // Under limit — register this device
        const newDevices = [...devices, updatedDeviceInfo];
        await updateDoc(userDocRef, { devices: newDevices });
        setRegisteredDevices(newDevices);
      }

      return { success: true, limitReached: false };
    } catch (error) {
      console.error("Error registering device:", error);
      // On error, allow login (don't block for network issues)
      return { success: true, limitReached: false, error };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        cloudHydratedRef.current = false;
        let claimsPremium = false;
        let claimsAdmin = false;
        try {
          const tokenResult = await getIdTokenResult(firebaseUser, true);
          claimsPremium = tokenResult.claims.isPremium === true;
          claimsAdmin = tokenResult.claims.isAdmin === true;
        } catch {
          // ignore
        }

        try {
          // First, register device and check limit
          const deviceResult = await registerDeviceForUser(firebaseUser.uid);

          if (!deviceResult.success && deviceResult.limitReached) {
            // Device conflict — keep Firebase auth alive, show intercept screen
            setDeviceConflict({
              userId: firebaseUser.uid,
              devices: deviceResult.devices,
              currentDeviceId: deviceResult.currentDeviceId,
              currentDeviceInfo: deviceResult.currentDeviceInfo,
              firebaseUser,
              claimsPremium,
              claimsAdmin,
            });
            // Don't set user (keeps app on conflict screen)
            setUser(null);
            cloudHydratedRef.current = true;
            return;
          }

          const { getDoc } = require("firebase/firestore");
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await Promise.race([
            getDoc(userDocRef),
            timeoutPromise(8000),
          ]);
          const data = userDoc.exists() ? userDoc.data() : {};

          if (userDoc.exists()) {
            const devices = data.devices || [];
            const currentDeviceId = currentDeviceIdRef.current;
            const deviceList = devices.map((d) => ({
              ...d,
              isCurrentDevice: d.deviceId === currentDeviceId,
            }));
            setRegisteredDevices(deviceList);
          }

          const premiumStatus = data.isPremium === true || claimsPremium;
          const isAdmin = data.isAdmin === true || claimsAdmin;
          // Extract premiumType from Firestore
          const fetchedPremiumType = data.premiumType || null;
          setPremiumType(fetchedPremiumType);

          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || data.username || "User",
            isPremium: premiumStatus,
            isAdmin,
          };

          // Load cloud state for learning progress
          const cloudState = hydrateStoredState(data);

          // Reset streak if user hasn't read in over a day
          if (cloudState.lastReadDate) {
            const diffDays = dayDiffFromToday(cloudState.lastReadDate);
            if (diffDays !== null && diffDays > 1) {
              setCurrentStreak(0);
            }
          }

          setUser(userData);
          setAccountPremium(Boolean(premiumStatus));
          setDeviceConflict(null);
          cloudHydratedRef.current = true;

          await AsyncStorage.setItem("user", JSON.stringify(userData));
          await AsyncStorage.setItem(
            getAccountStateKey(firebaseUser.uid),
            JSON.stringify(cloudState),
          );
        } catch (err) {
          console.warn(
            "Firestore fetch failed/timed out, using auth claims:",
            err?.message,
          );
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || "User",
            isPremium: claimsPremium,
            isAdmin: claimsAdmin,
          };

          try {
            const cachedAccountState = await AsyncStorage.getItem(
              getAccountStateKey(firebaseUser.uid),
            );
            if (cachedAccountState) {
              const cachedState = hydrateStoredState(JSON.parse(cachedAccountState));
              if (cachedState.lastReadDate) {
                const diffDays = dayDiffFromToday(cachedState.lastReadDate);
                if (diffDays !== null && diffDays > 1) {
                  setCurrentStreak(0);
                }
              }
            }
          } catch (_) {
            // ignore account cache parse failures
          }

          setUser(userData);
          setAccountPremium(Boolean(claimsPremium));
          cloudHydratedRef.current = true;
          await AsyncStorage.setItem("user", JSON.stringify(userData));
        }
      } else {
        cloudHydratedRef.current = false;
        setDeviceConflict(null);
        setRegisteredDevices([]);
        currentDeviceIdRef.current = null;

        try {
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setAccountPremium(Boolean(parsed.isPremium));
          } else {
            setUser(null);
            setAccountPremium(false);
          }
        } catch {
          setUser(null);
          setAccountPremium(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Refresh learning progress from Firestore on app foreground
  const refreshFromCloud = async () => {
    if (!user?.uid || isLoggingOutRef.current || !cloudHydratedRef.current) return;
    const now = Date.now();
    if (now - lastRefreshRef.current < 30000) return;
    lastRefreshRef.current = now;

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await Promise.race([
        getDoc(userDocRef),
        timeoutPromise(5000),
      ]);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const cloudState = hydrateStoredState(data);

        // Reset streak if user hasn't read in over a day
        if (cloudState.lastReadDate) {
          const diffDays = dayDiffFromToday(cloudState.lastReadDate);
          if (diffDays !== null && diffDays > 1) {
            setCurrentStreak(0);
          }
        }

        await AsyncStorage.setItem(
          getAccountStateKey(user.uid),
          JSON.stringify(cloudState),
        );
      }
    } catch (err) {
      console.warn("Cloud refresh failed:", err?.message);
    }
  };

  // Sync from cloud and check streak when app comes to foreground
  useEffect(() => {
    let prevState = AppState.currentState;

    const handleAppStateChange = (nextAppState) => {
      if (
        prevState.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        refreshFromCloud();
      }
      prevState = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [user]);

  useEffect(() => {
    if (user === null) {
      isLoggingOutRef.current = false;
    }
  }, [user]);

  // Initialize screen capture protection on app start
  useEffect(() => {
    const initScreenCaptureProtection = async () => {
      if (Platform.OS === "android") {
        // Android's FLAG_SECURE silently blocks capture without callbacks.
        // We can't detect when capture is actually happening, so we don't
        // show the overlay on Android - FLAG_SECURE provides the protection.
        await enableScreenCaptureProtection();
      } else if (Platform.OS === "ios") {
        // For iOS, subscribe to capture change events to update state
        // based on actual capture detection.
        const unsubscribe = subscribeToScreenCaptureChange((isCaptured) => {
          setIsScreenCapturePrevented(isCaptured);
        });
        return unsubscribe;
      }
    };

    initScreenCaptureProtection();
  }, []);

  // Load state from local storage ONLY if not authenticated (guest mode)
  // When authenticated, data comes from cloud via hydrateStoredState in onAuthStateChanged
  useEffect(() => {
    const loadState = async () => {
      // Skip if user is authenticated - cloud data will be loaded via onAuthStateChanged
      // We only load local state for guest/unauthenticated users
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          // User is logged in, skip local load - cloud should provide data
          return;
        }

        // Guest user - load from local storage
        const storedReadItems = await AsyncStorage.getItem("readItems");
        const parsedReadItems = storedReadItems
          ? JSON.parse(storedReadItems)
          : [];
        const safeReadItems = Array.isArray(parsedReadItems)
          ? parsedReadItems.filter((title) => VALID_MASTER_TITLES.has(title))
          : [];

        const storedReadItemVersions =
          await AsyncStorage.getItem("readItemVersions");
        const parsedReadItemVersions = storedReadItemVersions
          ? JSON.parse(storedReadItemVersions)
          : {};

        setReadItems(safeReadItems);
        setReadItemVersions(
          migrateLegacyReadItems(
            safeReadItems,
            sanitizeReadItemVersions(parsedReadItemVersions),
          ),
        );

        const storedBookmarks = await AsyncStorage.getItem("bookmarks");
        if (storedBookmarks) {
          setBookmarks(normalizeBookmarks(JSON.parse(storedBookmarks)));
        }

        const storedHighlights = await AsyncStorage.getItem("highlights");
        if (storedHighlights) {
          setHighlights(JSON.parse(storedHighlights));
        }

        const storedStreak = await AsyncStorage.getItem("currentStreak");
        if (storedStreak) {
          setCurrentStreak(parseInt(storedStreak, 10));
        }

        const storedLastRead = await AsyncStorage.getItem("lastReadDate");
        if (storedLastRead) {
          setLastReadDate(storedLastRead);
        }

        const storedScore = await AsyncStorage.getItem("studyScore");
        if (storedScore) {
          setStudyScore(parseInt(storedScore, 10));
        }

        const storedDailyHistory =
          await AsyncStorage.getItem("dailyReadHistory");
        if (storedDailyHistory) {
          setDailyReadHistory(JSON.parse(storedDailyHistory));
        }

        if (storedLastRead) {
          const diffDays = dayDiffFromToday(storedLastRead);
          if (diffDays !== null && diffDays > 1) {
            setCurrentStreak(0);
          }
        }
      } catch (error) {
        console.error("Failed to load state from AsyncStorage:", error);
      }
    };

    loadState();
  }, []);

  useEffect(() => {
    const saveState = async () => {
      // Don't save if logging out or not authenticated
      if (isLoggingOutRef.current || !user || !user.uid) {
        return;
      }

      // Don't save until cloud is hydrated
      if (!cloudHydratedRef.current) {
        return;
      }

      try {
        // Save to local AsyncStorage
        await AsyncStorage.setItem("readItems", JSON.stringify(readItems));
        await AsyncStorage.setItem(
          "readItemVersions",
          JSON.stringify(readItemVersions),
        );
        await AsyncStorage.setItem("bookmarks", JSON.stringify(bookmarks));
        await AsyncStorage.setItem("highlights", JSON.stringify(highlights));
        await AsyncStorage.setItem("currentStreak", currentStreak.toString());
        if (lastReadDate)
          await AsyncStorage.setItem("lastReadDate", lastReadDate);
        else await AsyncStorage.removeItem("lastReadDate");
        await AsyncStorage.setItem("studyScore", studyScore.toString());
        await AsyncStorage.setItem(
          "dailyReadHistory",
          JSON.stringify(dailyReadHistory),
        );

        const accountStateSnapshot = {
          readItems,
          readItemVersions,
          bookmarks,
          currentStreak,
          lastReadDate: lastReadDate || null,
          dailyReadHistory,
          studyScore,
        };

        // Save to user's cached state in AsyncStorage
        await AsyncStorage.setItem(
          getAccountStateKey(user.uid),
          JSON.stringify(accountStateSnapshot),
        );

        await AsyncStorage.setItem("user", JSON.stringify(user));
        await AsyncStorage.setItem("isPremium", JSON.stringify(isPremium));

        // Save to Firebase - both global (for initial load) and device-specific (for device limit)
        if (user.uid && cloudHydratedRef.current) {
          try {
            const deviceId =
              currentDeviceIdRef.current || (await getDeviceId());

            // Build update object - device registration happens in registerDeviceForUser,
            // not here. Only update devices array if we have registered devices.
            const updateData = {
              // Global learning progress (latest state)
              readItems,
              readItemVersions,
              bookmarks,
              currentStreak,
              lastReadDate: lastReadDate || null,
              dailyReadHistory,
              studyScore,
              // Device-specific learning progress (for device switching)
              [`deviceStates.${deviceId}`]: accountStateSnapshot,
              syncedAt: serverTimestamp(),
            };

            // Only update devices array if we have registered devices.
            // Device registration is handled by registerDeviceForUser, not here.
            // Using arrayUnion with an empty fallback caused race conditions
            // where devices weren't properly tracked.
            if (registeredDevices && registeredDevices.length > 0) {
              updateData.devices = registeredDevices.map((d) =>
                d.deviceId === deviceId
                  ? { ...d, lastActive: new Date().toISOString() }
                  : d,
              );
            }

            await updateDoc(doc(db, "users", user.uid), updateData);
          } catch (e) {
            // silently handle if they are offline
            console.warn("Failed to sync to Firebase:", e?.message);
          }
        }
      } catch (error) {
        console.error("Failed to save state to AsyncStorage:", error);
      }
    };

    saveState();
  }, [
    readItems,
    readItemVersions,
    bookmarks,
    highlights,
    currentStreak,
    lastReadDate,
    studyScore,
    dailyReadHistory,
    user,
    isPremium,
    registeredDevices,
  ]);

  useEffect(() => {
    if (user && user.uid) {
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          setDoc(
            doc(db, "users", user.uid),
            {
              pushToken: token,
              pushTokenUpdatedAt: serverTimestamp(),
            },
            { merge: true },
          ).catch((err) => console.log("Error saving push token", err));
        }
      });
    }
  }, [user]);

  async function registerForPushNotificationsAsync() {
    let token;

    if (!SafeNotifications) {
      console.log("Skipping push notification registration in Expo Go.");
      return null;
    }

    if (Device.isDevice) {
      try {
        const { status: existingStatus } =
          await SafeNotifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await SafeNotifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          console.log("Push notification permission denied.");
          return null;
        }
        token = (await SafeNotifications.getExpoPushTokenAsync()).data;
      } catch (err) {
        console.log("Expo notification error:", err);
        return null;
      }
    } else {
      console.log("Must use physical device for Push Notifications");
      return null;
    }

    if (Platform.OS === "android") {
      await SafeNotifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: SafeNotifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: theme.colors.primaryDark,
      });
    }
    return token;
  }

  const effectiveReadCount = getEffectiveReadCount(readItemVersions);
  const readingProgress =
    totalItems === 0 ? 0 : Math.min(effectiveReadCount / totalItems, 1);

  const prevStreakRef = useRef(0);

  const markAsRead = ({ itemTitle, contentKey, contentSignature }) => {
    if (!itemTitle || !contentKey || !contentSignature) {
      return;
    }

    setReadItemVersions((previousVersions) => {
      if (previousVersions[contentKey] === contentSignature) {
        return previousVersions;
      }

      const todayStr = new Date().toDateString();
      if (lastReadDate !== todayStr) {
        if (!lastReadDate) {
          setCurrentStreak(1);
        } else {
          const diffDays = dayDiffFromToday(lastReadDate);

          if (diffDays === 1) {
            setCurrentStreak((previousStreak) => previousStreak + 1);
          } else if (diffDays === null || diffDays > 1) {
            setCurrentStreak(1);
          }
        }
        setLastReadDate(todayStr);
        setStudyScore((previousScore) => previousScore + 10);
      }

      const dateKey = new Date().toISOString().split("T")[0];
      setDailyReadHistory((previousHistory) => ({
        ...previousHistory,
        [dateKey]: (previousHistory[dateKey] || 0) + 1,
      }));

      setReadItems((previousTitles) =>
        previousTitles.includes(itemTitle)
          ? previousTitles
          : [...previousTitles, itemTitle],
      );

      return {
        ...previousVersions,
        [contentKey]: contentSignature,
      };
    });
  };

  // Trigger streak milestone notifications when streak changes
  useEffect(() => {
    if (currentStreak > 0 && currentStreak !== prevStreakRef.current) {
      prevStreakRef.current = currentStreak;
      triggerStreakMilestone(currentStreak);
    }
  }, [currentStreak]);

  const markAsUnread = (contentRefs = []) => {
    const refsToClear = contentRefs.filter((ref) => ref?.contentKey);
    if (refsToClear.length === 0) {
      return;
    }

    setReadItemVersions((previousVersions) => {
      let changed = false;
      const nextVersions = { ...previousVersions };

      refsToClear.forEach(({ contentKey }) => {
        if (nextVersions[contentKey]) {
          delete nextVersions[contentKey];
          changed = true;
        }
      });

      if (!changed) {
        return previousVersions;
      }

      setReadItems(getReadTitles(nextVersions));
      return nextVersions;
    });
  };

  const getBookmarkIdentity = (itemOrTitle) => {
    if (!itemOrTitle) return null;
    if (typeof itemOrTitle === "string") return itemOrTitle;
    return (
      resolveBookmarkContentKey(itemOrTitle) ||
      itemOrTitle.contentKey ||
      itemOrTitle.title ||
      null
    );
  };

  const isBookmarked = (itemOrTitle) => {
    const targetIdentity = getBookmarkIdentity(itemOrTitle);
    if (!targetIdentity) return false;
    return bookmarks.some(
      (bookmark) => getBookmarkIdentity(bookmark) === targetIdentity,
    );
  };

  const toggleBookmark = (item) => {
    const targetIdentity = getBookmarkIdentity(item);
    if (!targetIdentity) return;

    setBookmarks((previousBookmarks) => {
      const alreadyBookmarked = previousBookmarks.some(
        (bookmark) => getBookmarkIdentity(bookmark) === targetIdentity,
      );

      if (alreadyBookmarked) {
        return previousBookmarks.filter(
          (bookmark) => getBookmarkIdentity(bookmark) !== targetIdentity,
        );
      }

      return [
        ...previousBookmarks,
        {
          ...item,
          contentKey:
            resolveBookmarkContentKey(item) || item.contentKey || null,
        },
      ];
    });
  };

  const saveHighlight = (id, htmlContent) => {
    setHighlights((prev) => ({
      ...prev,
      [id]: htmlContent,
    }));
  };

  const persistPremiumAccess = async (metadata = {}) => {
    if (!user?.uid) return;

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          isPremium: true,
          premiumUpdatedAt: serverTimestamp(),
          ...metadata,
        },
        { merge: true },
      );
    } catch (err) {
      console.warn("Failed to sync premium to Firestore:", err.message);
    }
  };

  // RevenueCat: configure and sync customer info on mount
  useEffect(() => {
    if (Constants.appOwnership === "expo") return;
    if (!Purchases) return;

    const rcApiKey = process.env.EXPO_PUBLIC_RC_API_KEY;
    const isTestKey =
      typeof rcApiKey === "string" && rcApiKey.startsWith("test_");
    const isProdRuntime = !__DEV__;

    if (!rcApiKey || (isProdRuntime && isTestKey)) {
      console.warn(
        "RevenueCat initialization skipped: missing or non-production API key.",
      );
      return;
    }

    Purchases.configure({ apiKey: rcApiKey });

    // Listen for subscription status changes from RevenueCat
    Purchases.addCustomerInfoUpdateListener((info) => {
      const hasPremium = hasRevenueCatPremiumEntitlement(info);
      setRevenueCatPremium(hasPremium);
      // Extract subscription expiry from RevenueCat
      const expiresDate = info?.subscriptions?.Premium?.expiresDate;
      setSubscriptionExpiry(expiresDate || null);
      if (hasPremium) {
        persistPremiumAccess({ premiumSource: "revenuecat_listener" });
      }
      console.log("RevenueCat listener — isPremium:", hasPremium);
    });

    // Check if user is already premium on mount
    Purchases.getCustomerInfo()
      .then((info) => {
        const hasPremium = hasRevenueCatPremiumEntitlement(info);
        setRevenueCatPremium(hasPremium);
        // Extract subscription expiry from RevenueCat
        const expiresDate = info?.subscriptions?.Premium?.expiresDate;
        setSubscriptionExpiry(expiresDate || null);
        if (hasPremium) {
          persistPremiumAccess({ premiumSource: "revenuecat_initial_check" });
        }
        console.log("RevenueCat initial check — isPremium:", hasPremium);
      })
      .catch((err) => {
        console.warn("RevenueCat getCustomerInfo failed:", err.message);
      });
  }, []);

  // Sync RevenueCat identity when user logs in
  useEffect(() => {
    if (Constants.appOwnership === "expo") return;
    if (!Purchases) return;
    if (!user?.uid) return;

    Purchases.logIn(user.uid)
      .then(({ customerInfo }) => {
        const hasPremium = hasRevenueCatPremiumEntitlement(customerInfo);
        setRevenueCatPremium(hasPremium);
        // Extract subscription expiry from RevenueCat
        const expiresDate = customerInfo?.subscriptions?.Premium?.expiresDate;
        setSubscriptionExpiry(expiresDate || null);
        if (hasPremium) {
          persistPremiumAccess({ premiumSource: "revenuecat_login" });
        }
        console.log("RevenueCat logIn — isPremium:", hasPremium);
      })
      .catch((err) => {
        console.warn("RevenueCat logIn failed:", err.message);
      });
  }, [user]);

  const completeDailyGoal = (score) => {
    setStudyScore((prev) => prev + score);
  };

  const clearStorage = async () => {
    await AsyncStorage.multiRemove([
      "readItems",
      "readItemVersions",
      "bookmarks",
      "highlights",
      "currentStreak",
      "lastReadDate",
      "studyScore",
      "dailyReadHistory",
    ]);
    setReadItems([]);
    setReadItemVersions({});
    setBookmarks([]);
    setHighlights({});
    setCurrentStreak(0);
    setLastReadDate(null);
    setStudyScore(0);
    setDailyReadHistory({});
    setUser(null);
    setAccountPremium(false);
    setRevenueCatPremium(false);
  };

  const login = (userData) => {
    setUser(userData);
    if (userData.isPremium !== undefined) {
      setAccountPremium(Boolean(userData.isPremium));
    }

    // Identify user with RevenueCat on login
    if (Constants.appOwnership !== "expo" && Purchases && userData.uid) {
      Purchases.logIn(userData.uid)
        .then(({ customerInfo }) => {
          const hasPremium = hasRevenueCatPremiumEntitlement(customerInfo);
          setRevenueCatPremium(hasPremium);
          // Extract subscription expiry from RevenueCat
          const expiresDate = customerInfo?.subscriptions?.Premium?.expiresDate;
          setSubscriptionExpiry(expiresDate || null);
          if (hasPremium) {
            persistPremiumAccess({ premiumSource: "revenuecat_login" });
          }
        })
        .catch((err) => {
          console.warn("RevenueCat logIn during login failed:", err.message);
        });
    }
  };

  const logout = async () => {
    isLoggingOutRef.current = true;

    // Remove current device from Firestore so re-login on this device works
    const uid = user?.uid || auth.currentUser?.uid;
    const deviceId = currentDeviceIdRef.current;
    if (uid && deviceId) {
      try {
        const userDocRef = doc(db, "users", uid);
        const userDoc = await Promise.race([
          getDoc(userDocRef),
          timeoutPromise(5000),
        ]);
        if (userDoc.exists()) {
          const currentDevices = userDoc.data().devices || [];
          const filtered = currentDevices.filter(
            (d) => d.deviceId !== deviceId,
          );
          await updateDoc(userDocRef, { devices: filtered });
        }
      } catch (e) {
        console.warn("Failed to remove device on logout:", e?.message);
      }
    }

    try {
      await signOut(auth);
    } catch (_) {}
    if (Constants.appOwnership !== "expo" && GoogleSignin) {
      try {
        await GoogleSignin.signOut();
      } catch (_) {}
    }
    // Log out of RevenueCat
    if (Constants.appOwnership !== "expo" && Purchases) {
      try {
        await Purchases.logOut();
      } catch (_) {}
    }
    await AsyncStorage.multiRemove([
      "user",
      "isPremium",
      "readItems",
      "readItemVersions",
      "bookmarks",
      "highlights",
      "currentStreak",
      "lastReadDate",
      "studyScore",
      "dailyReadHistory",
    ]);

    setUser(null);
    setAccountPremium(false);
    setRevenueCatPremium(false);
    setDeviceConflict(null);
    setRegisteredDevices([]);
    currentDeviceIdRef.current = null;
    setReadItems([]);
    setReadItemVersions({});
    setBookmarks([]);
    setHighlights({});
    setCurrentStreak(0);
    setLastReadDate(null);
    setStudyScore(0);
    setDailyReadHistory({});
  };

  const upgradeToPremium = async (metadata = {}) => {
    setAccountPremium(true);
    await persistPremiumAccess(metadata);
  };

  // Resolve device conflict: clear other device, register this one, proceed
  const resolveDeviceConflict = async () => {
    if (!deviceConflict) return;

    const {
      userId,
      currentDeviceInfo,
      firebaseUser,
      claimsPremium,
      claimsAdmin,
    } = deviceConflict;

    const userDocRef = doc(db, "users", userId);

    // Replace all devices with just the current device
    await updateDoc(userDocRef, {
      devices: [currentDeviceInfo],
    });

    currentDeviceIdRef.current = currentDeviceInfo.deviceId;
    setRegisteredDevices([currentDeviceInfo]);
    setDeviceConflict(null);

    // Now complete the login flow
    try {
      const userDoc = await Promise.race([
        getDoc(userDocRef),
        timeoutPromise(8000),
      ]);
      const data = userDoc.exists() ? userDoc.data() : {};
      const premiumStatus = data.isPremium === true || claimsPremium;
      const isAdmin = data.isAdmin === true || claimsAdmin;
      const fetchedPremiumType = data.premiumType || null;
      setPremiumType(fetchedPremiumType);

      const userData = {
        uid: userId,
        email: firebaseUser.email,
        username: firebaseUser.displayName || data.username || "User",
        isPremium: premiumStatus,
        isAdmin,
      };

      const cloudState = hydrateStoredState(data);
      setUser(userData);
      setAccountPremium(Boolean(premiumStatus));
      cloudHydratedRef.current = true;

      await AsyncStorage.setItem("user", JSON.stringify(userData));
      await AsyncStorage.setItem(
        getAccountStateKey(userId),
        JSON.stringify(cloudState),
      );
    } catch (err) {
      console.warn("Firestore unavailable after conflict resolution:", err?.message);
      const userData = {
        uid: userId,
        email: firebaseUser.email,
        username: firebaseUser.displayName || "User",
        isPremium: claimsPremium,
        isAdmin: claimsAdmin,
      };
      setUser(userData);
      setAccountPremium(Boolean(claimsPremium));
      cloudHydratedRef.current = true;
      await AsyncStorage.setItem("user", JSON.stringify(userData));
    }
  };

  // Cancel device conflict: sign out completely
  const cancelDeviceConflict = async () => {
    setDeviceConflict(null);
    try {
      await signOut(auth);
    } catch (_) {}
    setUser(null);
    setAccountPremium(false);
  };

  return (
    <AppContext.Provider
      value={{
        readItems,
        readItemVersions,
        bookmarks,
        totalItems,
        readingProgress,
        highlights,
        currentStreak,
        lastReadDate,
        studyScore,
        dailyReadHistory,
        markAsRead,
        markAsUnread,
        isBookmarked,
        toggleBookmark,
        saveHighlight,
        clearStorage,
        user,
        isPremium,
        premiumType,
        subscriptionExpiry,
        login,
        logout,
        upgradeToPremium,
        deviceConflict,
        resolveDeviceConflict,
        cancelDeviceConflict,
        registeredDevices,
        MAX_DEVICES,
        isScreenCapturePrevented,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
