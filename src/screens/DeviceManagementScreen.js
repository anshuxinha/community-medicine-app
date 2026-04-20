import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Text, Card, Divider, ActivityIndicator } from "react-native-paper";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppContext } from "../context/AppContext";
import { getDeviceId, getDeviceInfo } from "../utils/deviceUtils";
import { db } from "../config/firebase";
import {
  doc,
  getDoc,
  setDoc,
  deleteField,
  serverTimestamp,
} from "firebase/firestore";
import { theme } from "../styles/theme";

const MAX_DEVICES = 2;

const getStoredDeviceInfo = (deviceInfo) => ({
  deviceId: deviceInfo.deviceId,
  name: deviceInfo.name,
  type: deviceInfo.type,
  platform: deviceInfo.platform,
  lastActive: deviceInfo.lastActive || new Date().toISOString(),
});

const markCurrentDevice = (devices, currentDeviceId) =>
  devices.map((device) => ({
    ...device,
    isCurrentDevice: device.deviceId === currentDeviceId,
  }));

const DeviceManagementScreen = () => {
  const { user, registeredDevices } = React.useContext(AppContext);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingDeviceId, setRemovingDeviceId] = useState(null);

  const loadDevices = useCallback(async () => {
    if (!user?.uid) {
      setDevices([]);
      setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const data = userDoc.exists() ? userDoc.data() : {};
      const currentDeviceId = await getDeviceId();
      const currentDeviceInfo = getStoredDeviceInfo(await getDeviceInfo());
      let deviceList = data.devices || registeredDevices || [];

      if (!deviceList.some((device) => device.deviceId === currentDeviceId)) {
        deviceList = [currentDeviceInfo, ...deviceList];

        if (deviceList.length <= MAX_DEVICES) {
          await setDoc(
            doc(db, "users", user.uid),
            {
              devices: deviceList,
              [`deviceStates.${currentDeviceId}`]: data.deviceStates?.[
                currentDeviceId
              ] || {},
              syncedAt: serverTimestamp(),
            },
            { merge: true },
          );
        }
      }

      const displayDevices = markCurrentDevice(deviceList, currentDeviceId);

      // Sort: current device first
      displayDevices.sort((a, b) => {
        if (a.isCurrentDevice) return -1;
        if (b.isCurrentDevice) return 1;
        return 0;
      });

      setDevices(displayDevices);
    } catch (error) {
      console.error("Error loading devices:", error);
      const currentDeviceInfo = getStoredDeviceInfo(await getDeviceInfo());
      setDevices(markCurrentDevice([currentDeviceInfo], currentDeviceInfo.deviceId));
    } finally {
      setLoading(false);
    }
  }, [registeredDevices, user?.uid]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleRemoveDevice = (deviceToRemove) => {
    Alert.alert(
      "Remove Device",
      `Are you sure you want to remove "${deviceToRemove.name}"? This device will need to log in again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeDevice(deviceToRemove),
        },
      ],
    );
  };

  const removeDevice = async (deviceToRemove) => {
    if (!user?.uid) return;

    setRemovingDeviceId(deviceToRemove.deviceId);

    try {
      const remainingDevices = devices
        .filter((d) => d.deviceId !== deviceToRemove.deviceId)
        .map(getStoredDeviceInfo);

      await setDoc(
        doc(db, "users", user.uid),
        {
          devices: remainingDevices,
          [`deviceStates.${deviceToRemove.deviceId}`]: deleteField(),
          [`revokedDeviceIds.${deviceToRemove.deviceId}`]: true,
          syncedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setDevices((prev) =>
        prev.filter((d) => d.deviceId !== deviceToRemove.deviceId),
      );
      Alert.alert("Success", "Device removed successfully.");
    } catch (error) {
      console.error("Error removing device:", error);
      Alert.alert("Error", "Failed to remove device. Please try again.");
    } finally {
      setRemovingDeviceId(null);
    }
  };

  const handleLogoutFromAll = () => {
    Alert.alert(
      "Logout from All Devices",
      "This will remove all devices except your current one. You will need to log in again on all other devices.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout All Others",
          style: "destructive",
          onPress: logoutFromOtherDevices,
        },
      ],
    );
  };

  const logoutFromOtherDevices = async () => {
    if (!user?.uid) return;

    try {
      const currentDeviceId = await getDeviceId();
      const currentDevices = devices.filter(
        (device) => device.deviceId === currentDeviceId,
      );
      const removedDevices = devices.filter(
        (device) => device.deviceId !== currentDeviceId,
      );

      const updates = {
        devices: currentDevices.map(getStoredDeviceInfo),
        syncedAt: serverTimestamp(),
      };

      removedDevices.forEach((device) => {
        updates[`deviceStates.${device.deviceId}`] = deleteField();
        updates[`revokedDeviceIds.${device.deviceId}`] = true;
      });

      await setDoc(doc(db, "users", user.uid), updates, { merge: true });

      setDevices(markCurrentDevice(currentDevices, currentDeviceId));
      Alert.alert("Success", "Logged out from all other devices.");
    } catch (error) {
      console.error("Error logging out from other devices:", error);
      Alert.alert("Error", "Failed to logout from other devices.");
    }
  };

  const getDeviceModelName = () => {
    return Platform.OS === "ios" ? "iPhone/iPad" : "Android Device";
  };

  const getDeviceIcon = (deviceType) => {
    if (deviceType === "ios") return "apple";
    if (deviceType === "android") return "android";
    return "mobile-alt";
  };

  const formatLastActive = (lastActive) => {
    if (!lastActive) return "Unknown";
    try {
      const date = new Date(lastActive);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </View>
    );
  }

  const currentDevice = devices.find((d) => d.isCurrentDevice);
  const otherDevices = devices.filter((d) => !d.isCurrentDevice);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            <MaterialIcons
              name="info-outline"
              size={24}
              color={theme.colors.secondary}
            />
            <Text style={styles.infoText}>
              Your account is limited to {MAX_DEVICES} devices. This helps
              protect your learning progress and account security.
            </Text>
          </Card.Content>
        </Card>

        {/* Current Device Section */}
        <Text style={styles.sectionTitle}>📱 Current Device</Text>
        <Card style={styles.currentDeviceCard}>
          <Card.Content style={styles.deviceContent}>
            <View style={styles.deviceIconContainer}>
              <FontAwesome5
                name={getDeviceIcon(Platform.OS)}
                size={24}
                color={theme.colors.secondary}
              />
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>
                {currentDevice?.name || getDeviceModelName()}
              </Text>
              <Text style={styles.deviceStatus}>Current Device</Text>
            </View>
            <MaterialIcons
              name="check-circle"
              size={24}
              color={theme.colors.chartGreen}
            />
          </Card.Content>
        </Card>

        {/* Other Devices Section */}
        {otherDevices.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              📋 Other Devices ({otherDevices.length})
            </Text>
            <Card style={styles.devicesCard}>
              <Card.Content>
                {otherDevices.map((device, index) => (
                  <View key={device.deviceId}>
                    {index > 0 && <Divider style={styles.deviceDivider} />}
                    <View style={styles.deviceItem}>
                      <View style={styles.deviceIconContainerSmall}>
                        <FontAwesome5
                          name={getDeviceIcon(device.type)}
                          size={18}
                          color={theme.colors.textSecondary}
                        />
                      </View>
                      <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>{device.name}</Text>
                        <Text style={styles.deviceLastActive}>
                          Last active: {formatLastActive(device.lastActive)}
                        </Text>
                      </View>
                      {removingDeviceId === device.deviceId ? (
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.error}
                        />
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleRemoveDevice(device)}
                          style={styles.removeButton}
                        >
                          <MaterialIcons
                            name="close"
                            size={20}
                            color={theme.colors.error}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </Card.Content>
            </Card>
          </>
        )}

        {/* All Devices Summary */}
        <Text style={styles.sectionTitle}>
          🔐 All Devices ({devices.length}/{MAX_DEVICES})
        </Text>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Active Devices</Text>
              <Text style={styles.summaryValue}>{devices.length}</Text>
            </View>
            <Divider style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Maximum Allowed</Text>
              <Text style={styles.summaryValue}>{MAX_DEVICES}</Text>
            </View>
            <Divider style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Available Slots</Text>
              <Text
                style={[
                  styles.summaryValue,
                  devices.length >= MAX_DEVICES && styles.summaryValueFull,
                ]}
              >
                {Math.max(0, MAX_DEVICES - devices.length)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        {otherDevices.length > 0 && (
          <TouchableOpacity
            style={styles.logoutAllButton}
            onPress={handleLogoutFromAll}
          >
            <MaterialIcons name="logout" size={20} color={theme.colors.error} />
            <Text style={styles.logoutAllText}>
              Logout from All Other Devices
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundMain,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.backgroundMain,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: theme.colors.secondaryLight,
    borderRadius: 12,
  },
  infoContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textTitle,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  currentDeviceCard: {
    marginHorizontal: 16,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 12,
  },
  deviceContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  devicesCard: {
    marginHorizontal: 16,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 12,
  },
  summaryCard: {
    marginHorizontal: 16,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 12,
  },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  deviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deviceIconContainerSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.textTitle,
  },
  deviceStatus: {
    fontSize: 13,
    color: theme.colors.chartGreen,
    marginTop: 2,
  },
  deviceLastActive: {
    fontSize: 12,
    color: theme.colors.textPlaceholder,
    marginTop: 2,
  },
  deviceDivider: {
    marginVertical: 8,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textTitle,
  },
  summaryValueFull: {
    color: theme.colors.error,
  },
  summaryDivider: {
    marginVertical: 8,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  removeButton: {
    padding: 8,
  },
  logoutAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    backgroundColor: theme.colors.errorLight,
    borderRadius: 12,
    gap: 8,
  },
  logoutAllText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.error,
  },
  bottomPadding: {
    height: 40,
  },
});

export default DeviceManagementScreen;
