/**
 * notificationService.js
 * Manages all local push notifications for STROMA.
 *
 * Notification schedule:
 *  - Daily study reminder: 8:00 PM every day
 *  - Weekly digest: Every Sunday at 10:00 AM
 *  - Study tip: Every 3 days at 9:00 AM (rotating tips)
 *  - Streak milestones: Fired immediately on 3, 7, 14, 30 day streaks
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

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

// Configure notification handling behaviour
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
  const granted = await requestPermissions();
  if (!granted) return;

  // Cancel existing scheduled notifications before rescheduling
  await Notifications.cancelAllScheduledNotificationsAsync();

  // ── 1. Daily Study Reminder @ 8:00 PM ──────────────────
  await Notifications.scheduleNotificationAsync({
    identifier: "daily-reminder",
    content: {
      title: "📚 Time to Study!",
      body: "Don't break your streak — open STROMA and read a chapter today.",
      sound: true,
      data: { screen: "Library" },
    },
    trigger: {
      hour: 20,
      minute: 0,
      repeats: true,
    },
  });

  // ── 2. Weekly Progress Digest @ Sunday 10:00 AM ────────
  await Notifications.scheduleNotificationAsync({
    identifier: "weekly-digest",
    content: {
      title: "📊 Your Weekly Progress",
      body: "Check your study stats and see how far you've come this week!",
      sound: true,
      data: { screen: "Stats" },
    },
    trigger: {
      weekday: 1, // Sunday (expo-notifications uses 1=Sunday)
      hour: 10,
      minute: 0,
      repeats: true,
    },
  });

  // ── 3. Rotating Study Tip every 3 days @ 9:00 AM ──────
  const tip = STUDY_TIPS[tipIndex % STUDY_TIPS.length];
  tipIndex++;
  await Notifications.scheduleNotificationAsync({
    identifier: "study-tip",
    content: {
      title: "💡 STROMA Study Tip",
      body: tip,
      sound: false,
      data: { screen: "Dashboard" },
    },
    trigger: {
      seconds: 60 * 60 * 24 * 3, // 3 days
      repeats: true,
    },
  });
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
}

/**
 * Send a webinar notification to subscribed users.
 * This would typically be called from a backend when new webinars are added.
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
          screen: "Webinars",
          type: "webinar",
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
 * Tap handler — navigate to the correct screen when notification is tapped.
 * Call this in your root component with the navigation ref.
 * @param {object} navigationRef
 */
export function setupNotificationTapHandler(navigationRef) {
  Notifications.addNotificationResponseReceivedListener((response) => {
    const screen = response.notification.request.content.data?.screen;
    if (screen && navigationRef?.current) {
      navigationRef.current.navigate(screen);
    }
  });
}
