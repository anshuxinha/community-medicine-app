import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
  Modal,
  Platform,
  Clipboard,
} from "react-native";
import {
  Text,
  Avatar,
  Card,
  Divider,
  ActivityIndicator,
  TextInput,
  Button,
} from "react-native-paper";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { signOut, deleteUser } from "firebase/auth";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { AppContext } from "../context/AppContext";
import { useThemedStyles } from "../styles/useThemedStyles";
import { useAppTheme } from "../styles/ThemeContext";
import Constants from "expo-constants";
import {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
} from "../utils/screenCaptureProtection";
import { resetReviewPromptState } from "../utils/reviewPrompt";

const APPEARANCE_OPTIONS = [
  { value: "light", label: "Light", icon: "wb-sunny" },
  { value: "dark", label: "Dark", icon: "nights-stay" },
  { value: "system", label: "System", icon: "settings-brightness" },
];

const IOS_STORE_URL = "https://apps.apple.com/app/id6478051744";
const ANDROID_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.communitymed.app";
const ANDROID_MARKET_URL = "market://details?id=com.communitymed.app";

const ProfileScreen = () => {
  const { styles, colors } = useThemedStyles(createStyles);
  const { preference, setPreference } = useAppTheme();

  const navigation = useNavigation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const {
    user,
    isPremium,
    premiumType,
    subscriptionExpiry,
    currentStreak,
    studyScore,
    readingProgress,
    bookmarks,
    readItems,
    logout,
    updateUsername,
  } = React.useContext(AppContext);

  const roleLabel = (() => {
    if (user?.learnerRole === "md_resident") return "MD resident";
    if (user?.learnerRole === "faculty") return "Faculty";
    if (user?.learnerRole === "ug") return "UG / Intern";
    if (user?.learnerRole === "other") return "Other";
    return "Not set";
  })();

  const paperFocusLabel = (() => {
    const f = user?.preferredPaperFocus;
    if (!f || f === "all") return "All papers";
    return `Paper ${f}`;
  })();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const displayName = user?.username || user?.displayName || "STROMA User";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "S";

  const handleStartEditName = () => {
    setNewName(displayName);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    setIsSavingName(true);
    try {
      await updateUsername(newName.trim());
      setIsEditingName(false);
      Alert.alert("Success", "Name updated successfully!");
    } catch (error) {
      console.error("Failed to update name:", error);
      Alert.alert("Error", "Failed to update name. Please try again.");
    } finally {
      setIsSavingName(false);
    }
  };

  useEffect(() => {
    enableScreenCaptureProtection();
    return () => {
      disableScreenCaptureProtection();
    };
  }, []);

  const getSubscriptionExpiryDisplay = () => {
    if (premiumType === "lifetime") {
      return "Lifetime";
    }

    if (subscriptionExpiry) {
      const expiryDate = new Date(subscriptionExpiry);
      if (!Number.isNaN(expiryDate.getTime())) {
        const now = new Date();
        const diffMs = expiryDate - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          return "Expired";
        }
        if (diffDays < 30) {
          return `${diffDays} day${diffDays !== 1 ? "s" : ""} left`;
        }
        const months = Math.ceil(diffDays / 30);
        return `${months} month${months !== 1 ? "s" : ""} left`;
      }
    }

    if (isPremium) {
      return "Lifetime";
    }

    return "Not active";
  };

  const handleShareReferral = async () => {
    if (!user?.referralCode) {
      Alert.alert(
        "Error",
        "Your referral code is not ready yet. Please try again.",
      );
      return;
    }

    try {
      await Share.share({
        message: `Hey! I'm using STROMA to prep for Community Medicine. Join me using my referral code ${user.referralCode} to get Yearly STROMA Membership for just ₹999 (instead of ₹1,200)! 📚✨\n\nDownload now:\nAndroid: https://bit.ly/stromaapp\niOS: https://apple.co/4oaVlLi`,
      });
    } catch (error) {
      console.warn("Failed to share referral code:", error.message);
    }
  };

  const handleCopyReferral = () => {
    if (!user?.referralCode) {
      Alert.alert(
        "Error",
        "Your referral code is not ready yet. Please try again.",
      );
      return;
    }
    try {
      Clipboard.setString(user.referralCode);
      Alert.alert("Copied", "Referral code copied to clipboard.");
    } catch (error) {
      console.warn("Failed to copy referral code:", error?.message);
      Alert.alert("Error", "Could not copy code. Try Share instead.");
    }
  };

  const handleLogout = () => {
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
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone and you will lose all your progress, bookmarks, and premium status.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
              const uid = currentUser.uid;
              try {
                try {
                  await deleteDoc(doc(db, "users", uid));
                } catch (e) {
                  console.error("Error deleting user document:", e);
                }

                await deleteUser(currentUser);
                logout();

                Alert.alert(
                  "Account Deleted",
                  "Your account has been successfully deleted.",
                );

                navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                });
              } catch (error) {
                if (error.code === "auth/requires-recent-login") {
                  Alert.alert(
                    "Re-authentication Required",
                    "For security reasons, please log out and log back in before deleting your account.",
                  );
                } else {
                  Alert.alert(
                    "Error",
                    error.message ||
                      "Failed to delete account. Please try again.",
                  );
                }
              }
            }
          },
        },
      ],
    );
  };

  const handleRateApp = async () => {
    const primary =
      Platform.OS === "ios" ? IOS_STORE_URL : ANDROID_MARKET_URL;
    const fallback =
      Platform.OS === "ios" ? IOS_STORE_URL : ANDROID_STORE_URL;
    try {
      const canOpen = await Linking.canOpenURL(primary);
      await Linking.openURL(canOpen ? primary : fallback);
    } catch (_) {
      Linking.openURL(fallback);
    }
  };

  const handleOpenSupport = () => {
    navigation.navigate("Support");
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL("https://community-med-app.web.app/privacy");
  };

  const handleUpgradePremium = () => {
    navigation.navigate("Paywall");
  };

  const handleOpenAdminQueue = () => {
    navigation.navigate("AdminLibraryReview");
  };

  const handleOpenAdminFeedback = () => {
    navigation.navigate("AdminAppFeedback");
  };

  const handleResetReviewCta = () => {
    Alert.alert(
      "Reset review CTA?",
      "Clears the local 5-star review flags on this device so the Review Request can show again. Does not remove Play Store reviews.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            try {
              await resetReviewPromptState(user?.uid);
              Alert.alert(
                "Reset done",
                "Force-close and reopen the app to see the Review Request again on this device.",
              );
            } catch (err) {
              Alert.alert(
                "Reset failed",
                err?.message || "Could not clear review flags.",
              );
            }
          },
        },
      ],
    );
  };

  const navigateToBookmarks = () => navigation.navigate("Bookmarks");
  const navigateToLibrary = () =>
    navigation.navigate("MainTabs", { screen: "Library" });
  const navigateToDashboard = () =>
    navigation.navigate("MainTabs", { screen: "Dashboard" });

  const articlesRead = readItems?.length || 0;
  const bookmarksCount = bookmarks?.length || 0;
  const progressPercent = Math.round((readingProgress || 0) * 100);

  const progressStats = [
    {
      key: "streak",
      icon: "local-fire-department",
      color: colors.accent,
      value: currentStreak,
      label: "Day Streak",
      onPress: navigateToDashboard,
      a11y: "Day streak, open dashboard",
    },
    {
      key: "score",
      icon: "stars",
      color: colors.secondary,
      value: studyScore,
      label: "Stroma Score",
      onPress: navigateToDashboard,
      a11y: "Stroma score, open dashboard",
    },
    {
      key: "progress",
      icon: "trending-up",
      color: colors.chartGreen,
      value: `${progressPercent}%`,
      label: "Progress",
      onPress: navigateToLibrary,
      a11y: "Reading progress, open library",
    },
    {
      key: "chapters",
      icon: "menu-book",
      color: colors.chartBlue,
      value: articlesRead,
      label: "Chapters",
      onPress: navigateToLibrary,
      a11y: "Chapters read, open library",
    },
    {
      key: "bookmarks",
      icon: "bookmark",
      color: colors.chartPurple,
      value: bookmarksCount,
      label: "Bookmarks",
      onPress: navigateToBookmarks,
      a11y: "Bookmarks, open bookmarks list",
    },
  ];

  const ActionRow = ({ icon, label, onPress, isLast }) => (
    <>
      <TouchableOpacity
        style={styles.actionItem}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.actionIconBox}>
          <MaterialIcons name={icon} size={20} color={colors.secondary} />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={colors.textPlaceholder}
        />
      </TouchableOpacity>
      {!isLast ? <Divider style={styles.actionDivider} /> : null}
    </>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity */}
        <View style={styles.identityCard}>
          <Avatar.Text
            size={72}
            label={initials}
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
          <View style={styles.identityText}>
            <TouchableOpacity
              style={styles.nameRow}
              onPress={handleStartEditName}
              accessibilityRole="button"
              accessibilityLabel="Edit display name"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.userName} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={styles.editButton}>
                <MaterialIcons name="edit" size={16} color={colors.secondary} />
              </View>
            </TouchableOpacity>
            {user?.email ? (
              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
              </Text>
            ) : null}
            <Text style={styles.accountTypeHint}>
              {user ? "Registered account" : "Guest account"}
            </Text>
          </View>
        </View>

        {/* Learning profile */}
        <Text style={styles.sectionTitle}>Learning profile</Text>
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.expiryRow}>
              <Text style={styles.expiryLabel}>Role</Text>
              <Text style={styles.expiryValue}>{roleLabel}</Text>
            </View>
            <View style={styles.expiryRow}>
              <Text style={styles.expiryLabel}>Paper focus</Text>
              <Text style={styles.expiryValue}>{paperFocusLabel}</Text>
            </View>
            <View style={styles.expiryRow}>
              <Text style={styles.expiryLabel}>Training year</Text>
              <Text style={styles.expiryValue}>
                {user?.trainingYear ? `Year ${user.trainingYear}` : "Not set"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.upgradeButton, { marginTop: 8 }]}
              onPress={() =>
                navigation.navigate("Onboarding", { edit: true })
              }
              accessibilityRole="button"
              accessibilityLabel="Edit learning profile"
            >
              <Text style={styles.upgradeButtonText}>Edit learning profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 12, alignItems: "center" }}
              onPress={() => navigation.navigate("LearningProgress")}
              accessibilityRole="button"
            >
              <Text style={{ color: colors.secondary, fontWeight: "700" }}>
                Open learning progress
              </Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Membership */}
        <Text style={styles.sectionTitle}>Membership</Text>
        <Card style={styles.card} mode="elevated">
          <Card.Content style={styles.membershipContent}>
            <View style={styles.membershipTop}>
              <View
                style={[
                  styles.premiumBadge,
                  isPremium ? styles.premiumActive : styles.premiumInactive,
                ]}
              >
                <FontAwesome5
                  name="crown"
                  size={16}
                  color={isPremium ? "#EAB308" : colors.textPlaceholder}
                />
              </View>
              <View style={styles.membershipText}>
                <Text style={styles.membershipTitle}>
                  {isPremium ? "STROMA Member" : "Free Account"}
                </Text>
                <Text style={styles.membershipSubtitle}>
                  {isPremium
                    ? "Enjoying all membership features"
                    : "Unlock all features with membership"}
                </Text>
              </View>
            </View>

            <View style={styles.expiryRow}>
              <Text style={styles.expiryLabel}>Status</Text>
              <Text style={styles.expiryValue}>
                {getSubscriptionExpiryDisplay()}
              </Text>
            </View>

            {!isPremium ? (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgradePremium}
                accessibilityRole="button"
                accessibilityLabel="Get membership"
              >
                <Text style={styles.upgradeButtonText}>Get Membership</Text>
              </TouchableOpacity>
            ) : null}
          </Card.Content>
        </Card>

        {/* Progress at a glance (merged stats + activity) */}
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <Card style={styles.card} mode="elevated">
          <Card.Content style={styles.progressContent}>
            <View style={styles.progressRow}>
              {progressStats.slice(0, 3).map((stat, index) => (
                <TouchableOpacity
                  key={stat.key}
                  style={[
                    styles.progressCell,
                    index < 2 && styles.progressCellBorderRight,
                  ]}
                  onPress={stat.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={stat.a11y}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name={stat.icon} size={22} color={stat.color} />
                  <Text style={styles.progressValue}>{stat.value}</Text>
                  <Text style={styles.progressLabel}>{stat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.progressRowDivider} />
            <View style={styles.progressRow}>
              {progressStats.slice(3).map((stat, index) => (
                <TouchableOpacity
                  key={stat.key}
                  style={[
                    styles.progressCellWide,
                    index === 0 && styles.progressCellBorderRight,
                  ]}
                  onPress={stat.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={stat.a11y}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name={stat.icon} size={22} color={stat.color} />
                  <Text style={styles.progressValue}>{stat.value}</Text>
                  <Text style={styles.progressLabel}>{stat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Refer & Earn — premium members only */}
        {isPremium ? (
          <>
            <Text style={styles.sectionTitle}>Refer & Earn</Text>
            <Card style={styles.card} mode="elevated">
              <Card.Content>
                <Text style={styles.referralSubtitle}>
                  Give friends Yearly STROMA for ₹999 and get 30 days free when
                  they join with your code.
                </Text>

                <View style={styles.referralCodeBox}>
                  <View style={styles.codeContainer}>
                    <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
                    <Text style={styles.codeText}>
                      {user?.referralCode || "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={styles.referralActions}>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={handleCopyReferral}
                    accessibilityRole="button"
                    accessibilityLabel="Copy referral code"
                  >
                    <MaterialIcons
                      name="content-copy"
                      size={18}
                      color={colors.secondary}
                    />
                    <Text style={styles.copyButtonText}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShareReferral}
                    accessibilityRole="button"
                    accessibilityLabel="Share referral code"
                  >
                    <MaterialIcons
                      name="share"
                      size={18}
                      color={colors.buttonText}
                    />
                    <Text style={styles.shareButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          </>
        ) : null}

        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Card style={styles.card} mode="elevated">
          <Card.Content style={styles.actionsContent}>
            <Text style={styles.appearanceIntro}>
              Light, Dark, or match your device setting.
            </Text>
            <View style={styles.appearanceRow}>
              {APPEARANCE_OPTIONS.map((opt) => {
                const selected = preference === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.appearanceOption,
                      selected && styles.appearanceOptionSelected,
                    ]}
                    onPress={() => setPreference(opt.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${opt.label} appearance`}
                  >
                    <MaterialIcons
                      name={opt.icon}
                      size={20}
                      color={
                        selected ? colors.secondary : colors.textTertiary
                      }
                    />
                    <Text
                      style={[
                        styles.appearanceOptionLabel,
                        selected && styles.appearanceOptionLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* Support */}
        <Text style={styles.sectionTitle}>Support</Text>
        <Card style={styles.card} mode="elevated">
          <Card.Content style={styles.actionsContent}>
            <ActionRow
              icon="star-outline"
              label="Rate the App"
              onPress={handleRateApp}
            />
            <ActionRow
              icon="support-agent"
              label="Support"
              onPress={handleOpenSupport}
            />
            <ActionRow
              icon="privacy-tip"
              label="Privacy Policy"
              onPress={handlePrivacyPolicy}
              isLast={!user?.isAdmin}
            />
            {user?.isAdmin ? (
              <>
                <ActionRow
                  icon="fact-check"
                  label="Library Review Queue"
                  onPress={handleOpenAdminQueue}
                />
                <ActionRow
                  icon="inbox"
                  label="Feedback & Requests"
                  onPress={handleOpenAdminFeedback}
                />
                <ActionRow
                  icon="refresh"
                  label="Reset Review CTA (this device)"
                  onPress={handleResetReviewCta}
                  isLast
                />
              </>
            ) : null}
          </Card.Content>
        </Card>

        {/* Account actions */}
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          disabled={isLoggingOut}
        >
          <MaterialIcons name="logout" size={20} color={colors.textSecondary} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={handleDeleteAccount}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
        >
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>

        <Text style={styles.version}>
          STROMA v{Constants.expoConfig?.version || "1.0.0"}
        </Text>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={isEditingName}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingName(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput
              mode="outlined"
              label="Name"
              value={newName}
              onChangeText={setNewName}
              style={styles.modalInput}
              outlineStyle={{ borderRadius: 10 }}
              activeOutlineColor={colors.secondary}
              textColor={colors.inputText}
            />
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setIsEditingName(false)}
                style={styles.modalButton}
                textColor={colors.textSecondary}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveName}
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.secondary },
                ]}
                loading={isSavingName}
                disabled={isSavingName || !newName.trim()}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {isLoggingOut ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.loadingText}>Logging out...</Text>
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundMain,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 16,
    },
    identityCard: {
      marginHorizontal: 16,
      padding: 20,
      borderRadius: 16,
      backgroundColor: colors.surfacePrimary,
      flexDirection: "row",
      alignItems: "center",
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    avatar: {
      backgroundColor: colors.secondary,
    },
    avatarLabel: {
      fontSize: 26,
      fontWeight: "bold",
      color: colors.onPrimary,
    },
    identityText: {
      flex: 1,
      marginLeft: 16,
      minWidth: 0,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    userName: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textTitle,
      flexShrink: 1,
    },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    userEmail: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    accountTypeHint: {
      fontSize: 12,
      color: colors.textPlaceholder,
      marginTop: 4,
      fontWeight: "500",
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textTertiary,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      marginHorizontal: 20,
      marginTop: 22,
      marginBottom: 10,
    },
    card: {
      marginHorizontal: 16,
      backgroundColor: colors.surfacePrimary,
      borderRadius: 16,
      elevation: 2,
    },
    membershipContent: {
      paddingVertical: 4,
    },
    membershipTop: {
      flexDirection: "row",
      alignItems: "center",
    },
    premiumBadge: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    premiumActive: {
      backgroundColor: colors.warningBackground,
    },
    premiumInactive: {
      backgroundColor: colors.surfaceSecondary,
    },
    membershipText: {
      flex: 1,
    },
    membershipTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textTitle,
    },
    membershipSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    expiryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    expiryLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    expiryValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textTitle,
    },
    upgradeButton: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 14,
      alignItems: "center",
    },
    upgradeButtonText: {
      color: colors.buttonText,
      fontWeight: "600",
      fontSize: 14,
    },
    progressContent: {
      paddingVertical: 4,
      paddingHorizontal: 0,
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "stretch",
    },
    progressRowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    progressCell: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 4,
    },
    progressCellWide: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 4,
    },
    progressCellBorderRight: {
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.border,
    },
    progressValue: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textTitle,
      marginTop: 6,
    },
    progressLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: "center",
    },
    referralSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 14,
      lineHeight: 20,
    },
    referralCodeBox: {
      backgroundColor: colors.surfaceSecondary,
      padding: 14,
      borderRadius: 12,
      marginBottom: 12,
    },
    codeContainer: {
      flex: 1,
    },
    codeLabel: {
      fontSize: 10,
      color: colors.textPlaceholder,
      fontWeight: "600",
      marginBottom: 4,
      letterSpacing: 0.6,
    },
    codeText: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textTitle,
      letterSpacing: 1.5,
    },
    referralActions: {
      flexDirection: "row",
      gap: 10,
    },
    copyButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceTertiary,
    },
    copyButtonText: {
      color: colors.secondary,
      fontWeight: "600",
      fontSize: 14,
    },
    shareButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.primary,
    },
    shareButtonText: {
      color: colors.buttonText,
      fontWeight: "600",
      fontSize: 14,
    },
    appearanceIntro: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 12,
      lineHeight: 18,
    },
    appearanceRow: {
      flexDirection: "row",
      gap: 8,
    },
    appearanceOption: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceTertiary,
      gap: 6,
    },
    appearanceOptionSelected: {
      borderColor: colors.secondary,
      backgroundColor: colors.primarySoft,
    },
    appearanceOptionLabel: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textTertiary,
    },
    appearanceOptionLabelSelected: {
      color: colors.secondary,
      fontWeight: "700",
    },
    actionsContent: {
      paddingVertical: 4,
    },
    actionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      minHeight: 48,
    },
    actionIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    actionLabel: {
      flex: 1,
      fontSize: 15,
      color: colors.textTitle,
      fontWeight: "500",
    },
    actionDivider: {
      marginVertical: 2,
      backgroundColor: colors.border,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.surfacePrimary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
      minHeight: 48,
    },
    logoutText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    deleteAccountButton: {
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 16,
      marginTop: 8,
      paddingVertical: 12,
      minHeight: 44,
    },
    deleteAccountText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.error,
    },
    version: {
      textAlign: "center",
      color: colors.textPlaceholder,
      fontSize: 12,
      marginTop: 20,
    },
    bottomPadding: {
      height: 40,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      fontWeight: "600",
      color: colors.onPrimary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalContent: {
      width: "100%",
      maxWidth: 340,
      backgroundColor: colors.surfacePrimary,
      borderRadius: 16,
      padding: 24,
      elevation: 5,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.textTitle,
      marginBottom: 16,
      textAlign: "center",
    },
    modalInput: {
      marginBottom: 20,
      backgroundColor: colors.inputBackground,
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    modalButton: {
      flex: 1,
      borderRadius: 10,
    },
  });

export default ProfileScreen;
