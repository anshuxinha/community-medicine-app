import { NativeModules, Platform } from "react-native";
import { getFunctions, httpsCallable } from "firebase/functions";
import { signInWithCustomToken } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { app, auth } from "../config/firebase";
import { getDeviceId } from "../utils/deviceUtils";

const SYNC_FLAG_KEY = "has_synced_restore_credential";
const RestoreCredentials = NativeModules.RestoreCredentials;

const nativeAvailable = () =>
  Platform.OS === "android" &&
  Constants.appOwnership !== "expo" &&
  !!RestoreCredentials;

const functions = () => getFunctions(app, "us-central1");

export async function tryRestoreSignIn() {
  if (!nativeAvailable()) return false;
  if (auth.currentUser) return false;

  try {
    let assertionJson = await RestoreCredentials.consumePendingRestoreAssertion();
    if (!assertionJson) {
      const getOptions = httpsCallable(
        functions(),
        "getRestoreCredentialOptions",
      );
      const { data } = await getOptions({});
      if (!data?.requestJson) return false;
      assertionJson = await RestoreCredentials.getRestoreKey(data.requestJson);
    }
    if (!assertionJson) return false;

    const deviceId = await getDeviceId();
    const complete = httpsCallable(functions(), "completeRestoreSignIn");
    const { data } = await complete({ assertionJson, deviceId });
    if (!data?.customToken) return false;

    await signInWithCustomToken(auth, data.customToken);
    await AsyncStorage.setItem(SYNC_FLAG_KEY, "true");
    return true;
  } catch (error) {
    console.warn("Restore sign-in skipped:", error?.message || error);
    return false;
  }
}

export async function ensureRestoreKey(user) {
  if (!nativeAvailable()) return false;
  if (!user?.uid) return false;

  try {
    const already = await AsyncStorage.getItem(SYNC_FLAG_KEY);
    if (already === "true") return true;

    const createOptions = httpsCallable(
      functions(),
      "createRestoreCredentialOptions",
    );
    const { data } = await createOptions({});
    if (!data?.requestJson) return false;

    const registrationJson = await RestoreCredentials.createRestoreKey(
      data.requestJson,
    );
    if (!registrationJson) return false;

    const register = httpsCallable(functions(), "registerRestoreCredential");
    await register({ registrationJson });
    await AsyncStorage.setItem(SYNC_FLAG_KEY, "true");
    return true;
  } catch (error) {
    console.warn("Restore key create skipped:", error?.message || error);
    return false;
  }
}

export async function clearRestoreKey() {
  if (!nativeAvailable()) {
    try {
      await AsyncStorage.removeItem(SYNC_FLAG_KEY);
    } catch (_) {}
    return false;
  }

  try {
    await RestoreCredentials.clearRestoreKey();
  } catch (error) {
    console.warn("Restore key clear skipped:", error?.message || error);
  }
  try {
    await AsyncStorage.removeItem(SYNC_FLAG_KEY);
  } catch (_) {}
  return true;
}

export async function consumeAppDataRestoredFlag() {
  if (!nativeAvailable()) return false;
  try {
    return Boolean(await RestoreCredentials.consumeAppDataRestoredFlag());
  } catch (_) {
    return false;
  }
}
