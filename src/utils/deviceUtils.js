import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import * as Device from "expo-device";

const DEVICE_ID_KEY = "deviceId";

// Generate a unique device identifier, persisted in encrypted secure storage
export const getDeviceId = async () => {
  try {
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (!deviceId) {
      // Generate a unique ID based on device info + random
      const randomPart =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      const deviceInfo = Device.modelName || Device.deviceName || "unknown";
      deviceId = `${deviceInfo}-${randomPart}`;

      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error("Error getting device ID:", error);
    // Fallback to a random ID if everything fails
    return `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
};

// Get device information for display
export const getDeviceInfo = async () => {
  try {
    const deviceId = await getDeviceId();

    return {
      deviceId,
      name: Device.deviceName || Device.modelName || getDefaultDeviceName(),
      type: Platform.OS,
      platform: Platform.OS,
      lastActive: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting device info:", error);
    return {
      deviceId: `fallback-${Date.now()}`,
      name: getDefaultDeviceName(),
      type: Platform.OS,
      platform: Platform.OS,
      lastActive: new Date().toISOString(),
    };
  }
};

// Get a default device name based on platform
const getDefaultDeviceName = () => {
  return Platform.OS === "ios" ? "Apple Device" : "Android Device";
};

// Check if this is the first time the device is being used
export const isFirstDeviceLogin = async (userUid) => {
  try {
    const deviceId = await getDeviceId();
    const key = `firstLogin_${userUid}_${deviceId}`;
    const isFirst = await SecureStore.getItemAsync(key);

    if (!isFirst) {
      await SecureStore.setItemAsync(key, "false");
      return true;
    }
    return false;
  } catch {
    return false;
  }
};
