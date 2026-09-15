import { Alert, InteractionManager, Linking, NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { onSplashHidden } from "./appSplash";

export const STORE_PROMPT_DISMISS_KEY = "stromaStoreUpdateDismissVersion";
export const PLAY_UPDATE_AVAILABLE = 2;
export const IOS_BUNDLE_ID = "com.communitymed.app";
export const ITUNES_LOOKUP_URL = `https://itunes.apple.com/lookup?bundleId=${IOS_BUNDLE_ID}`;
export const IOS_STORE_URL = "https://apps.apple.com/app/id6767763106";
export const ANDROID_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.communitymed.app";

export function isVersionLower(current, latest) {
  if (!current || !latest) return false;
  const curr = String(current).split(".").map(Number);
  const last = String(latest).split(".").map(Number);
  for (let i = 0; i < Math.max(curr.length, last.length); i++) {
    const v1 = curr[i] || 0;
    const v2 = last[i] || 0;
    if (v1 < v2) return true;
    if (v1 > v2) return false;
  }
  return false;
}

export function needsStoreUpdate(
  currentVersion,
  latestVersion,
  currentBuild = 0,
  latestBuild = 0,
) {
  if (isVersionLower(currentVersion, latestVersion)) return true;
  if (
    currentVersion === latestVersion &&
    Number(currentBuild) < Number(latestBuild)
  ) {
    return true;
  }
  return false;
}

export function shouldShowStorePrompt(dismissedVersion, latestVersion) {
  if (!latestVersion) return false;
  if (dismissedVersion && String(dismissedVersion) === String(latestVersion)) {
    return false;
  }
  return true;
}

export function parseITunesLookup(payload) {
  const result = payload?.results?.[0];
  if (!result || typeof result !== "object") return null;
  const version =
    typeof result.version === "string" && result.version
      ? result.version
      : null;
  if (!version) return null;
  const trackViewUrl =
    typeof result.trackViewUrl === "string" && result.trackViewUrl
      ? result.trackViewUrl
      : null;
  return { version, trackViewUrl };
}

export function isPlayUpdateAvailable(result) {
  if (!result) return false;
  if (result.other?.updateAvailability === PLAY_UPDATE_AVAILABLE) return true;
  return result.shouldUpdate === true;
}

export function readNativeVersion(constants, platform) {
  const currentVersion =
    constants?.nativeAppVersion || constants?.expoConfig?.version || "1.0.0";
  const currentBuild = parseInt(
    constants?.nativeBuildVersion ||
      (platform === "ios"
        ? constants?.expoConfig?.ios?.buildNumber
        : constants?.expoConfig?.android?.versionCode) ||
      "0",
    10,
  );
  return { currentVersion, currentBuild };
}

export function hasPlayInAppUpdateModule(nativeModules = NativeModules) {
  return !!nativeModules?.SpInAppUpdates;
}

export async function markStorePromptDismissed(latestVersion) {
  if (!latestVersion) return;
  try {
    await AsyncStorage.setItem(
      STORE_PROMPT_DISMISS_KEY,
      String(latestVersion),
    );
  } catch (error) {
    console.warn("Store prompt dismiss failed:", error?.message);
  }
}

function showNativeStoreAlert(storeUrl, latestVersion, storeName) {
  Alert.alert(
    "Update available",
    `A new version of STROMA is ready on the ${storeName}.`,
    [
      {
        text: "Later",
        style: "cancel",
        onPress: () => {
          void markStorePromptDismissed(latestVersion);
        },
      },
      {
        text: "Update",
        onPress: () => {
          Linking.openURL(storeUrl).catch((error) =>
            console.warn("Store URL failed:", error?.message),
          );
        },
      },
    ],
    {
      cancelable: true,
      onDismiss: () => {
        void markStorePromptDismissed(latestVersion);
      },
    },
  );
}

async function readFirestoreAppConfig() {
  try {
    const { db } = require("../config/firebase");
    const { doc, getDoc } = require("firebase/firestore");
    const snap = await getDoc(doc(db, "config", "app"));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.warn("Store config read failed:", error?.message);
    return null;
  }
}

async function promptFromFirestore(platform) {
  const data = await readFirestoreAppConfig();
  if (!data) return;
  const latestVersion =
    platform === "ios" ? data.latest_ios_version : data.latest_android_version;
  const latestBuild = parseInt(
    (platform === "ios"
      ? data.latest_ios_build
      : data.latest_android_build) || "0",
    10,
  );
  const { currentVersion, currentBuild } = readNativeVersion(
    Constants,
    platform,
  );
  if (
    !needsStoreUpdate(currentVersion, latestVersion, currentBuild, latestBuild)
  ) {
    return;
  }
  const dismissed = await AsyncStorage.getItem(STORE_PROMPT_DISMISS_KEY);
  if (!shouldShowStorePrompt(dismissed, latestVersion)) return;
  const storeUrl = platform === "ios" ? IOS_STORE_URL : ANDROID_STORE_URL;
  const storeName = platform === "ios" ? "App Store" : "Google Play";
  showNativeStoreAlert(storeUrl, latestVersion, storeName);
}

async function promptPlayFlexibleUpdate() {
  const SpInAppUpdates = require("sp-react-native-in-app-updates").default;
  const {
    IAUUpdateKind,
    IAUInstallStatus,
  } = require("sp-react-native-in-app-updates");
  const inAppUpdates = new SpInAppUpdates(false);
  const result = await inAppUpdates.checkNeedsUpdate({
    customVersionComparator: () => 1,
  });
  if (!isPlayUpdateAvailable(result)) return "unavailable";
  if (result?.other?.isFlexibleUpdateAllowed === false) return "failed";

  const onStatus = (event) => {
    if (event?.status === IAUInstallStatus.DOWNLOADED) {
      inAppUpdates.removeStatusUpdateListener(onStatus);
      inAppUpdates.installUpdate();
    }
  };
  inAppUpdates.addStatusUpdateListener(onStatus);
  try {
    await inAppUpdates.startUpdate({
      updateType: IAUUpdateKind.FLEXIBLE,
    });
    return "prompted";
  } catch (error) {
    inAppUpdates.removeStatusUpdateListener(onStatus);
    throw error;
  }
}

async function promptIosStoreAlert() {
  let latestVersion = null;
  let storeUrl = IOS_STORE_URL;
  try {
    const response = await fetch(ITUNES_LOOKUP_URL);
    const payload = await response.json();
    const parsed = parseITunesLookup(payload);
    if (parsed?.version) {
      latestVersion = parsed.version;
      if (parsed.trackViewUrl) storeUrl = parsed.trackViewUrl;
    }
  } catch (error) {
    console.warn("iTunes lookup failed:", error?.message);
  }

  if (!latestVersion) {
    await promptFromFirestore("ios");
    return;
  }

  const { currentVersion } = readNativeVersion(Constants, "ios");
  if (!needsStoreUpdate(currentVersion, latestVersion, 0, 0)) return;
  const dismissed = await AsyncStorage.getItem(STORE_PROMPT_DISMISS_KEY);
  if (!shouldShowStorePrompt(dismissed, latestVersion)) return;
  showNativeStoreAlert(storeUrl, latestVersion, "App Store");
}

export async function promptIfStoreUpdateAvailable() {
  try {
    if (Platform.OS === "android") {
      if (hasPlayInAppUpdateModule()) {
        try {
          const outcome = await promptPlayFlexibleUpdate();
          if (outcome === "unavailable" || outcome === "prompted") return;
        } catch (error) {
          console.warn("Play in-app update failed:", error?.message);
        }
      }
      await promptFromFirestore("android");
      return;
    }
    if (Platform.OS === "ios") {
      await promptIosStoreAlert();
    }
  } catch (error) {
    console.warn("Store update check failed:", error?.message);
  }
}

/**
 * After splash, show Play flexible UI or a native Alert. Never Play immediate.
 * Never on first paint.
 */
export function startStoreUpdateChecks() {
  if (__DEV__) return () => {};

  let cancelled = false;
  let interactionHandle = null;

  const unsubscribe = onSplashHidden(() => {
    interactionHandle = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      void promptIfStoreUpdateAvailable();
    });
  });

  return () => {
    cancelled = true;
    unsubscribe();
    interactionHandle?.cancel?.();
  };
}
