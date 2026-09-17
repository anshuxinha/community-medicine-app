import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { hideSplash } from "./src/utils/appSplash";

const SHELL_BG = "#0D1B2A";

/**
 * Tiny first paint so expo-updates can fire CONTENT_APPEARED before Firebase,
 * navigation, and expo-constants touch ExpoUpdates. A throw in that window on
 * the first launch of a new OTA blacklists the update and kills the process.
 */
export default function App() {
  const [Root, setRoot] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let innerTimer = null;
    const frame = requestAnimationFrame(() => {
      innerTimer = setTimeout(() => {
        try {
          const mod = require("./src/AppRoot");
          if (!cancelled) setRoot(() => mod.default);
        } catch (error) {
          console.warn("AppRoot failed to load:", error?.message);
          hideSplash();
        }
      }, 0);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (innerTimer) clearTimeout(innerTimer);
    };
  }, []);

  if (!Root) {
    return <View style={styles.shell} />;
  }

  return <Root />;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: SHELL_BG,
  },
});

