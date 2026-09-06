let SplashScreen = null;
try {
  // Optional: older store binaries may not include this native module.
  SplashScreen = require("expo-splash-screen");
} catch (_) {
  SplashScreen = null;
}

export function preventAutoHideSplash() {
  try {
    SplashScreen?.preventAutoHideAsync?.().catch(() => {});
  } catch (_) {}
}

export function hideSplash() {
  try {
    SplashScreen?.hideAsync?.().catch(() => {});
  } catch (_) {}
}
