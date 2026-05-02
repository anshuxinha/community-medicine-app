/**
 * notificationService.js
 * Manages all local push notifications for STROMA.
 *
 * Notification schedule:
 *  - Weekly digest: Every Sunday at 10:00 AM
 *  - Streak milestones: Fired immediately on 3, 7, 14, 30 day streaks
 *  - Video notifications: When new videos are added
 *
 * Note: Daily study reminder and rotating study tips have been removed
 * to reduce notification frequency.
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import publicHealthDays from "../data/publicHealthDays.json";

// Study tips rotation
const STUDY_TIPS = [
  "💡 Remember: The 'Rule of Halves' applies to Hypertension — only half are diagnosed, half treated, half controlled.",
  "📚 Quick fact: VE = (ARu – ARv) / ARu × 100. Vaccine Efficacy formula for today!",
  "🔬 Gram +ve = Violet/Purple (Crystal Violet retained). Gram –ve = Pink/Red (Safranin counterstain).",
  "🦟 Anopheles rests at 45°, Culex rests parallel. Remember by: Anopheles = Angular!",
  "💊 MDT for Multibacillary Leprosy = 12 packs (R + C + D) over 18 months.",
  "🧮 Sample size ↑ when: CI increases, Power increases, margin of error decreases, P = 0.5.",
  "🏥 Miller's Pyramid bottom-up: Knows → Knows How → Shows How → Does.",
  "📊 Chi-square tests qualitative data. t-test for quantitative (small n). Z-test for large n.",
  "🌡️ Kata Thermometer: Dry ≥6, Wet ≥20 = Thermal comfort. Used in occupational health.",
  "💉 Vaccine Vial Monitor: Inner square LIGHTER than outer circle = Safe to use!",
];

let tipIndex = 0;
const STREAK_MILESTONE_NOTIFICATION_KEY = "streakMilestoneLastNotified";
const VIDEO_NOTIFICATION_STORAGE_KEY = "video_notification_subscribed";
const LEGACY_WEBINAR_NOTIFICATION_STORAGE_KEY =
  "webinar_notification_subscribed";

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
 * Schedule all recurring notifications.
 * Call once on app startup (safe to call multiple times — cancels old ones first).
 */
export async function scheduleAllNotifications() {
  ensureNotificationHandler();
  const granted = await requestPermissions();
  if (!granted) return;

  // Cancel existing scheduled notifications before rescheduling
  await Notifications.cancelAllScheduledNotificationsAsync();

  // ── 1. Weekly Progress Digest @ Sunday 10:00 AM ────────
  await Notifications.scheduleNotificationAsync({
    identifier: "weekly-digest",
    content: {
      title: "📊 Your Weekly Progress",
      body: "Check your study stats and see how far you've come this week!",
      sound: true,
      data: { screen: "Dashboard" },
    },
    trigger: {
      weekday: 1, // Sunday (expo-notifications uses 1=Sunday)
      hour: 10,
      minute: 0,
      repeats: true,
    },
  });

  // ── 2. Public Health Day / Week Notifications @ 8:00 AM ────────
  // For weeks (dateLabel contains "-"), the notification fires on the first day
  // which is already represented by the `day` field in the data.
  for (const healthDay of publicHealthDays) {
    const isWeek = healthDay.dateLabel.includes("-");
    const emoji = isWeek ? "📅" : "🏥";
    const label = isWeek ? "Week begins today" : "Today";

    await Notifications.scheduleNotificationAsync({
      identifier: `health-day-${healthDay.month}-${healthDay.day}`,
      content: {
        title: `${emoji} ${healthDay.name}`,
        body: `${label}! ${healthDay.description.split(".")[0]}.`,
        sound: true,
        data: { screen: "Dashboard" },
      },
      trigger: {
        month: healthDay.month,
        day: healthDay.day,
        hour: 8,
        minute: 0,
        repeats: true,
      },
    });
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
 */
export async function sendVideoNotification(videoTitle, videoDescription) {
  try {
    const subscribed = await isSubscribedToVideoNotifications();

    if (!subscribed) {
      console.log("User not subscribed to video notifications");
      return;
    }

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

async function persistVideoNotificationPreference(isSubscribed) {
  await AsyncStorage.setItem(
    VIDEO_NOTIFICATION_STORAGE_KEY,
    isSubscribed ? "true" : "false",
  );
  await AsyncStorage.removeItem(LEGACY_WEBINAR_NOTIFICATION_STORAGE_KEY);

  const uid = auth.currentUser?.uid;
  if (!uid) return;

  await setDoc(
    doc(db, "users", uid),
    {
      videoNotificationsEnabled: isSubscribed,
      videoNotificationsUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function addVideoSubscriptionListener(listener) {
  videoSubscriptionListeners.add(listener);
  return () => videoSubscriptionListeners.delete(listener);
}

export async function isSubscribedToVideoNotifications() {
  try {
    const subscribed = await AsyncStorage.getItem(VIDEO_NOTIFICATION_STORAGE_KEY);

    if (subscribed === "true") return true;
    if (subscribed === "false") return false;

    const legacySubscribed = await AsyncStorage.getItem(
      LEGACY_WEBINAR_NOTIFICATION_STORAGE_KEY,
    );

    if (legacySubscribed === "true") {
      await persistVideoNotificationPreference(true);
      return true;
    }

    return true;
  } catch (error) {
    console.error("Error checking video subscription:", error);
    return true;
  }
}

export async function unsubscribeFromVideoNotifications() {
  try {
    await persistVideoNotificationPreference(false);
    console.log("User unsubscribed from video notifications");
    emitVideoSubscriptionChange(false);
    return true;
  } catch (error) {
    console.error("Error unsubscribing from video notifications:", error);
    return false;
  }
}

export async function subscribeToVideoNotifications() {
  try {
    await persistVideoNotificationPreference(true);
    console.log("User subscribed to video notifications");
    emitVideoSubscriptionChange(true);
    return true;
  } catch (error) {
    console.error("Error subscribing to video notifications:", error);
    return false;
  }
}
