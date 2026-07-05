/**
 * notificationService.js
 * Manages all local push notifications for STROMA.
 *
 * All notifications fire immediately on app open (no fixed-time triggers)
 * to work reliably across iOS and Android, even when offline:
 *  - Day-before reminder: Fires when tomorrow is a public health day
 *  - Weekly preview: Lists upcoming health days on first app open each week
 *  - Today alert: Fires when today is a public health day
 *  - Streak milestones: Fired on 3, 7, 14, 30 day streaks
 *  - Video notifications: When new videos are added (local + server push)
 *
 * Each check uses an AsyncStorage key to avoid duplicate delivery.
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
 * Check notification conditions on app open and fire any due notifications.
 * Safe to call multiple times — uses AsyncStorage keys for deduplication.
 */
export async function scheduleAllNotifications() {
  ensureNotificationHandler();
  const granted = await requestPermissions();
  if (!granted) return;

  // Ensure Android notification channel exists before firing any notification.
  // This fixes a race condition where notifications were dropped because the
  // channel had not yet been created by AppContext.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6C3AE0",
    });
  }

  // Cancel any leftover scheduled notifications from previous app versions.
  // All notifications now fire immediately on app open, so nothing needs to
  // remain in the scheduler.
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Fire immediate notifications for any unacknowledged conditions.
  // Each check uses an AsyncStorage key to avoid duplicate delivery.
  await checkDayBeforeHealthDay();
  await checkWeeklyHealthDayPreview();
  await checkTodayHealthDay();
}

/**
 * Compute a week-of-year key for deduplication (YYYY_WNN).
 */
function getWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}_W${weekNum}`;
}

/**
 * If tomorrow is a public health day or week start, fire a day-before
 * reminder (once per calendar day, deduplicated via AsyncStorage).
 */
async function checkDayBeforeHealthDay() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const m = tomorrow.getMonth() + 1;
    const d = tomorrow.getDate();

    const tomorrowKey = `${tomorrow.getFullYear()}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const storageKey = `health_day_eve_${tomorrowKey}`;

    const alreadySent = await AsyncStorage.getItem(storageKey);
    if (alreadySent === "true") return;

    const healthDay = publicHealthDays.find(
      (hd) => hd.month === m && hd.day === d,
    );
    if (!healthDay) return;

    const isWeek = healthDay.dateLabel.includes("-");
    const emoji = isWeek ? "📅" : "🏥";
    const label = isWeek ? "starts tomorrow" : "is tomorrow";

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} Reminder: ${healthDay.name}`,
        body: `${healthDay.name} ${label}! ${healthDay.description.split(".")[0]}.`,
        sound: true,
        channelId: "default",
        data: { screen: "Dashboard" },
      },
      trigger: null,
    });

    await AsyncStorage.setItem(storageKey, "true");
  } catch (e) {
    console.warn("Failed to check day-before health day:", e);
  }
}

/**
 * On the first app open of each week, fire a notification previewing any
 * public health days in the next 7 days. Falls back to a generic weekly
 * digest when no health days are upcoming.
 */
async function checkWeeklyHealthDayPreview() {
  try {
    const weekKey = getWeekKey();
    const storageKey = `week_preview_${weekKey}`;

    const alreadySent = await AsyncStorage.getItem(storageKey);
    if (alreadySent === "true") return;

    const today = new Date();
    const upcoming = [];

    for (let i = 0; i <= 6; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const m = checkDate.getMonth() + 1;
      const d = checkDate.getDate();

      const match = publicHealthDays.find(
        (hd) => hd.month === m && hd.day === d,
      );
      if (match) {
        upcoming.push(match);
      }
    }

    if (upcoming.length === 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📊 Your Weekly Progress",
          body: "Check your study stats and see how far you've come this week!",
          sound: true,
          channelId: "default",
          data: { screen: "Dashboard" },
        },
        trigger: null,
      });
    } else {
      const daysList = upcoming
        .map((hd) => `• ${hd.dateLabel}: ${hd.name}`)
        .join("\n");
      const body =
        upcoming.length === 1
          ? `${upcoming[0].name} is coming up this week (${upcoming[0].dateLabel}).`
          : `${upcoming.length} health days this week:\n${daysList}`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📅 This Week in Public Health",
          body,
          sound: true,
          channelId: "default",
          data: { screen: "Dashboard" },
        },
        trigger: null,
      });
    }

    await AsyncStorage.setItem(storageKey, "true");
  } catch (e) {
    console.warn("Failed to check weekly health day preview:", e);
  }
}

/**
 * If today is a public health day or week start, fire an immediate
 * notification (once per calendar day, deduplicated via AsyncStorage).
 */
async function checkTodayHealthDay() {
  const today = new Date();
  const m = today.getMonth() + 1;
  const d = today.getDate();

  const todayKey = getTodayNotificationKey();
  const storageKey = `immediate_notif_sent_${todayKey}`;

  try {
    const alreadySent = await AsyncStorage.getItem(storageKey);
    if (alreadySent === "true") return;

    const healthDay = publicHealthDays.find(
      (hd) => hd.month === m && hd.day === d,
    );
    if (!healthDay) return;

    const isWeek = healthDay.dateLabel.includes("-");
    const emoji = isWeek ? "📅" : "🏥";
    const label = isWeek ? "Week begins today" : "Today";

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} ${healthDay.name}`,
        body: `${label}! ${healthDay.description.split(".")[0]}.`,
        sound: true,
        channelId: "default",
        data: { screen: "Dashboard" },
      },
      trigger: null,
    });
    await AsyncStorage.setItem(storageKey, "true");
  } catch (e) {
    console.warn("Failed to check today's health day:", e);
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
