import React, { useEffect } from "react";
import { Platform, StatusBar as RNStatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import * as Notifications from "expo-notifications";
import * as ScreenOrientation from "expo-screen-orientation";
import AppNavigator from "./navigation/AppNavigator";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider, useAppTheme } from "./styles/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { scheduleAllNotifications } from "./services/notificationService";
import UpdateBottomSheet from "./components/UpdateBottomSheet";
import ReviewFeedbackModal from "./components/ReviewFeedbackModal";
import ReviewRequestModal from "./components/ReviewRequestModal";
import AppUpdatedToast from "./components/AppUpdatedToast";
import { paperTheme as fallbackPaperTheme } from "./styles/theme";
import { prefetchUpdatesMonths } from "./services/updatesService";
import { startSilentOtaDownloads } from "./utils/otaUpdates";

// Create Android notification channel at module level so incoming FCM pushes
// on cold start are never dropped due to a missing channel.
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "Video & app updates",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#6C3AE0",
    sound: "default",
    enableVibrate: true,
    showBadge: true,
  });
}

function ThemedApp() {
  const { paperTheme, isDark } = useAppTheme();

  // Imperative barStyle only when the status bar is visible. Avoid calling
  // setBackgroundColor while video fullscreen may have the bar hidden.
  useEffect(() => {
    RNStatusBar.setBarStyle(isDark ? "light-content" : "dark-content", true);
  }, [isDark]);

  return (
    <PaperProvider theme={paperTheme || fallbackPaperTheme}>
      <AppNavigator />
      <UpdateBottomSheet />
      <ReviewFeedbackModal />
      <ReviewRequestModal />
      <AppUpdatedToast />
    </PaperProvider>
  );
}

export default function AppRoot() {
  useEffect(() => {
    ScreenOrientation.unlockAsync().catch((err) =>
      console.warn("Failed to unlock screen orientation:", err?.message),
    );

    scheduleAllNotifications().catch((err) =>
      console.warn("Failed to schedule notifications:", err?.message),
    );

    prefetchUpdatesMonths();
    const stopSilentOta = startSilentOtaDownloads();
    return () => stopSilentOta();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProvider>
            <ThemedApp />
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
