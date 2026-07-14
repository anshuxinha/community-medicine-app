import React, { createContext, useState, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
  subscribeToScreenCaptureChange,
  setScreenCaptureBypass,
} from "../utils/screenCaptureProtection";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { db, auth } from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { getDeviceId } from "../utils/deviceUtils";
import {
  onAuthStateChanged,
  getIdTokenResult,
  signOut,
  updateProfile,
} from "firebase/auth";
import * as Notifications from "expo-notifications";
import { theme } from "../styles/theme";
import { triggerStreakMilestone } from "../services/notificationService";
import { maybePromptReview } from "../utils/reviewPrompt";
import {
  VALID_MASTER_TITLES,
  VALID_CONTENT_KEYS,
  CONTENT_ENTRY_BY_KEY,
  TOTAL_LEAF_CONTENT_ITEMS,
  getEffectiveReadCount,
  getContentKey,
  getReadTitles,
  hydrateContentRegistry,
  migrateLegacyReadItems,
} from "../utils/contentRegistry";
import { syncAllAnnotations } from "../services/annotationService";
import { syncAllHighlights } from "../services/highlightService";
import { generateReferralCode } from "../utils/referralUtils";
import { claimReferralRewards } from "../services/couponService";

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



const MS_PER_DAY = 24 * 60 * 60 * 1000;
const getAccountStateKey = (uid) => `accountState:${uid}`;
const hasRevenueCatPremiumEntitlement = (customerInfo) =>
  customerInfo?.entitlements?.active?.Premium != null;

const getPremiumTypeFromEntitlement = (entitlement) => {
  if (!entitlement) return null;
  const productId = entitlement.productIdentifier?.toLowerCase() || "";
  if (productId.includes("lifetime")) return "lifetime";
  if (productId.includes("yearly") || productId.includes("annual")) return "yearly";
  if (productId.includes("monthly")) return "monthly";
  return "yearly"; // fallback
};

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

// Never let a sparse cloud doc wipe richer local/device progress (cold-start race).
const mergeDailyReadHistory = (...histories) => {
  const merged = {};
  histories.forEach((history) => {
    if (!history || typeof history !== "object") return;
    Object.entries(history).forEach(([day, count]) => {
      const n = typeof count === "number" ? count : 0;
      merged[day] = Math.max(merged[day] || 0, n);
    });
  });
  return merged;
};

const mergeBookmarksLists = (...lists) => {
  const map = new Map();
  lists.flat().forEach((item) => {
    if (!item || typeof item.title !== "string") return;
    const key =
      (typeof item.contentKey === "string" && item.contentKey) || item.title;
    if (!map.has(key)) map.set(key, item);
  });
  return normalizeBookmarks([...map.values()]);
};

// Prefer a version that matches current content signature so merge cannot
// demote an item from "read" by keeping a stale signature from an old device.
const mergeReadItemVersions = (states) => {
  const keys = new Set();
  states.forEach((state) => {
    Object.keys(state.readItemVersions || {}).forEach((key) => keys.add(key));
  });

  const merged = {};
  keys.forEach((key) => {
    // states are ordered highest-priority first
    const versions = states
      .map((state) => state.readItemVersions?.[key])
      .filter((version) => typeof version === "string");
    if (versions.length === 0) return;

    const currentSignature = CONTENT_ENTRY_BY_KEY.get(key)?.signature;
    if (currentSignature) {
      const matching = versions.find((version) => version === currentSignature);
      if (matching) {
        merged[key] = matching;
        return;
      }
    }

    merged[key] = versions[0];
  });
  return merged;
};

const mergeLearningStates = (...rawStates) => {
  const states = rawStates
    .filter((state) => state && typeof state === "object")
    .map((state) => sanitizeCloudState(state));
  if (states.length === 0) return sanitizeCloudState({});
  if (states.length === 1) return states[0];

  const readItemVersions = mergeReadItemVersions(states);

  const bookmarks = mergeBookmarksLists(...states.map((state) => state.bookmarks));
  const dailyReadHistory = mergeDailyReadHistory(
    ...states.map((state) => state.dailyReadHistory),
  );
  const studyScore = Math.max(0, ...states.map((state) => state.studyScore || 0));

  let lastReadDate = null;
  let bestLastReadTime = -Infinity;
  states.forEach((state) => {
    if (!state.lastReadDate) return;
    const time = new Date(state.lastReadDate).getTime();
    if (!Number.isNaN(time) && time >= bestLastReadTime) {
      bestLastReadTime = time;
      lastReadDate = state.lastReadDate;
    }
  });

  let currentStreak = 0;
  if (lastReadDate) {
    currentStreak = Math.max(
      0,
      ...states
        .filter((state) => state.lastReadDate === lastReadDate)
        .map((state) => state.currentStreak || 0),
    );
  } else {
    currentStreak = Math.max(
      0,
      ...states.map((state) => state.currentStreak || 0),
    );
  }

  if (lastReadDate) {
    const diffDays = dayDiffFromToday(lastReadDate);
    if (diffDays !== null && diffDays > 1) {
      currentStreak = 0;
    }
  }

  // Effective progress is signature-based; keep titles aligned to that.
  const readItems = getReadTitles(readItemVersions);

  return {
    readItems,
    readItemVersions,
    bookmarks,
    currentStreak,
    lastReadDate,
    studyScore,
    dailyReadHistory,
  };
};

const collectLearningStateCandidates = (
  userDocData = {},
  deviceId,
  cachedRaw,
  liveRaw,
) => {
  // Highest priority first: live memory → local cache → this device →
  // top-level cloud → other devices (recovery only).
  const candidates = [];
  if (liveRaw && typeof liveRaw === "object") {
    candidates.push(liveRaw);
  }
  if (cachedRaw && typeof cachedRaw === "object") {
    candidates.push(cachedRaw);
  }

  const deviceStates = userDocData.deviceStates;
  if (deviceStates && typeof deviceStates === "object") {
    if (deviceId && deviceStates[deviceId]) {
      candidates.push(deviceStates[deviceId]);
    }
  }

  candidates.push({
    readItems: userDocData.readItems,
    readItemVersions: userDocData.readItemVersions,
    bookmarks: userDocData.bookmarks,
    currentStreak: userDocData.currentStreak,
    lastReadDate: userDocData.lastReadDate,
    studyScore: userDocData.studyScore,
    dailyReadHistory: userDocData.dailyReadHistory,
  });

  if (deviceStates && typeof deviceStates === "object") {
    Object.entries(deviceStates).forEach(([id, deviceState]) => {
      if (id === deviceId) return;
      if (deviceState && typeof deviceState === "object") {
        candidates.push(deviceState);
      }
    });
  }

  return mergeLearningStates(...candidates);
};

const resolveDisplayUsername = (firestoreUsername, authDisplayName, fallback) => {
  if (typeof firestoreUsername === "string" && firestoreUsername.trim()) {
    return firestoreUsername.trim();
  }
  if (typeof authDisplayName === "string" && authDisplayName.trim()) {
    return authDisplayName.trim();
  }
  if (typeof fallback === "string" && fallback.trim()) {
    return fallback.trim();
  }
  return "User";
};

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
  const [contentRegistryVersion, setContentRegistryVersion] = useState(0);
  
  const [isScreenCapturePrevented, setIsScreenCapturePrevented] =
    useState(false);
  const isLoggingOutRef = useRef(false);
  const initialLoadRef = useRef(true);
  const cloudHydratedRef = useRef(false);
  const currentDeviceIdRef = useRef(null);
  const lastRefreshRef = useRef(0);
  const prevStreakRef = useRef(0);
  const userRef = useRef(user);
  const learningStateRef = useRef({
    readItems: [],
    readItemVersions: {},
    bookmarks: [],
    currentStreak: 0,
    lastReadDate: null,
    studyScore: 0,
    dailyReadHistory: {},
  });

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    learningStateRef.current = {
      readItems,
      readItemVersions,
      bookmarks,
      currentStreak,
      lastReadDate,
      studyScore,
      dailyReadHistory,
    };
  }, [
    readItems,
    readItemVersions,
    bookmarks,
    currentStreak,
    lastReadDate,
    studyScore,
    dailyReadHistory,
  ]);

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

  const refreshLibraryContent = async () => {
    try {
      const snapshot = await Promise.race([
        getDocs(collection(db, "libraryContentOverrides")),
        timeoutPromise(5000),
      ]);

      const approvedOverrides = snapshot.docs
        .map((itemDoc) => ({
          id: itemDoc.id,
          ...itemDoc.data(),
        }))
        .filter(
          (override) =>
            override?.status === "active" &&
            typeof override?.proposedContent === "string",
        );

      hydrateContentRegistry(approvedOverrides);
      setContentRegistryVersion((current) => current + 1);
    } catch (err) {
      console.warn("Library override refresh failed:", err?.message);
    }
  };

  const persistLearningLocally = async (uid, snapshot) => {
    if (!uid || !snapshot) return;
    try {
      const pairs = [
        ["readItems", JSON.stringify(snapshot.readItems || [])],
        [
          "readItemVersions",
          JSON.stringify(snapshot.readItemVersions || {}),
        ],
        ["bookmarks", JSON.stringify(snapshot.bookmarks || [])],
        [
          "currentStreak",
          String(
            typeof snapshot.currentStreak === "number"
              ? snapshot.currentStreak
              : 0,
          ),
        ],
        [
          "studyScore",
          String(
            typeof snapshot.studyScore === "number" ? snapshot.studyScore : 0,
          ),
        ],
        [
          "dailyReadHistory",
          JSON.stringify(snapshot.dailyReadHistory || {}),
        ],
        [getAccountStateKey(uid), JSON.stringify(snapshot)],
      ];
      if (snapshot.lastReadDate) {
        pairs.push(["lastReadDate", snapshot.lastReadDate]);
      } else {
        await AsyncStorage.removeItem("lastReadDate");
      }
      await AsyncStorage.multiSet(pairs);
    } catch (err) {
      console.warn("Failed to persist learning state locally:", err?.message);
    }
  };

  const loadLocalLearningSnapshot = async (uid) => {
    try {
      const keys = [
        getAccountStateKey(uid),
        "readItems",
        "readItemVersions",
        "bookmarks",
        "currentStreak",
        "lastReadDate",
        "studyScore",
        "dailyReadHistory",
      ];
      const entries = await AsyncStorage.multiGet(keys);
      const map = Object.fromEntries(entries);

      const candidates = [];
      if (map[getAccountStateKey(uid)]) {
        try {
          candidates.push(JSON.parse(map[getAccountStateKey(uid)]));
        } catch (_) {}
      }

      // Individual keys may be newer if a previous save was interrupted
      // before accountState was written (accountState used to be last).
      let legacy = null;
      try {
        legacy = {
          readItems: map.readItems ? JSON.parse(map.readItems) : [],
          readItemVersions: map.readItemVersions
            ? JSON.parse(map.readItemVersions)
            : {},
          bookmarks: map.bookmarks ? JSON.parse(map.bookmarks) : [],
          currentStreak: map.currentStreak
            ? parseInt(map.currentStreak, 10) || 0
            : 0,
          lastReadDate: map.lastReadDate || null,
          studyScore: map.studyScore ? parseInt(map.studyScore, 10) || 0 : 0,
          dailyReadHistory: map.dailyReadHistory
            ? JSON.parse(map.dailyReadHistory)
            : {},
        };
      } catch (_) {
        legacy = null;
      }
      if (legacy) candidates.push(legacy);

      if (candidates.length === 0) return null;
      return mergeLearningStates(...candidates);
    } catch (err) {
      console.warn("Failed to load local learning snapshot:", err?.message);
      return null;
    }
  };

  const hydrateStoredState = (rawState = {}) => {
    const parsedState = sanitizeCloudState(rawState);
    const migratedReadItemVersions = migrateLegacyReadItems(
      parsedState.readItems,
      parsedState.readItemVersions,
    );

    const nextState = {
      ...parsedState,
      readItemVersions: migratedReadItemVersions,
    };

    // Keep ref in sync immediately so cold-start merge sees painted cache,
    // not the empty initial ref, and so markAsRead can persist correctly.
    learningStateRef.current = {
      readItems: nextState.readItems,
      readItemVersions: nextState.readItemVersions,
      bookmarks: nextState.bookmarks,
      currentStreak: nextState.currentStreak,
      lastReadDate: nextState.lastReadDate,
      studyScore: nextState.studyScore,
      dailyReadHistory: nextState.dailyReadHistory,
    };

    prevStreakRef.current = nextState.currentStreak;
    setReadItems(nextState.readItems);
    setReadItemVersions(migratedReadItemVersions);
    setBookmarks(nextState.bookmarks);
    setCurrentStreak(nextState.currentStreak);
    setLastReadDate(nextState.lastReadDate);
    setStudyScore(nextState.studyScore);
    setDailyReadHistory(nextState.dailyReadHistory);

    return nextState;
  };

  const syncReceivedUpvotes = async (uid) => {
    try {
      const doubtsSnapshot = await getDocs(
        query(collection(db, "videoDoubts"), where("userId", "==", uid))
      );
      let upvotesCount = 0;
      doubtsSnapshot.forEach((doc) => {
        const data = doc.data();
        upvotesCount += (data.upvotedBy || []).length;
      });

      const allDoubtsSnapshot = await getDocs(collection(db, "videoDoubts"));
      allDoubtsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId !== uid) {
          const myReplies = (data.replies || []).filter(r => r.userId === uid);
          myReplies.forEach(r => {
            upvotesCount += (r.upvotedBy || []).length;
          });
        }
      });

      const storedUpvotesCountStr = await AsyncStorage.getItem("upvotesReceivedCount");
      const storedUpvotesCount = storedUpvotesCountStr ? parseInt(storedUpvotesCountStr, 10) : 0;

      if (upvotesCount !== storedUpvotesCount) {
        const diff = upvotesCount - storedUpvotesCount;
        setStudyScore((prev) => prev + diff * 5);
        await AsyncStorage.setItem("upvotesReceivedCount", upvotesCount.toString());
      }
    } catch (e) {
      console.warn("Failed to sync received upvotes:", e?.message);
    }
  };

  useEffect(() => {
    setIsPremium(accountPremium || revenueCatPremium);
  }, [accountPremium, revenueCatPremium]);

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          cloudHydratedRef.current = false;
          const isInitialLoad = initialLoadRef.current;
          initialLoadRef.current = false;

          // Cold start only: paint from local cache so the spinner is not held
          // by network. Skip on fresh login so device-conflict handling in
          // LoginScreen still sees user === undefined until checks finish.
          let cachedAccountRaw = null;
          let cachedUsername = null;
          if (isInitialLoad) {
            try {
              const cachedUserStr = await AsyncStorage.getItem("user");
              if (cachedUserStr) {
                const cachedUser = JSON.parse(cachedUserStr);
                if (cachedUser?.uid === firebaseUser.uid) {
                  cachedUsername = cachedUser.username || null;
                  // Merge accountState + individual keys so a partial prior
                  // save cannot paint one-read-behind progress.
                  cachedAccountRaw = await loadLocalLearningSnapshot(
                    firebaseUser.uid,
                  );
                  if (cachedAccountRaw) {
                    hydrateStoredState(cachedAccountRaw);
                  }
                  setUser(cachedUser);
                  setAccountPremium(Boolean(cachedUser.isPremium));
                  if (cachedUser.premiumType) {
                    setPremiumType(cachedUser.premiumType);
                  }
                }
              }
            } catch (_) {
              // ignore cache paint failures
            }
          }

          // Non-critical for first frame — run without blocking setUser
          void refreshLibraryContent();

          let claimsPremium = false;
          let claimsAdmin = false;

          try {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const [deviceId, tokenResult, userDoc] = await Promise.all([
              getDeviceId(),
              getIdTokenResult(firebaseUser, true).catch(() => null),
              Promise.race([getDoc(userDocRef), timeoutPromise(8000)]),
            ]);

            currentDeviceIdRef.current = deviceId;
            if (tokenResult) {
              claimsPremium = tokenResult.claims.isPremium === true;
              claimsAdmin = tokenResult.claims.isAdmin === true;
            }

            const data = userDoc.exists() ? userDoc.data() : {};

            // Safety net: ONLY on cold restart with a stale Firebase auth
            // session. Fresh logins are handled by the LoginScreen modal.
            if (isInitialLoad && data.currentDeviceId && data.currentDeviceId !== deviceId) {
              try { await signOut(auth); } catch(e) {}
              setUser(null);
              setAccountPremium(false);
              cloudHydratedRef.current = true;
              return;
            }

            // Fresh login with device conflict: don't set user here.
            // LoginScreen's conflict modal will handle it and call login().
            if (!isInitialLoad && data.currentDeviceId && data.currentDeviceId !== deviceId) {
              return;
            }

            let isPremiumExpired = false;
            if (data.premiumExpiryDate) {
              const expiryDate = new Date(data.premiumExpiryDate);
              if (!isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
                isPremiumExpired = true;
              }
            }
            const premiumStatus = (data.isPremium === true && !isPremiumExpired) || claimsPremium;
            const isAdmin = data.isAdmin === true || claimsAdmin;
            const fetchedPremiumType = data.premiumType || null;
            setPremiumType(fetchedPremiumType);

            // Prefer Firestore / cached profile name over Auth displayName
            // (Google/Apple name would otherwise overwrite profile edits).
            const username = resolveDisplayUsername(
              data.username || cachedUsername,
              firebaseUser.displayName,
              "User",
            );

            // Automatically generate a referral code if missing
            let referralCode = data.referralCode;
            if (!referralCode) {
              referralCode = generateReferralCode(username);
              const batch = [
                updateDoc(doc(db, "users", firebaseUser.uid), { referralCode }),
                setDoc(doc(db, "referralCodes", referralCode), {
                  ownerUid: firebaseUser.uid,
                  ownerName: username,
                })
              ];
              Promise.all(batch).catch((err) => {
                console.warn("Failed to generate and save referralCode:", err.message);
              });
            } else {
              // Self-healing: ensure referralCodes mapping registry exists
              setDoc(doc(db, "referralCodes", referralCode), {
                ownerUid: firebaseUser.uid,
                ownerName: username,
              }, { merge: true }).catch(() => {});
            }

            let finalPremiumStatus = premiumStatus;
            let finalPremiumExpiryDate = data.premiumExpiryDate || null;
            let finalTotalReferrals = data.totalReferrals || 0;

            if (finalPremiumExpiryDate) {
              setSubscriptionExpiry(finalPremiumExpiryDate);
            }

            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              username,
              isPremium: finalPremiumStatus,
              isAdmin,
              pushToken: data.pushToken || null,
              referralCode,
              premiumType: fetchedPremiumType,
            };

            // Merge top-level cloud + deviceStates + local cache so a sparse
            // cloud doc cannot wipe richer progress after cache paint.
            if (!cachedAccountRaw) {
              cachedAccountRaw = await loadLocalLearningSnapshot(
                firebaseUser.uid,
              );
            }
            const mergedLearningState = collectLearningStateCandidates(
              data,
              deviceId,
              cachedAccountRaw,
              learningStateRef.current,
            );
            const cloudState = hydrateStoredState(mergedLearningState);

            setUser(userData);
            setAccountPremium(Boolean(finalPremiumStatus));
            cloudHydratedRef.current = true;

            void AsyncStorage.setItem("user", JSON.stringify(userData));
            void persistLearningLocally(firebaseUser.uid, cloudState);

            // Background: referrals may grant premium after first paint
            void claimReferralRewards(
              firebaseUser.uid,
              finalPremiumExpiryDate,
              finalTotalReferrals,
            )
              .then((claimed) => {
                if (!claimed) return;
                setAccountPremium(true);
                setSubscriptionExpiry(claimed.newExpiryDate);
                setUser((current) =>
                  current && current.uid === firebaseUser.uid
                    ? { ...current, isPremium: true }
                    : current,
                );
              })
              .catch((err) => {
                console.warn(
                  "[Referrals] Failed to check/claim rewards on login:",
                  err.message,
                );
              });

            syncAllAnnotations(firebaseUser.uid);
            syncAllHighlights(firebaseUser.uid);
            void syncReceivedUpvotes(firebaseUser.uid);
          } catch (err) {
            console.warn("Firestore fetch failed/timed out, using auth claims:", err?.message);
            let cachedUsername = null;
            try {
              const cachedUserStr = await AsyncStorage.getItem("user");
              if (cachedUserStr) {
                const cachedUser = JSON.parse(cachedUserStr);
                if (cachedUser?.uid === firebaseUser.uid) {
                  cachedUsername = cachedUser.username;
                }
              }
              const cachedAccountState = await AsyncStorage.getItem(
                getAccountStateKey(firebaseUser.uid),
              );
              if (cachedAccountState) {
                const cachedState = hydrateStoredState(
                  JSON.parse(cachedAccountState),
                );
                if (cachedState.lastReadDate) {
                  const diffDays = dayDiffFromToday(cachedState.lastReadDate);
                  if (diffDays !== null && diffDays > 1) {
                    setCurrentStreak(0);
                  }
                }
              }
            } catch (_) {}

            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              username: resolveDisplayUsername(
                cachedUsername,
                firebaseUser.displayName,
                "User",
              ),
              isPremium: claimsPremium,
              isAdmin: claimsAdmin,
              pushToken: null,
            };

            setUser(userData);
            setAccountPremium(Boolean(claimsPremium));
            cloudHydratedRef.current = true;
            void AsyncStorage.setItem("user", JSON.stringify(userData));
          }
        } else {
          cloudHydratedRef.current = false;
          initialLoadRef.current = false;
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
        await refreshLibraryContent();

        const cachedAccountRaw = await loadLocalLearningSnapshot(user.uid);

        const mergedLearningState = collectLearningStateCandidates(
          data,
          currentDeviceIdRef.current,
          cachedAccountRaw,
          learningStateRef.current,
        );
        const cloudState = hydrateStoredState(mergedLearningState);

        await persistLearningLocally(user.uid, cloudState);

        syncAllAnnotations(user.uid);
        syncAllHighlights(user.uid);
        await syncReceivedUpvotes(user.uid);
      }
    } catch (err) {
      console.warn("Cloud refresh failed:", err?.message);
    }
  };

  // Flush local learning state when backgrounding; refresh from cloud on resume
  useEffect(() => {
    let prevState = AppState.currentState;

    const handleAppStateChange = (nextAppState) => {
      if (
        prevState === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        const uid = userRef.current?.uid;
        if (uid && cloudHydratedRef.current && !isLoggingOutRef.current) {
          void persistLearningLocally(uid, learningStateRef.current);
        }
      }
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

    const userEmail = user?.email?.toLowerCase();
    const isAdmin =
      user?.isAdmin === true ||
      userEmail === "anshuxinha@gmail.com" ||
      userEmail === "kaushikeec@gmail.com";

    if (isAdmin) {
      setScreenCaptureBypass(true);
      disableScreenCaptureProtection();
    } else {
      setScreenCaptureBypass(false);
      enableScreenCaptureProtection();
    }
  }, [user]);

  // Initialize screen capture protection on app start
  useEffect(() => {
    const initScreenCaptureProtection = async () => {
      await enableScreenCaptureProtection();
      if (Platform.OS === "ios") {
        const unsubscribe = subscribeToScreenCaptureChange((isCaptured) => {
          setIsScreenCapturePrevented(isCaptured);
        });
        return unsubscribe;
      }
    };

    initScreenCaptureProtection();
  }, []);

  // Load state from local storage ONLY if not authenticated (guest mode)
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          return;
        }

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
          const parsedStreak = parseInt(storedStreak, 10);
          if (!Number.isNaN(parsedStreak)) {
            prevStreakRef.current = parsedStreak;
            setCurrentStreak(parsedStreak);
          }
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
        const accountStateSnapshot = {
          readItems,
          readItemVersions,
          bookmarks,
          currentStreak,
          lastReadDate: lastReadDate || null,
          dailyReadHistory,
          studyScore,
        };

        // Local first (batch) so kill-after-read keeps progress for cold start
        await persistLearningLocally(user.uid, accountStateSnapshot);
        await AsyncStorage.setItem("highlights", JSON.stringify(highlights));
        await AsyncStorage.setItem("user", JSON.stringify(user));
        await AsyncStorage.setItem("isPremium", JSON.stringify(isPremium));

        // Firestore second — network may lag; local cache is source for first paint
        try {
          const deviceId =
            currentDeviceIdRef.current || (await getDeviceId());

          const updateData = {
            readItems,
            readItemVersions,
            bookmarks,
            currentStreak,
            lastReadDate: lastReadDate || null,
            dailyReadHistory,
            studyScore,
            [`deviceStates.${deviceId}`]: accountStateSnapshot,
            syncedAt: serverTimestamp(),
          };

          await updateDoc(doc(db, "users", user.uid), updateData);
        } catch (e) {
          console.warn("Failed to sync to Firebase:", e?.message);
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
  ]);

  useEffect(() => {
    if (user && user.uid) {
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          setUser((currentUser) => {
            if (!currentUser || currentUser.uid !== user.uid) return currentUser;
            if (currentUser.pushToken === token) return currentUser;
            return { ...currentUser, pushToken: token };
          });
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

    if (!Notifications) {
      console.log("Skipping push notification registration in Expo Go.");
      return null;
    }

    if (Device.isDevice) {
      try {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          console.log("Push notification permission denied.");
          return null;
        }
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: "0b2a61f3-1c01-4684-8f41-ca63b1c308a8"
        })).data;
      } catch (err) {
        console.log("Expo notification error:", err);
        return null;
      }
    } else {
      console.log("Must use physical device for Push Notifications");
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: theme.colors.primaryDark,
      });
    }
    return token;
  }

  const effectiveReadCount = getEffectiveReadCount(readItemVersions);
  const readingProgress =
    totalItems === 0 ? 0 : Math.min(effectiveReadCount / totalItems, 1);

  const markAsRead = ({ itemTitle, contentKey, contentSignature }) => {
    if (!itemTitle || !contentKey || !contentSignature) {
      return;
    }

    const prev = learningStateRef.current;
    if (prev.readItemVersions?.[contentKey] === contentSignature) {
      return;
    }

    const todayStr = new Date().toDateString();
    let nextStreak = prev.currentStreak || 0;
    let nextLastRead = prev.lastReadDate || null;
    let nextScore = prev.studyScore || 0;
    let nextHistory = { ...(prev.dailyReadHistory || {}) };

    if (prev.lastReadDate !== todayStr) {
      if (!prev.lastReadDate) {
        nextStreak = 1;
      } else {
        const diffDays = dayDiffFromToday(prev.lastReadDate);
        if (diffDays === 1) {
          nextStreak = (prev.currentStreak || 0) + 1;
        } else if (diffDays === null || diffDays > 1) {
          nextStreak = 1;
        }
      }
      nextLastRead = todayStr;
      nextScore = (prev.studyScore || 0) + 10;
    }

    const dateKey = new Date().toISOString().split("T")[0];
    nextHistory = {
      ...nextHistory,
      [dateKey]: (nextHistory[dateKey] || 0) + 1,
    };

    const nextVersions = {
      ...(prev.readItemVersions || {}),
      [contentKey]: contentSignature,
    };
    const nextReadItems = (prev.readItems || []).includes(itemTitle)
      ? prev.readItems
      : [...(prev.readItems || []), itemTitle];

    const snapshot = {
      readItems: nextReadItems,
      readItemVersions: nextVersions,
      bookmarks: prev.bookmarks || [],
      currentStreak: nextStreak,
      lastReadDate: nextLastRead,
      dailyReadHistory: nextHistory,
      studyScore: nextScore,
    };

    learningStateRef.current = snapshot;
    setReadItemVersions(nextVersions);
    setReadItems(nextReadItems);
    setCurrentStreak(nextStreak);
    setLastReadDate(nextLastRead);
    setStudyScore(nextScore);
    setDailyReadHistory(nextHistory);

    const uid = userRef.current?.uid;
    if (uid) {
      void persistLearningLocally(uid, snapshot);
    }
  };

  // Trigger streak milestone notifications when streak changes
  useEffect(() => {
    if (currentStreak === prevStreakRef.current) {
      return;
    }

    const previousStreak = prevStreakRef.current;
    prevStreakRef.current = currentStreak;

    if (currentStreak > 0 && currentStreak > previousStreak) {
      triggerStreakMilestone(currentStreak);
    }
  }, [currentStreak]);

  // Evaluate in-app review pre-prompt when reading progress changes
  useEffect(() => {
    if (readingProgress > 0) {
      maybePromptReview(readingProgress);
    }
  }, [readingProgress]);

  const markAsUnread = (contentRefs = []) => {
    const refsToClear = contentRefs.filter((ref) => ref?.contentKey);
    if (refsToClear.length === 0) {
      return;
    }

    const prev = learningStateRef.current;
    const nextVersions = { ...(prev.readItemVersions || {}) };
    let changed = false;
    refsToClear.forEach(({ contentKey }) => {
      if (nextVersions[contentKey]) {
        delete nextVersions[contentKey];
        changed = true;
      }
    });
    if (!changed) return;

    const nextReadItems = getReadTitles(nextVersions);
    const snapshot = {
      ...prev,
      readItems: nextReadItems,
      readItemVersions: nextVersions,
    };
    learningStateRef.current = snapshot;
    setReadItemVersions(nextVersions);
    setReadItems(nextReadItems);

    const uid = userRef.current?.uid;
    if (uid) {
      void persistLearningLocally(uid, snapshot);
    }
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

    const prev = learningStateRef.current;
    const previousBookmarks = prev.bookmarks || [];
    const alreadyBookmarked = previousBookmarks.some(
      (bookmark) => getBookmarkIdentity(bookmark) === targetIdentity,
    );

    const nextBookmarks = alreadyBookmarked
      ? previousBookmarks.filter(
          (bookmark) => getBookmarkIdentity(bookmark) !== targetIdentity,
        )
      : [
          ...previousBookmarks,
          {
            ...item,
            contentKey:
              resolveBookmarkContentKey(item) || item.contentKey || null,
          },
        ];

    const snapshot = {
      ...prev,
      bookmarks: nextBookmarks,
    };
    learningStateRef.current = snapshot;
    setBookmarks(nextBookmarks);

    const uid = userRef.current?.uid;
    if (uid) {
      void persistLearningLocally(uid, snapshot);
    }
  };

  const saveHighlight = (id, htmlContent) => {
    setHighlights((prev) => ({
      ...prev,
      [id]: htmlContent,
    }));
  };

  const persistPremiumAccess = async (metadata = {}) => {
    const currentUser = userRef.current;
    if (!currentUser?.uid) return;

    try {
      await setDoc(
        doc(db, "users", currentUser.uid),
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

    const iosKey = process.env.EXPO_PUBLIC_RC_API_KEY_IOS;
    const androidKey = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID;

    const rcApiKey = Platform.select({
      ios: (iosKey && iosKey !== "undefined" && iosKey !== "null") ? iosKey : "appl_bIbghsScVIeHGfrXogcChLzXKsS",
      android: (androidKey && androidKey !== "undefined" && androidKey !== "null") ? androidKey : "goog_mfyywPtYwjSUQhFJoHeVysbUole",
    }) || process.env.EXPO_PUBLIC_RC_API_KEY;

    console.log(`[RevenueCat] Initializing on ${Platform.OS} with key: ${rcApiKey?.substring(0, 8)}...`);

    const isTestKey =
      typeof rcApiKey === "string" && rcApiKey.startsWith("test_");
    const isProdRuntime = !__DEV__;

    if (!rcApiKey || (isProdRuntime && isTestKey)) {
      console.warn(
        `RevenueCat initialization skipped for ${Platform.OS}: missing or non-production API key.`,
      );
      return;
    }

    // Ensure API key matches the current platform to avoid cross-platform configuration errors
    const isIosKey = typeof rcApiKey === "string" && rcApiKey.startsWith("appl_");
    const isAndroidKey = typeof rcApiKey === "string" && rcApiKey.startsWith("goog_");

    if (Platform.OS === "ios" && !isIosKey) {
      console.warn(
        `[RevenueCat] Skipped configuration: iOS requires an API key starting with 'appl_'. Found: ${rcApiKey?.substring(0, 8)}...`
      );
      return;
    }
    if (Platform.OS === "android" && !isAndroidKey) {
      console.warn(
        `[RevenueCat] Skipped configuration: Android requires an API key starting with 'goog_'. Found: ${rcApiKey?.substring(0, 8)}...`
      );
      return;
    }

    Purchases.configure({ apiKey: rcApiKey });

    Purchases.addCustomerInfoUpdateListener((info) => {
      const hasPremium = hasRevenueCatPremiumEntitlement(info);
      setRevenueCatPremium(hasPremium);
      const premiumEntitlement = info?.entitlements?.active?.Premium;
      const expiresDate = premiumEntitlement?.expirationDate;
      const pType = getPremiumTypeFromEntitlement(premiumEntitlement);
      setSubscriptionExpiry(expiresDate || null);
      if (pType) {
        setPremiumType(pType);
      }
      if (hasPremium) {
        persistPremiumAccess({ 
          premiumSource: "revenuecat_listener",
          premiumType: pType || "monthly",
          premiumExpiryDate: expiresDate || null,
        });
      }
    });

    Purchases.getCustomerInfo()
      .then((info) => {
        const hasPremium = hasRevenueCatPremiumEntitlement(info);
        setRevenueCatPremium(hasPremium);
        const premiumEntitlement = info?.entitlements?.active?.Premium;
        const expiresDate = premiumEntitlement?.expirationDate;
        const pType = getPremiumTypeFromEntitlement(premiumEntitlement);
        setSubscriptionExpiry(expiresDate || null);
        if (pType) {
          setPremiumType(pType);
        }
        if (hasPremium) {
          persistPremiumAccess({ 
            premiumSource: "revenuecat_initial_check",
            premiumType: pType || "monthly",
            premiumExpiryDate: expiresDate || null,
          });
        }
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
        const premiumEntitlement = customerInfo?.entitlements?.active?.Premium;
        const expiresDate = premiumEntitlement?.expirationDate;
        const pType = getPremiumTypeFromEntitlement(premiumEntitlement);
        setSubscriptionExpiry(expiresDate || null);
        if (pType) {
          setPremiumType(pType);
        }
        if (hasPremium) {
          persistPremiumAccess({ 
            premiumSource: "revenuecat_login",
            premiumType: pType || "monthly",
            premiumExpiryDate: expiresDate || null,
          });
        }
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

  const login = async (userData) => {
    if (Constants.appOwnership !== "expo" && Purchases && userData.uid) {
      Purchases.logIn(userData.uid)
        .then(({ customerInfo }) => {
          const hasPremium = hasRevenueCatPremiumEntitlement(customerInfo);
          setRevenueCatPremium(hasPremium);
          const premiumEntitlement = customerInfo?.entitlements?.active?.Premium;
          const expiresDate = premiumEntitlement?.expirationDate;
          const pType = getPremiumTypeFromEntitlement(premiumEntitlement);
          setSubscriptionExpiry(expiresDate || null);
          if (pType) {
            setPremiumType(pType);
          }
          if (hasPremium) {
            persistPremiumAccess({ 
              premiumSource: "revenuecat_login",
              premiumType: pType || "monthly",
              premiumExpiryDate: expiresDate || null,
            });
          }
        })
        .catch((err) => {
          console.warn("RevenueCat logIn during login failed:", err.message);
        });
    }

    
    setUser(userData);
    if (userData.isPremium !== undefined) {
      setAccountPremium(Boolean(userData.isPremium));
    }

    // If onAuthStateChanged didn't hydrate (e.g. device conflict resolved
    // via LoginScreen modal), fetch learning progress from cloud now.
    if (!cloudHydratedRef.current && userData.uid) {
      try {
        const userDocRef = doc(db, "users", userData.uid);
        const userDoc = await Promise.race([
          getDoc(userDocRef),
          timeoutPromise(5000),
        ]);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const cachedAccountRaw = await loadLocalLearningSnapshot(
            userData.uid,
          );
          const deviceId =
            currentDeviceIdRef.current || (await getDeviceId());
          currentDeviceIdRef.current = deviceId;
          const mergedLearningState = collectLearningStateCandidates(
            data,
            deviceId,
            cachedAccountRaw,
            learningStateRef.current,
          );
          const cloudState = hydrateStoredState(mergedLearningState);
          await persistLearningLocally(userData.uid, cloudState);
        }
        cloudHydratedRef.current = true;
        syncAllAnnotations(userData.uid);
        syncAllHighlights(userData.uid);
      } catch (err) {
        console.warn("Cloud hydration during login failed:", err?.message);
        try {
          const cached = await AsyncStorage.getItem(getAccountStateKey(userData.uid));
          if (cached) hydrateStoredState(JSON.parse(cached));
        } catch (_) {}
        cloudHydratedRef.current = true;
        syncAllAnnotations(userData.uid);
        syncAllHighlights(userData.uid);
      }
    }
  };

  const logout = async () => {
    isLoggingOutRef.current = true;

    // Clear currentDeviceId in Firestore so re-login won't trigger conflict
    const uid = user?.uid || auth.currentUser?.uid;
    if (uid) {
      try {
        await updateDoc(doc(db, "users", uid), { currentDeviceId: null });
      } catch (e) {
        console.warn("Failed to clear currentDeviceId on logout:", e?.message);
      }
    }

    try {
      await signOut(auth);
    } catch (_) { }
    if (Constants.appOwnership !== "expo" && GoogleSignin) {
      try {
        await GoogleSignin.signOut();
      } catch (_) { }
    }
    // Log out of RevenueCat
    if (Constants.appOwnership !== "expo" && Purchases) {
      try {
        await Purchases.logOut();
      } catch (_) { }
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

  const updateUsername = async (newUsername) => {
    if (!user || !user.uid) return;
    const trimmed = newUsername.trim();
    if (!trimmed) return;

    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, { username: trimmed });

    // Keep Auth displayName aligned so nothing reverts to Google/Apple name.
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: trimmed });
      } catch (err) {
        console.warn("Failed to sync Auth displayName:", err?.message);
      }
    }

    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        username: trimmed,
      };
    });
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.username = trimmed;
        await AsyncStorage.setItem("user", JSON.stringify(parsed));
      } else {
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({ ...user, username: trimmed }),
        );
      }
    } catch (err) {
      console.warn("Failed to update cached user in AsyncStorage:", err);
    }
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
        setStudyScore,
        dailyReadHistory,
        markAsRead,
        markAsUnread,
        isBookmarked,
        toggleBookmark,
        saveHighlight,
        clearStorage,
        refreshFromCloud,
        refreshLibraryContent,
        contentRegistryVersion,
        user,
        isPremium,
        premiumType,
        subscriptionExpiry,
        login,
        logout,
        upgradeToPremium,
        updateUsername,
        isScreenCapturePrevented,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
