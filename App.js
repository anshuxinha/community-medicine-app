import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
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
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#6C3AE0",
  });
}

function ThemedApp() {
  const { paperTheme, isDark } = useAppTheme();

  return (
    <PaperProvider theme={paperTheme || fallbackPaperTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AppNavigator />
      <UpdateBottomSheet />
    </PaperProvider>
  );
}

/**
 * Two-phase mount so expo-updates can fire "content appeared" before heavier
 * theme wiring. OTAs that throw before that event are blacklisted forever on
 * the device (see Expo error-recovery docs) — which matches "stuck on embedded".
 */
export default function App() {
  const [shellReady, setShellReady] = useState(false);

  useEffect(() => {
    setShellReady(true);
  }, []);

  useEffect(() => {
    if (!shellReady) return;

    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    ).catch((err) =>
      console.warn("Failed to lock portrait orientation:", err?.message),
    );

    scheduleAllNotifications().catch((err) =>
      console.warn("Failed to schedule notifications:", err?.message),
    );
  }, [shellReady]);

  // Phase 1: minimal tree (no ThemeProvider / navigator) so the update is
  // marked launchable even if later theme code misbehaves.
  if (!shellReady) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0D1B2A" }} />
    );
  }

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
