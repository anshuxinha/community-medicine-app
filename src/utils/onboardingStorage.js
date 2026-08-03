import AsyncStorage from "@react-native-async-storage/async-storage";

const onboardingKey = (uid) => `onboardingCompleted:${uid}`;

/**
 * Durable local flag so OTA remounts / sparse Firestore docs never re-prompt
 * after the user finished or skipped onboarding on this device.
 */
export async function getLocalOnboardingCompleted(uid) {
  if (!uid) return false;
  try {
    const flag = await AsyncStorage.getItem(onboardingKey(uid));
    if (flag === "true") return true;

    const storedUser = await AsyncStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.uid === uid && parsed.onboardingCompleted === true) {
        // Heal dedicated key from cached user blob.
        await AsyncStorage.setItem(onboardingKey(uid), "true");
        return true;
      }
    }
  } catch (_) {}
  return false;
}

export async function setLocalOnboardingCompleted(uid) {
  if (!uid) return;
  try {
    await AsyncStorage.setItem(onboardingKey(uid), "true");
  } catch (_) {}
}

/**
 * Cloud true wins; otherwise keep local/device completion so a missing
 * Firestore field cannot wipe a finished onboarding after OTA.
 */
export function resolveOnboardingCompleted(cloudValue, localCompleted) {
  return cloudValue === true || localCompleted === true;
}
