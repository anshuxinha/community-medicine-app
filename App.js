import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import AppNavigator from "./src/navigation/AppNavigator";
import { AppProvider } from "./src/context/AppContext";
import { paperTheme } from "./src/styles/theme";
import ErrorBoundary from "./src/components/ErrorBoundary";

export default function App() {
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
