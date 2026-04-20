import React from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as ScreenCapture from "expo-screen-capture";

export const useFocusedScreenCaptureProtection = (key) => {
  useFocusEffect(
    React.useCallback(() => {
      let isFocused = true;

      const enableProtection = async () => {
        try {
          await ScreenCapture.preventScreenCaptureAsync(key);
        } catch (error) {
          if (isFocused) {
            console.warn("Failed to enable screen capture prevention:", error);
          }
        }
      };

      enableProtection();

      return () => {
        isFocused = false;
        ScreenCapture.allowScreenCaptureAsync(key).catch(() => {
          // Ignore cleanup errors so navigation never gets blocked.
        });
      };
    }, [key]),
  );
};
