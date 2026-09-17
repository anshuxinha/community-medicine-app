import React, { useEffect, useState } from "react";
import { AppRegistry, StyleSheet, View } from "react-native";
import { hideSplash, preventAutoHideSplash } from "./src/utils/appSplash";

preventAutoHideSplash();

const SHELL_BG = "#0D1B2A";

/**
 * First view must paint before `expo` or AppRoot load. `registerRootComponent`
 * pulls Expo.fx → expo-constants, which JSON.parse(ExpoUpdates.manifestString)
 * at import time. On the first open of a new OTA that throw blacklists the
 * update and kills the process.
 */
function Boot() {
  const [Root, setRoot] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let innerTimer = null;
    const frame = requestAnimationFrame(() => {
      innerTimer = setTimeout(() => {
        try {
          const mod = require("./App");
          if (!cancelled) setRoot(() => mod.default);
        } catch (error) {
          console.warn("App failed to load:", error?.message);
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

if (__DEV__) {
  require("expo").registerRootComponent(Boot);
} else {
  AppRegistry.registerComponent("main", () => Boot);
}
