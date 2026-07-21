import React, { useEffect } from "react";
import { Platform, StatusBar as RNStatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import * as Notifications from "expo-notifications";
import * as ScreenOrientation from "expo-screen-orientation";
import AppNavigator from "./src/navigation/AppNavigator";
import { AppProvider } from "./src/context/AppContext";
import { ThemeProvider, useAppTheme } from "./src/styles/ThemeContext";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { scheduleAllNotifications } from "./src/services/notificationService";
import UpdateBottomSheet from "./src/components/UpdateBottomSheet";
import { paperTheme as fallbackPaperTheme } from "./src/styles/theme";

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
    </PaperProvider>
  );
}

export default function App() {
  useEffect(() => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    ).catch((err) =>
      console.warn("Failed to lock portrait orientation:", err?.message),
    );

    scheduleAllNotifications().catch((err) =>
      console.warn("Failed to schedule notifications:", err?.message),
    );
  }, []);

  // No Updates.reloadAsync here or in index.js — that caused OTA blacklisting.
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AppProvider>
            <ThemedApp />
          </AppProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
