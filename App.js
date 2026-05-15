import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import { usePreventScreenCapture } from "expo-screen-capture";
import AppNavigator from "./src/navigation/AppNavigator";
import { AppProvider } from "./src/context/AppContext";
import { paperTheme } from "./src/styles/theme";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { scheduleAllNotifications } from "./src/services/notificationService";
import UpdateBottomSheet from "./src/components/UpdateBottomSheet";

export default function App() {
  usePreventScreenCapture();

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
