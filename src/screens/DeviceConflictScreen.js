import React, { useState, useContext } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Text, Card } from "react-native-paper";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../config/firebase";
import { AppContext } from "../context/AppContext";
import { theme } from "../styles/theme";

const DeviceConflictScreen = () => {
  const { login } = useContext(AppContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { uid, newDeviceId, userData } = route.params || {};
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");

  const conflictDevice = null;

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

  const handleResolve = async () => {
    setResolving(true);
    setError("");
    try {
      await updateDoc(doc(db, "users", uid), { currentDeviceId: newDeviceId });
      await login(userData);
    } catch (err) {
      setError(err.message || "Failed to sign out other device. Try again.");
      setResolving(false);
    }
  };

  const handleCancel = async () => {
    try { await signOut(auth); } catch(e) {}
    navigation.replace("Login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Warning Icon */}
        <View style={styles.iconCircle}>
          <MaterialIcons
            name="devices-other"
            size={48}
            color={theme.colors.accent}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Another Device is Signed In</Text>
        <Text style={styles.subtitle}>
          Your account can only be active on one device at a time. To continue
          on this device, sign out from the other device below.
        </Text>

        {/* Conflicting device card */}
        {conflictDevice && (
          <Card style={styles.deviceCard}>
            <Card.Content style={styles.deviceContent}>
              <View style={styles.deviceIconContainer}>
                <FontAwesome5
                  name={getDeviceIcon(conflictDevice.type)}
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>
                  {conflictDevice.name ||
                    (conflictDevice.type === "ios"
                      ? "Apple Device"
                      : "Android Device")}
                </Text>
                <Text style={styles.deviceMeta}>
                  {conflictDevice.type === "ios" ? "iOS" : "Android"} •{" "}
                  Last active: {formatLastActive(conflictDevice.lastActive)}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Error message */}
        {error ? (
          <View style={styles.errorBanner}>
            <MaterialIcons
              name="error-outline"
              size={16}
              color={theme.colors.error}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Resolve button */}
        <TouchableOpacity
          style={[styles.resolveBtn, resolving && styles.resolveBtnDisabled]}
          onPress={handleResolve}
          disabled={resolving}
          activeOpacity={0.85}
        >
          {resolving ? (
            <ActivityIndicator size="small" color={theme.colors.surfacePrimary} />
          ) : (
            <>
              <MaterialIcons
                name="logout"
                size={20}
                color={theme.colors.surfacePrimary}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.resolveBtnText}>
                Sign Out Other Device
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel button */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancel}
          disabled={resolving}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundMain,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surfacePrimary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.textTitle,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  deviceCard: {
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 14,
    marginBottom: 28,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  deviceContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textTitle,
  },
  deviceMeta: {
    fontSize: 13,
    color: theme.colors.textPlaceholder,
    marginTop: 3,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: theme.colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  resolveBtn: {
    flexDirection: "row",
    backgroundColor: theme.colors.secondary,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    elevation: 4,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  resolveBtnDisabled: {
    opacity: 0.6,
  },
  resolveBtnText: {
    color: theme.colors.surfacePrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  cancelBtn: {
    borderRadius: 14,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  cancelBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
});

export default DeviceConflictScreen;
