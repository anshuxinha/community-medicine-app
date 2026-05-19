import { NativeModules, Platform, NativeEventEmitter } from "react-native";

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
  if (Platform.OS === "android" && ScreenCaptureProtection) {
    return ScreenCaptureProtection.enableProtection();
  }
  return false;
};

export const disableScreenCaptureProtection = async () => {
  if (Platform.OS === "android" && ScreenCaptureProtection) {
    return ScreenCaptureProtection.disableProtection();
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
