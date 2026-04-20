import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import { usePreventScreenCapture } from "expo-screen-capture";
import AppNavigator from "./src/navigation/AppNavigator";
import { AppProvider } from "./src/context/AppContext";
import { paperTheme } from "./src/styles/theme";
import ErrorBoundary from "./src/components/ErrorBoundary";

export default function App() {
  usePreventScreenCapture();

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProvider>
          <PaperProvider theme={paperTheme}>
            <AppNavigator />
          </PaperProvider>
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
