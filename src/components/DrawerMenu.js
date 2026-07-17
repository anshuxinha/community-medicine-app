import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { Text, Avatar, Divider, ActivityIndicator } from "react-native-paper";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { AppContext } from "../context/AppContext";
import { theme } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';
import Constants from "expo-constants";

const { width } = Dimensions.get("window");
const isTabletBase = width >= 600;
const DRAWER_WIDTH = isTabletBase ? Math.min(width * 0.4, 320) : width * 0.75;

const BASE_MENU_ITEMS = [
  {
    icon: "person-outline",
    label: "Profile",
    screen: "Profile",
    iconLib: "material",
  },
  { divider: true },
  {
    icon: "star-outline",
    label: "Rate the App",
    action: "rate",
    iconLib: "material",
  },
  {
    icon: "feedback",
    label: "Send Feedback",
    action: "feedback",
    iconLib: "material",
  },
  {
    icon: "privacy-tip",
    label: "Privacy Policy",
    action: "privacy",
    iconLib: "material",
  },
  { divider: true },
  {
    icon: "logout",
    label: "Log Out",
    action: "logout",
    iconLib: "material",
    danger: true,
  },
];

const DrawerMenu = ({ visible, onClose, user }) => {
  const { styles, colors } = useThemedStyles(createStyles);

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const { currentStreak, studyScore, readingProgress, logout } =
    React.useContext(AppContext);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Define displayName early so it's available in handleItem
  const displayName = user?.username || user?.displayName || "STROMA User";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "S";
  const menuItems = React.useMemo(() => {
    if (!user?.isAdmin) {
      return BASE_MENU_ITEMS;
    }

    return [
      ...BASE_MENU_ITEMS.slice(0, 2),
      {
        icon: "fact-check",
        label: "Library Review Queue",
        screen: "AdminLibraryReview",
        iconLib: "material",
      },
      ...BASE_MENU_ITEMS.slice(2),
    ];
  }, [user?.isAdmin]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleItem = async (item) => {
    onClose();
    if (item.screen) {
      setTimeout(() => navigation.navigate(item.screen), 300);
      return;
    }
    // Delay all Alerts by 300ms so the drawer modal fully closes first
    // (Modal unmounting on Android dismisses any Alert that opens during teardown)
    setTimeout(() => {
      switch (item.action) {
        case "rate":
          Linking.openURL("market://details?id=com.communitymed.app");
          break;
        case "feedback":
          Linking.openURL(
            "mailto:anshuxinha@gmail.com?subject=STROMA%20App%20Feedback",
          );
          break;
        case "privacy":
          Linking.openURL("https://community-med-app.web.app/privacy");
          break;
        case "logout":
          Alert.alert("Log Out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Log Out",
              style: "destructive",
              onPress: async () => {
                setIsLoggingOut(true);
                const uid = auth.currentUser?.uid;
                if (uid) {
                  try {
                    await updateDoc(doc(db, "users", uid), { currentDeviceId: null });
                  } catch (_) {}
                }
                try {
                  await signOut(auth);
                  logout();
                  setIsLoggingOut(false);
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  });
                } catch (error) {
                  setIsLoggingOut(false);
                  console.error("Sign out error:", error);
                  Alert.alert("Error", "Failed to log out. Please try again.");
                }
              },
            },
          ]);
          break;
      }
    }, 300);
  };

  if (!visible && slideAnim._value === -DRAWER_WIDTH) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
      >
        {/* Header */}
        <View style={styles.drawerHeader}>
          <Avatar.Text
            size={60}
            label={initials}
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email || ""}
          </Text>
        </View>

        <Divider style={styles.headerDivider} />

        {/* Menu items */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.menuScroll}
        >
          {menuItems.map((item, idx) => {
            if (item.divider)
              return <Divider key={`div-${idx}`} style={styles.divider} />;
            return (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => handleItem(item)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.iconBox, item.danger && styles.iconBoxDanger]}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={20}
                    color={
                      item.danger ? theme.colors.error : theme.colors.secondary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    item.danger && styles.menuLabelDanger,
                  ]}
                >
                  {item.label}
                </Text>
                <MaterialIcons name="chevron-right" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer version */}
        <Text style={styles.version}>
          STROMA v{Constants.expoConfig?.version || "1.0.0"}
        </Text>
      </Animated.View>
      {isLoggingOut && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Logging out...</Text>
        </View>
      )}
    </Modal>
  );
};

const createStyles = (colors) => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.surfacePrimary,
    elevation: 16,
    shadowColor: colors.textTitle,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  drawerHeader: {
    backgroundColor: colors.textPrimary,
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    backgroundColor: colors.secondary,
    marginBottom: 12,
  },
  avatarLabel: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.surfacePrimary,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.surfacePrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textPlaceholder,
  },
  headerDivider: {
    backgroundColor: colors.border,
    height: 1,
  },
  menuScroll: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconBoxDanger: {
    backgroundColor: colors.errorLight,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textTitle,
    fontWeight: "500",
  },
  menuLabelDanger: {
    color: colors.error,
  },
  divider: {
    marginVertical: 6,
    marginHorizontal: 20,
    backgroundColor: colors.surfaceSecondary,
  },
  version: {
    textAlign: "center",
    color: colors.textPlaceholder,
    fontSize: 12,
    paddingVertical: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: colors.surfacePrimary,
  },
});

export default DrawerMenu;
