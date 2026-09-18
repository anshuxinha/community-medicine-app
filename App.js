import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { hideSplash } from "./src/utils/appSplash";
import ErrorBoundary from "./src/components/ErrorBoundary";

const SHELL_BG = "#0D1B2A";
const MAX_APPROOT_ATTEMPTS = 6;
const APPROOT_RETRY_MS = 80;

/**
 * Tiny first paint so expo-updates can fire CONTENT_APPEARED before Firebase,
 * navigation, and expo-constants touch ExpoUpdates. A throw in that window on
 * the first launch of a new OTA blacklists the update and kills the process.
 */
function loadAppRoot(attempt, setRoot, cancelledRef) {
  try {
    const mod = require("./src/AppRoot");
    if (!cancelledRef.current) setRoot(() => mod.default);
  } catch (error) {
    console.warn("AppRoot failed to load:", error?.message);
    if (attempt + 1 >= MAX_APPROOT_ATTEMPTS) {
      hideSplash();
      return;
    }
    setTimeout(() => {
      if (!cancelledRef.current) {
        loadAppRoot(attempt + 1, setRoot, cancelledRef);
      }
    }, APPROOT_RETRY_MS);
  }
}

export default function App() {
  const [Root, setRoot] = useState(null);

  useEffect(() => {
    const cancelledRef = { current: false };
    let innerTimer = null;
    const frame = requestAnimationFrame(() => {
      innerTimer = setTimeout(() => {
        loadAppRoot(0, setRoot, cancelledRef);
      }, 0);
    });
    return () => {
      cancelledRef.current = true;
      cancelAnimationFrame(frame);
      if (innerTimer) clearTimeout(innerTimer);
    };
  }, []);

  if (!Root) {
    return <View style={styles.shell} />;
  }

  return (
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: SHELL_BG,
  },
});
