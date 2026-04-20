import { useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import * as ScreenCapture from "expo-screen-capture";

/**
 * Hook to prevent screen capture using expo-screen-capture.
 * On Android, preventScreenCapture() applies FLAG_SECURE.
 * On iOS, the secure flag prevents screen recording.
 */
export const useScreenCaptureProtection = () => {
  useEffect(() => {
    let isActive = true;

    const setupProtection = async () => {
      if (Platform.OS === "android") {
        try {
          // On Android, preventScreenCapture() applies FLAG_SECURE
          // This prevents screenshots and screen recording
          await ScreenCapture.preventScreenCapture();
          console.log(
            "Screen capture prevention enabled (Android FLAG_SECURE)",
          );
        } catch (error) {
          console.warn("Failed to enable screen capture prevention:", error);
        }
      } else if (Platform.OS === "ios") {
        try {
          // On iOS, preventScreenCapture() makes the window secure
          await ScreenCapture.preventScreenCapture();
          console.log("Screen capture prevention enabled (iOS)");
        } catch (error) {
          console.warn("Failed to enable screen capture prevention:", error);
        }
      }
    };

    if (isActive) {
      setupProtection();
    }

    return () => {
      isActive = false;
      // Cleanup: allow screen capture when component unmounts
      ScreenCapture.allowScreenCapture().catch(() => {
        // Ignore errors during cleanup
      });
    };
  }, []);
};

/**
 * Hook to detect screen capture (screenshots) on iOS.
 * On Android, FLAG_SECURE prevents screenshots, so no detection is needed.
 *
 * @param {Function} onScreenCaptureChange - Callback receiving boolean (isCaptured)
 * @returns {Function} Cleanup function
 */
export const useScreenCaptureDetection = (onScreenCaptureChange) => {
  useEffect(() => {
    if (Platform.OS === "ios") {
      // On iOS, add screenshot listener
      const subscription = ScreenCapture.addScreenshotListener(() => {
        // Screenshot taken on iOS
        onScreenCaptureChange?.(true);
      });

      return () => {
        subscription.remove();
      };
    }

    // On Android, FLAG_SECURE prevents screenshots - no callback needed
    return () => {};
  }, [onScreenCaptureChange]);
};

/**
 * @deprecated Use useScreenCaptureProtection instead.
 * This function is kept for backward compatibility with existing code.
 */
export const enableScreenCaptureProtection = async () => {
  try {
    await ScreenCapture.preventScreenCapture();
    return true;
  } catch (error) {
    console.warn("Failed to enable screen capture protection:", error);
    return false;
  }
};

/**
 * @deprecated Use useScreenCaptureProtection instead.
 */
export const disableScreenCaptureProtection = async () => {
  try {
    await ScreenCapture.allowScreenCapture();
    return true;
  } catch (error) {
    console.warn("Failed to disable screen capture protection:", error);
    return false;
  }
};

/**
 * @deprecated No direct equivalent in expo-screen-capture.
 */
export const isScreenBeingCaptured = async () => {
  return false;
};

/**
 * @deprecated Use useScreenCaptureDetection instead.
 */
export const subscribeToScreenCaptureChange = (callback) => {
  if (Platform.OS === "ios") {
    const subscription = ScreenCapture.addScreenshotListener(() => {
      callback(true);
    });

    return () => subscription.remove();
  }

  // On Android, FLAG_SECURE prevents screenshots - no subscription needed
  return () => {};
};

export default {
  useScreenCaptureProtection,
  useScreenCaptureDetection,
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
  isScreenBeingCaptured,
  subscribeToScreenCaptureChange,
};
