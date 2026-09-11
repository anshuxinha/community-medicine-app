let SplashScreen = null;
try {
  // Optional: older store binaries may not include this native module.
  SplashScreen = require("expo-splash-screen");
} catch (_) {
  SplashScreen = null;
}

let splashHidden = false;
const splashHiddenListeners = new Set();

export function preventAutoHideSplash() {
  try {
    SplashScreen?.preventAutoHideAsync?.().catch(() => {});
  } catch (_) {}
}

export function hideSplash() {
  try {
    SplashScreen?.hideAsync?.().catch(() => {});
  } catch (_) {}
  if (splashHidden) return;
  splashHidden = true;
  splashHiddenListeners.forEach((listener) => {
    try {
      listener();
    } catch (_) {}
  });
  splashHiddenListeners.clear();
}

/** Fires once, including immediately if splash already hid. */
export function onSplashHidden(listener) {
  if (splashHidden) {
    listener();
    return () => {};
  }
  splashHiddenListeners.add(listener);
  return () => splashHiddenListeners.delete(listener);
}
