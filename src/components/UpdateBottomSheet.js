import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  Pressable,
  Platform,
  Linking,
  Image,
  NativeModules,
} from "react-native";
import { Button, Surface, IconButton } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { theme } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");

const UpdateBottomSheet = () => {
  const { styles, colors } = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState({
    version: "",
    notes: "Minor bug fixes and app stabilization.",
    size: "Optimized Download",
  });
  const bottomPadding = Math.max(insets.bottom, 24);
  const slideAnim = useState(new Animated.Value(WINDOW_HEIGHT))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Only run update check in production builds
    if (__DEV__) return;

    // Check if the native update module is compiled into the binary.
    // IMPORTANT: Do NOT use a static top-level import for sp-react-native-in-app-updates.
    // That package transitively imports react-native-device-info, which throws a fatal
    // error at module-evaluation time if its native module (RNDeviceInfo) is missing.
    // On binaries older than 1.0.6, those native modules were never compiled in,
    // so a static import crashes the entire JS bundle before React mounts.
    const isNativeUpdateAvailable = !!NativeModules.SpInAppUpdates;

    if (!isNativeUpdateAvailable) {
      // Older binaries (<1.0.6) without the native SDK
      checkStoreUpdates();
      return;
    }

    try {
      // Dynamic require — only evaluated when the native module exists
      const SpInAppUpdates = require("sp-react-native-in-app-updates").default;
      // Public export is IAUUpdateKind (not AndroidUpdateType)
      const { IAUUpdateKind } = require("sp-react-native-in-app-updates");
      const inAppUpdates = new SpInAppUpdates(false);

      inAppUpdates
        .checkNeedsUpdate()
        .then((result) => {
          if (result.shouldUpdate) {
            return inAppUpdates
              .startUpdate({
                updateType: IAUUpdateKind.IMMEDIATE,
              })
              .catch((err) => {
                console.warn("Native startUpdate failed, falling back:", err);
                return checkStoreUpdates();
              });
          }
          // Play says no update (rollout/cache/track) — still check Firestore
          // so users on 1.0.6+ see the custom sheet when config/app is newer.
          return checkStoreUpdates();
        })
        .catch((err) => {
          console.warn("Native in-app update check failed:", err);
          checkStoreUpdates();
        });
    } catch (e) {
      console.warn("SpInAppUpdates initialization failed, falling back:", e);
      checkStoreUpdates();
    }
  }, []);

  const isVersionLower = (current, latest) => {
    if (!current || !latest) return false;
    const curr = current.split(".").map(Number);
    const last = latest.split(".").map(Number);
    for (let i = 0; i < Math.max(curr.length, last.length); i++) {
      const v1 = curr[i] || 0;
      const v2 = last[i] || 0;
      if (v1 < v2) return true;
      if (v1 > v2) return false;
    }
    return false;
  };

  const checkStoreUpdates = async () => {
    try {
      // Check Firestore config/app for the latest version in the store
      const configRef = doc(db, "config", "app");
      const configSnap = await getDoc(configRef);

      if (configSnap.exists()) {
        const data = configSnap.data();
        const latestVersion = Platform.OS === "ios"
          ? data.latest_ios_version
          : data.latest_android_version;

        const latestBuild = Platform.OS === "ios"
          ? parseInt(data.latest_ios_build || "0", 10)
          : parseInt(data.latest_android_build || "0", 10);

        // Prefer native binary version over expoConfig (OTA can rewrite expoConfig)
        const currentVersion =
          Constants.nativeAppVersion || Constants.expoConfig?.version || "1.0.0";
        const currentBuild = parseInt(
          Constants.nativeBuildVersion ||
            (Platform.OS === "ios"
              ? Constants.expoConfig?.ios?.buildNumber
              : Constants.expoConfig?.android?.versionCode) ||
            "0",
          10,
        );

        // Show popup if version is lower OR same version but lower build number
        const needsUpdate = isVersionLower(currentVersion, latestVersion) ||
          (currentVersion === latestVersion && currentBuild < latestBuild);

        if (needsUpdate) {
          setUpdateInfo({
            version: latestVersion || "New Version",
            notes: "Minor bug fixes and app stabilization.",
            size: data.update_size || "Optimized Download",
          });
          show();
        }
      }
    } catch (e) {
      console.warn("Store update check failed:", e);
    }
  };

  const show = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hide = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: WINDOW_HEIGHT,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  };

  const handleUpdate = () => {
    const storeUrl = Platform.OS === "ios"
      ? "https://apps.apple.com/app/id6478051744"
      : "https://play.google.com/store/apps/details?id=com.communitymed.app";
    Linking.openURL(storeUrl);
  };

  if (!visible) return null;

  const storeName = Platform.OS === "ios" ? "App Store" : "Google Play";
  const storeIcon = Platform.OS === "ios" ? "apple" : "play-arrow";

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: opacityAnim }]}
        pointerEvents="auto"
      >
        <Pressable style={flex1} onPress={hide} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <Surface style={[styles.surface, { paddingBottom: bottomPadding }]} elevation={5}>
          <View style={styles.header}>
            <View style={styles.storeHeader}>
              <MaterialIcons
                name={storeIcon}
                size={18}
                color={Platform.OS === "android" ? "#34A853" : "#007AFF"}
              />
              <Text style={styles.storeText}>{storeName}</Text>
            </View>
            <IconButton
              icon="close"
              size={20}
              onPress={hide}
              style={styles.closeBtn}
            />
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>Update available</Text>
            <Text style={styles.subtitle}>
              To use this app, download the latest version.
            </Text>

            <View style={styles.appRow}>
              <View style={styles.appIconContainer}>
                <Image
                  source={require("../../assets/icon.png")}
                  style={styles.appIcon}
                />
              </View>
              <View style={styles.appInfo}>
                <Text style={styles.appName}>STROMA</Text>
                <Text style={styles.appMeta}>Everyone  •  {updateInfo.size}</Text>
              </View>
            </View>

            <View style={styles.whatsNew}>
              <View style={styles.whatsNewHeader}>
                <Text style={styles.whatsNewTitle}>What's new</Text>
                <MaterialIcons name="keyboard-arrow-down" size={24} color={theme.colors.textSecondary} />
              </View>
              <Text style={styles.whatsNewText}>
                {updateInfo.notes}
              </Text>
            </View>

            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={() => Linking.openURL("https://communitymedicineapp.com")}
                style={styles.btnSecondary}
                labelStyle={styles.btnLabelSecondary}
              >
                More info
              </Button>
              <Button
                mode="contained"
                onPress={handleUpdate}
                style={styles.btnPrimary}
                labelStyle={styles.btnLabelPrimary}
                buttonColor={Platform.OS === "android" ? "#01875f" : "#007AFF"}
              >
                Update
              </Button>
            </View>
          </View>
        </Surface>
      </Animated.View>
    </View>
  );
};

const flex1 = { flex: 1 };

const createStyles = (colors) => StyleSheet.create({
  container: {
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
  },
  surface: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.surfacePrimary,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  storeText: {
    fontSize: 14,
    color: "#5F6368",
    fontWeight: "500",
  },
  closeBtn: {
    margin: 0,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "500",
    color: "#202124",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#5F6368",
    marginBottom: 20,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  appIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#f1f3f4",
    overflow: "hidden",
  },
  appIcon: {
    width: "100%",
    height: "100%",
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#202124",
  },
  appMeta: {
    fontSize: 12,
    color: "#5F6368",
    marginTop: 2,
  },
  whatsNew: {
    marginBottom: 32,
  },
  whatsNewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  whatsNewTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#202124",
  },
  whatsNewText: {
    fontSize: 14,
    color: "#5F6368",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  btnPrimary: {
    borderRadius: 20,
    minWidth: 100,
  },
  btnSecondary: {
    borderRadius: 20,
    borderColor: "#DADCE0",
  },
  btnLabelPrimary: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "none",
  },
  btnLabelSecondary: {
    fontSize: 14,
    fontWeight: "500",
    color: "#01875f",
    textTransform: "none",
  },
});

export default UpdateBottomSheet;
