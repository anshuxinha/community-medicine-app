import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as ScreenOrientation from "expo-screen-orientation";

/**
 * Unlock free rotation while the screen is focused; re-lock portrait on blur.
 * Use for Library/Reading (and similar content surfaces). Safe on tab screens
 * that stay mounted when unfocused.
 */
export function useUnlockOrientationOnFocus() {
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      ScreenOrientation.unlockAsync().catch((error) => {
        if (!cancelled) {
          console.warn(
            "Failed to unlock screen orientation:",
            error?.message,
          );
        }
      });

      return () => {
        cancelled = true;
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        ).catch((error) => {
          console.warn(
            "Failed to re-lock portrait orientation:",
            error?.message,
          );
        });
      };
    }, []),
  );
}
