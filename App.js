import React, { useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import * as Notifications from "expo-notifications";
import AppNavigator from "./src/navigation/AppNavigator";
import { AppProvider } from "./src/context/AppContext";
import { paperTheme } from "./src/styles/theme";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { scheduleAllNotifications } from "./src/services/notificationService";
import UpdateBottomSheet from "./src/components/UpdateBottomSheet";

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

export default function App() {
  useEffect(() => {
    // Schedule recurring notifications (Public Health Days, Weekly Digest)
    // on app startup. This ensures they pop up even when the app is closed.
    scheduleAllNotifications().catch((err) =>
      console.warn("Failed to schedule notifications:", err),
    );
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProvider>
          <PaperProvider theme={paperTheme}>
            <AppNavigator />
            <UpdateBottomSheet />
          </PaperProvider>
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
