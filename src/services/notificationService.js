/**
 * notificationService.js
 * Manages local notifications and client-side Expo push helpers for STROMA.
 *
 * Public health day / weekly digest pushes are server-only (GitHub Action
 * scripts/push_notifications.py --daily-checks at 8:00 AM IST) so they work
 * with the app closed and are not duplicated on app open.
 *
 * Still handled here:
 *  - Permission + Android channel setup on app open
 *  - Streak milestones (3, 7, 14, 30) — local, immediate
 *  - Video / doubt-reply / legacy helpers that call Expo push APIs
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const STREAK_MILESTONE_NOTIFICATION_KEY = "streakMilestoneLastNotified";
const VIDEO_NOTIFICATION_STORAGE_KEY = "video_notification_subscribed";
const LEGACY_WEBINAR_NOTIFICATION_STORAGE_KEY =
  "webinar_notification_subscribed";
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const getTodayNotificationKey = () => new Date().toISOString().split("T")[0];

async function wasStreakMilestoneSentToday(streak) {
  try {
    const storedValue = await AsyncStorage.getItem(
      STREAK_MILESTONE_NOTIFICATION_KEY,
    );
    const streakMilestones = storedValue ? JSON.parse(storedValue) : {};
    return streakMilestones?.[streak] === getTodayNotificationKey();
  } catch (error) {
    console.warn("Failed to read streak notification state:", error);
    return false;
  }
}

async function markStreakMilestoneSentToday(streak) {
  try {
    const storedValue = await AsyncStorage.getItem(
      STREAK_MILESTONE_NOTIFICATION_KEY,
    );
    const streakMilestones = storedValue ? JSON.parse(storedValue) : {};
    streakMilestones[streak] = getTodayNotificationKey();
    await AsyncStorage.setItem(
      STREAK_MILESTONE_NOTIFICATION_KEY,
      JSON.stringify(streakMilestones),
    );
  } catch (error) {
    console.warn("Failed to persist streak notification state:", error);
  }
}

// Configure notification handling behaviour
// Note: AppContext.js also sets a notification handler as a fallback.
// This is the primary handler for in-app notifications.
let notificationHandlerSet = false;

export function ensureNotificationHandler() {
  if (notificationHandlerSet) return;
  notificationHandlerSet = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    // ignore — handler may already be set
  }
}

/**
 * Request notification permissions.
 * Returns true if granted.
 */
export async function requestPermissions() {
  if (!Device.isDevice) return false; // Simulators don't support push

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * App-open setup for notifications. Does not fire health-day locals —
 * those are sent server-side (daily GitHub Action) so the app can stay closed.
 * Safe to call multiple times.
 */
export async function scheduleAllNotifications() {
  ensureNotificationHandler();
  const granted = await requestPermissions();
  if (!granted) return;

  // Ensure Android notification channel exists before any notification shows.
  // This fixes a race where cold-start FCM pushes were dropped without a channel.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Video & app updates",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6C3AE0",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });
  }

  // One-time cleanup of leftover scheduled notifications from previous app
  // versions. Gated so it doesn't wipe incoming push notifications on every
  // app open (Android can drop them in the race window).
  const LEGACY_CLEANUP_KEY = "notifications_legacy_cleanup_done";
  const alreadyCleaned = await AsyncStorage.getItem(LEGACY_CLEANUP_KEY);
  if (!alreadyCleaned) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem(LEGACY_CLEANUP_KEY, "true");
  }
}

/**
 * Fire an immediate streak milestone notification.
 * @param {number} streak - The current streak count
 */
export async function triggerStreakMilestone(streak) {
  const milestones = {
    3: {
      emoji: "🔥",
      msg: "3-day streak! You're building a habit. Keep it up!",
    },
    7: {
      emoji: "⭐",
      msg: "One whole week! You're on fire — 7-day streak achieved!",
    },
    14: {
      emoji: "🏆",
      msg: "Two weeks! Your dedication is remarkable. 14-day streak!",
    },
    30: {
      emoji: "🎯",
      msg: "ONE MONTH STREAK! You're a true Community Medicine scholar!",
    },
  };
  if (!milestones[streak]) return;
  if (await wasStreakMilestoneSentToday(streak)) return;

  const granted = await requestPermissions();
  if (!granted) return;

  const { emoji, msg } = milestones[streak];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${emoji} Streak Milestone!`,
      body: msg,
      sound: true,
      channelId: "default",
      data: { screen: "Dashboard" },
    },
    trigger: null, // Fire immediately
  });

  await markStreakMilestoneSentToday(streak);
}

/**
 * Backward-compatible wrapper for the old webinar notification API.
 * New code should use the video notification helpers below.
 * For local testing, we can call this manually.
 * @param {string} webinarTitle - Title of the new webinar
 * @param {string} webinarDescription - Description of the webinar
 */
export async function sendWebinarNotification(
  webinarTitle,
  webinarDescription,
) {
  try {
    // Check if user has subscribed to webinar notifications
    // In a real app, this would check a database of subscribed users
    // For now, we'll use AsyncStorage to check local preference
    const AsyncStorage =
      await import("@react-native-async-storage/async-storage");
    const subscribed = await AsyncStorage.default.getItem(
      "webinar_notification_subscribed",
    );

    if (subscribed !== "true") {
      console.log("User not subscribed to webinar notifications");
      return;
    }

    // Request permissions if not already granted
    const granted = await requestPermissions();
    if (!granted) {
      console.log("Notification permissions not granted");
      return;
    }

    // Send the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎥 New Webinar Available!",
        body: `${webinarTitle} - ${webinarDescription}`,
        sound: true,
        channelId: "default",
        data: {
          screen: "Videos",
          type: "video",
          title: webinarTitle,
          description: webinarDescription,
        },
      },
      trigger: null, // Send immediately
    });

    console.log("Webinar notification sent successfully");
  } catch (error) {
    console.error("Error sending webinar notification:", error);
  }
}

// Event emitter for webinar subscription changes
const webinarSubscriptionListeners = new Set();

function emitWebinarSubscriptionChange(isSubscribed) {
  webinarSubscriptionListeners.forEach((listener) => {
    try {
      listener(isSubscribed);
    } catch (error) {
      console.error("Error in webinar subscription listener:", error);
    }
  });
}

export function addWebinarSubscriptionListener(listener) {
  webinarSubscriptionListeners.add(listener);
  return () => webinarSubscriptionListeners.delete(listener);
}

/**
 * Check if user is subscribed to webinar notifications
 */
export async function isSubscribedToWebinarNotifications() {
  try {
    const AsyncStorage =
      await import("@react-native-async-storage/async-storage");
    const subscribed = await AsyncStorage.default.getItem(
      "webinar_notification_subscribed",
    );
    return subscribed === "true";
  } catch (error) {
    console.error("Error checking webinar subscription:", error);
    return false;
  }
}

/**
 * Unsubscribe from webinar notifications
 */
export async function unsubscribeFromWebinarNotifications() {
  try {
    const AsyncStorage =
      await import("@react-native-async-storage/async-storage");
    await AsyncStorage.default.removeItem("webinar_notification_subscribed");
    console.log("User unsubscribed from webinar notifications");
    emitWebinarSubscriptionChange(false);
    return true;
  } catch (error) {
    console.error("Error unsubscribing from webinar notifications:", error);
    return false;
  }
}

/**
 * Subscribe to webinar notifications
 */
export async function subscribeToWebinarNotifications() {
  try {
    const AsyncStorage =
      await import("@react-native-async-storage/async-storage");
    await AsyncStorage.default.setItem(
      "webinar_notification_subscribed",
      "true",
    );
    console.log("User subscribed to webinar notifications");
    emitWebinarSubscriptionChange(true);
    return true;
  } catch (error) {
    console.error("Error subscribing to webinar notifications:", error);
    return false;
  }
}

/**
 * Tap handler — navigate to the correct screen when notification is tapped.
 * Call this in your root component with the navigation ref.
 * @param {object} navigationRef
 */
export function setupNotificationTapHandler(navigationRef) {
  Notifications.addNotificationResponseReceivedListener((response) => {
    const screen = response.notification.request.content.data?.screen;
    if (screen && navigationRef?.current) {
      if (["Dashboard", "Library", "Videos", "Updates"].includes(screen)) {
        navigationRef.current.navigate("MainTabs", { screen });
        return;
      }

      navigationRef.current.navigate(screen);
    }
  });
}

/**
 * Send an immediate local notification for a newly available video.
 * Server-side broadcast push is handled by scripts/bunny-videos.js.
 * Video notifications are always on for all users (no opt-out).
 */
export async function sendVideoNotification(videoTitle, videoDescription) {
  try {
    const granted = await requestPermissions();
    if (!granted) {
      console.log("Notification permissions not granted");
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "New Video Available",
        body: videoDescription
          ? `${videoTitle} - ${videoDescription}`
          : videoTitle,
        sound: true,
        channelId: "default",
        data: {
          screen: "Videos",
          type: "video",
          title: videoTitle,
          description: videoDescription,
        },
      },
      trigger: null,
    });

    console.log("Video notification sent successfully");
  } catch (error) {
    console.error("Error sending video notification:", error);
  }
}

export async function sendReplyNotification(pushToken, options = {}) {
  if (
    typeof pushToken !== "string" ||
    (!pushToken.startsWith("ExponentPushToken[") &&
      !pushToken.startsWith("ExpoPushToken["))
  ) {
    return false;
  }

  const replierName = options.replierName || "Someone";
  const videoTitle = options.videoTitle || "your video doubt";

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        sound: "default",
        priority: "high",
        title: "New reply to your doubt",
        body: `${replierName} replied on ${videoTitle}.`,
        channelId: "default",
        data: {
          screen: "Videos",
          type: "video_doubt_reply",
          videoId: options.videoId || null,
          doubtId: options.doubtId || null,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn(`Reply push notification failed: ${response.status}`, body);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Reply push notification failed:", error?.message);
    return false;
  }
}

const videoSubscriptionListeners = new Set();

function emitVideoSubscriptionChange(isSubscribed) {
  videoSubscriptionListeners.forEach((listener) => {
    try {
      listener(isSubscribed);
    } catch (error) {
      console.error("Error in video subscription listener:", error);
    }
  });
}

/**
 * Ensure local + Firestore preference is always enabled.
 * Opt-out was removed; all users receive new-video pushes by default.
 */
async function ensureVideoNotificationsEnabled() {
  await AsyncStorage.setItem(VIDEO_NOTIFICATION_STORAGE_KEY, "true");
  await AsyncStorage.removeItem(LEGACY_WEBINAR_NOTIFICATION_STORAGE_KEY);

  const uid = auth.currentUser?.uid;
  if (!uid) return;

  await setDoc(
    doc(db, "users", uid),
    {
      videoNotificationsEnabled: true,
      videoNotificationsUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function addVideoSubscriptionListener(listener) {
  videoSubscriptionListeners.add(listener);
  return () => videoSubscriptionListeners.delete(listener);
}

/** Always true — video notifications cannot be disabled in-app. */
export async function isSubscribedToVideoNotifications() {
  return true;
}

/** No-op kept for callers; opt-out is disabled. */
export async function unsubscribeFromVideoNotifications() {
  try {
    await ensureVideoNotificationsEnabled();
    emitVideoSubscriptionChange(true);
    return true;
  } catch (error) {
    console.error("Error ensuring video notifications enabled:", error);
    return false;
  }
}

export async function subscribeToVideoNotifications() {
  try {
    await ensureVideoNotificationsEnabled();
    console.log("Video notifications enabled");
    emitVideoSubscriptionChange(true);
    return true;
  } catch (error) {
    console.error("Error enabling video notifications:", error);
    return false;
  }
}
