import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  Image,
  Linking,
  Platform,
} from "react-native";
import {
  Text,
  Button,
  IconButton,
  Surface,
} from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import { theme } from "../styles/theme";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");

const UpdateBottomSheet = () => {
  const [visible, setVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState({
    version: "",
    notes: "Security improvements and bug fixes.",
    size: "2.4 MB",
  });
  const slideAnim = useState(new Animated.Value(WINDOW_HEIGHT))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    checkUpdates();
  }, []);

  const checkUpdates = async () => {
    if (__DEV__) return; // Don't check in dev mode

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setUpdateInfo({
          version: update.manifest?.version || "New Version",
          notes: update.manifest?.extra?.expoClient?.description || "Important performance and security updates.",
          size: "Optimized Update",
        });
        show();
      }
    } catch (e) {
      console.warn("Update check failed:", e);
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

  const handleUpdate = async () => {
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (e) {
      console.error("Update failed:", e);
      // Fallback to store if OTA fails or if we want to redirect
      const storeUrl = Platform.OS === "ios" 
        ? "https://apps.apple.com/app/id6478051744" 
        : "https://play.google.com/store/apps/details?id=com.community_medicine";
      Linking.openURL(storeUrl);
    }
  };

  if (!visible) return null;

  const storeName = Platform.OS === "ios" ? "App Store" : "Google Play";
  const storeIcon = Platform.OS === "ios" ? "apple" : "play-arrow";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
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
        <Surface style={styles.surface} elevation={5}>
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

const styles = StyleSheet.create({
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
    backgroundColor: "#FFFFFF",
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
