import { requireOptionalNativeModule } from "expo-modules-core";

function getSplash() {
  try {
    return requireOptionalNativeModule("ExpoSplashScreen");
  } catch (_) {
    return null;
  }
}

let splashHidden = false;
const splashHiddenListeners = new Set();

export function preventAutoHideSplash() {
  try {
    const splash = getSplash();
    const result = splash?.preventAutoHideAsync?.();
    if (result && typeof result.catch === "function") result.catch(() => {});
  } catch (_) {}
}

export function hideSplash() {
  try {
    const splash = getSplash();
    splash?.hide?.();
    const result = splash?.hideAsync?.();
    if (result && typeof result.catch === "function") result.catch(() => {});
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
