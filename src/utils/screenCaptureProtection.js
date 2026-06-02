import { NativeModules, Platform, NativeEventEmitter } from "react-native";
import * as ScreenCapture from "expo-screen-capture";

const { ScreenCaptureProtection } = NativeModules;

// Event emitter for iOS screen capture detection
const eventEmitter =
  Platform.OS === "ios" && ScreenCaptureProtection
    ? new NativeEventEmitter(ScreenCaptureProtection)
    : null;

let isBypassed = false;

export const setScreenCaptureBypass = (value) => {
  isBypassed = value;
};

export const enableScreenCaptureProtection = async () => {
  if (isBypassed) {
    return false;
  }
  if (Platform.OS === "android") {
    if (ScreenCaptureProtection) {
      return ScreenCaptureProtection.enableProtection();
    } else {
      await ScreenCapture.preventScreenCaptureAsync();
      return true;
    }
  } else if (Platform.OS === "ios") {
    await ScreenCapture.preventScreenCaptureAsync();
    return true;
  }
  return false;
};

export const disableScreenCaptureProtection = async () => {
  if (isBypassed) {
    if (Platform.OS === "android") {
      if (ScreenCaptureProtection) {
        return ScreenCaptureProtection.disableProtection();
      } else {
        await ScreenCapture.allowScreenCaptureAsync();
        return true;
      }
    } else if (Platform.OS === "ios") {
      await ScreenCapture.allowScreenCaptureAsync();
      return true;
    }
  }
  return false;
};

export const isScreenBeingCaptured = async () => {
  if (Platform.OS === "ios" && ScreenCaptureProtection) {
    return ScreenCaptureProtection.isCaptured();
  }
  return false;
};

export const subscribeToScreenCaptureChange = (callback) => {
  if (Platform.OS === "ios") {
    const subscription = ScreenCapture.addScreenshotListener(() => {
      callback(true);
      setTimeout(() => {
        callback(false);
      }, 3000);
    });
    return () => subscription.remove();
  }

  if (eventEmitter) {
    const subscription = eventEmitter.addListener(
      "onScreenCaptureChange",
      (event) => {
        callback(event.isCaptured);
      },
    );
    return () => subscription.remove();
  }
  return () => {};
};

export default {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
  isScreenBeingCaptured,
  subscribeToScreenCaptureChange,
};
