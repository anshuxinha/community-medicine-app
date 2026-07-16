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
} from "react-native";
import { Text, Avatar, Card, Divider, ActivityIndicator, TextInput, Button } from "react-native-paper";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { signOut, deleteUser } from "firebase/auth";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { AppContext } from "../context/AppContext";
import { theme } from "../styles/theme";
import Constants from "expo-constants";
import {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
} from "../utils/screenCaptureProtection";

const ProfileScreen = () => {
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

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

  // Helper function to calculate subscription expiry display
  const getSubscriptionExpiryDisplay = () => {
    // If premiumType is "lifetime", show "Lifetime"
    if (premiumType === "lifetime") {
      return "Lifetime";
    }

    // If subscriptionExpiry exists and is a valid date
    if (subscriptionExpiry) {
      const expiryDate = new Date(subscriptionExpiry);
      if (!Number.isNaN(expiryDate.getTime())) {
        const now = new Date();
        const diffMs = expiryDate - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          return "Expired";
        } else if (diffDays < 30) {
          return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
        } else {
          const months = Math.ceil(diffDays / 30);
          return `${months} month${months !== 1 ? "s" : ""}`;
        }
      }
    }

    // If isPremium is true but no explicit type/expiry, default to "Lifetime"
    if (isPremium) {
      return "Lifetime";
    }

    // Not premium
    return "—";
  };

  const handleShareReferral = async () => {
    if (!user?.referralCode) {
      Alert.alert("Error", "Your referral code is not ready yet. Please try again.");
      return;
    }

    try {
      await Share.share({
        message: `Hey! I'm using STROMA to prep for Community Medicine. Join me using my referral code ${user.referralCode} to get the Yearly Premium plan for just ₹999 (instead of ₹1,200)! 📚✨\n\nDownload now:\nAndroid: https://bit.ly/stromaapp\niOS: https://apple.co/4oaVlLi`,
      });
    } catch (error) {
      console.warn("Failed to share referral code:", error.message);
    }
  };

  const displayName = user?.username || user?.displayName || "STROMA User";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "S";

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
            const user = auth.currentUser;
            if (user) {
              const uid = user.uid;
              try {
                // Delete user document from Firestore first
                try {
                  await deleteDoc(doc(db, "users", uid));
                } catch (e) {
                  console.error("Error deleting user document:", e);
                }
                
                // Delete user from Firebase Auth
                await deleteUser(user);
                
                // Call context logout
                logout();
                
                Alert.alert("Account Deleted", "Your account has been successfully deleted.");
                
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                });
              } catch (error) {
                if (error.code === 'auth/requires-recent-login') {
                  Alert.alert(
                    "Re-authentication Required",
                    "For security reasons, please log out and log back in before deleting your account.",
                  );
                } else {
                  Alert.alert("Error", error.message || "Failed to delete account. Please try again.");
                }
              }
            }
          },
        },
      ],
    );
  };

  const handleRateApp = () => {
    Linking.openURL("market://details?id=com.communitymed.app");
  };

  const handleSendFeedback = () => {
    Linking.openURL(
      "mailto:anshuxinha@gmail.com?subject=STROMA%20App%20Feedback",
    );
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

  const articlesRead = readItems?.length || 0;
  const bookmarksCount = bookmarks?.length || 0;
  const progressPercent = Math.round((readingProgress || 0) * 100);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Avatar.Text
            size={80}
            label={initials}
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{displayName}</Text>
            <TouchableOpacity onPress={handleStartEditName} style={styles.editButton}>
              <MaterialIcons name="edit" size={16} color="#FFFFFF" style={styles.editIcon} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userEmail}>{user?.email || ""}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription Status Card */}
        <Card style={styles.subscriptionCard}>
          <Card.Content style={styles.subscriptionContent}>
            <View style={styles.subscriptionLeft}>
              <View
                style={[
                  styles.premiumBadge,
                  isPremium ? styles.premiumActive : styles.premiumInactive,
                ]}
              >
                <FontAwesome5
                  name={isPremium ? "crown" : "crown"}
                  size={16}
                  color={isPremium ? "#FFD700" : theme.colors.textPlaceholder}
                />
              </View>
              <View style={styles.subscriptionText}>
                <Text style={styles.subscriptionTitle}>
                  {isPremium ? "Premium Member" : "Free Account"}
                </Text>
                <Text style={styles.subscriptionSubtitle}>
                  {isPremium
                    ? "Enjoying all premium features"
                    : "Upgrade to unlock all features"}
                </Text>
              </View>
            </View>
            {!isPremium && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgradePremium}
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </Card.Content>
        </Card>

        {/* Learning Stats */}
        <Text style={styles.sectionTitle}>📊 Learning Stats</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialIcons
                name="local-fire-department"
                size={28}
                color={theme.colors.accent}
              />
              <Text style={styles.statValue}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialIcons
                name="stars"
                size={28}
                color={theme.colors.secondary}
              />
              <Text style={styles.statValue}>{studyScore}</Text>
              <Text style={styles.statLabel}>Stroma Score</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialIcons
                name="trending-up"
                size={28}
                color={theme.colors.chartGreen}
              />
              <Text style={styles.statValue}>{progressPercent}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Activity Summary */}
        <Text style={styles.sectionTitle}>📚 Activity Summary</Text>
        <Card style={styles.activityCard}>
          <Card.Content>
            <View style={styles.activityRow}>
              <View style={styles.activityItem}>
                <Text style={styles.activityValue}>{articlesRead}</Text>
                <Text style={styles.activityLabel}>Chapters Read</Text>
              </View>
              <View style={styles.activityDivider} />
              <View style={styles.activityItem}>
                <Text style={styles.activityValue}>{bookmarksCount}</Text>
                <Text style={styles.activityLabel}>Bookmarks</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Refer & Earn */}
        <Text style={styles.sectionTitle}>🎁 Refer & Earn</Text>
        <Card style={styles.referralCard}>
          <Card.Content>
            <Text style={styles.referralSubtitle}>
              Give friends 15% off premium and get 30 days of premium free when they subscribe!
            </Text>
            
            <View style={styles.referralCodeBox}>
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
                <Text style={styles.codeText}>{user?.referralCode || "—"}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareReferral}
              >
                <MaterialIcons name="share" size={20} color={theme.colors.surfacePrimary} />
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Account Info */}
        <Text style={styles.sectionTitle}>👤 Account</Text>
        <Card style={styles.accountCard}>
          <Card.Content>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Account Type</Text>
              <Text style={styles.accountValue}>
                {user ? "Registered" : "Guest"}
              </Text>
            </View>
            <Divider style={styles.accountDivider} />
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Subscription Expiry</Text>
              <Text style={styles.accountValue}>
                {getSubscriptionExpiryDisplay()}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>⚙️ Quick Actions</Text>
        <Card style={styles.actionsCard}>
          <Card.Content style={styles.actionsContent}>
            <TouchableOpacity style={styles.actionItem} onPress={handleRateApp}>
              <View style={styles.actionIconBox}>
                <MaterialIcons
                  name="star-outline"
                  size={20}
                  color={theme.colors.secondary}
                />
              </View>
              <Text style={styles.actionLabel}>Rate the App</Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={theme.colors.textPlaceholder}
              />
            </TouchableOpacity>

            <Divider style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleSendFeedback}
            >
              <View style={styles.actionIconBox}>
                <MaterialIcons
                  name="feedback"
                  size={20}
                  color={theme.colors.secondary}
                />
              </View>
              <Text style={styles.actionLabel}>Send Feedback</Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={theme.colors.textPlaceholder}
              />
            </TouchableOpacity>


            <Divider style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handlePrivacyPolicy}
            >
              <View style={styles.actionIconBox}>
                <MaterialIcons
                  name="privacy-tip"
                  size={20}
                  color={theme.colors.secondary}
                />
              </View>
              <Text style={styles.actionLabel}>Privacy Policy</Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={theme.colors.textPlaceholder}
              />
            </TouchableOpacity>

            {user?.isAdmin ? (
              <>
                <Divider style={styles.actionDivider} />

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleOpenAdminQueue}
                >
                  <View style={styles.actionIconBox}>
                    <MaterialIcons
                      name="fact-check"
                      size={20}
                      color={theme.colors.secondary}
                    />
                  </View>
                  <Text style={styles.actionLabel}>Library Review Queue</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={theme.colors.textPlaceholder}
                  />
                </TouchableOpacity>
              </>
            ) : null}
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
          <MaterialIcons name="delete-forever" size={20} color={theme.colors.error} />
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>

        {/* App Version */}
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
              activeOutlineColor={theme.colors.primary}
            />
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setIsEditingName(false)}
                style={styles.modalButton}
                textColor={theme.colors.textSecondary}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveName}
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                loading={isSavingName}
                disabled={isSavingName || !newName.trim()}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {isLoggingOut && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Logging out...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundMain,
  },
  header: {
    backgroundColor: theme.colors.textPrimary,
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  avatar: {
    backgroundColor: theme.colors.secondary,
    marginBottom: 16,
  },
  avatarLabel: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.surfacePrimary,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.surfacePrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textPlaceholder,
  },
  scrollView: {
    flex: 1,
    marginTop: -16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textTitle,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  subscriptionCard: {
    marginHorizontal: 16,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 16,
    elevation: 2,
  },
  subscriptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  subscriptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
    backgroundColor: "#FFF8DC",
  },
  premiumInactive: {
    backgroundColor: theme.colors.surfaceSecondary,
  },
  subscriptionText: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textTitle,
  },
  subscriptionSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: theme.colors.buttonText,
    fontWeight: "600",
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 16,
    elevation: 2,
  },
  statContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.textTitle,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  activityCard: {
    marginHorizontal: 16,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 16,
    elevation: 2,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  activityDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  activityValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.textTitle,
  },
  activityLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  accountCard: {
    marginHorizontal: 16,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 16,
    elevation: 2,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  accountLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.textTitle,
  },
  accountDivider: {
    marginVertical: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  actionsCard: {
    marginHorizontal: 16,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 16,
    elevation: 2,
  },
  actionsContent: {
    paddingVertical: 4,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textTitle,
    fontWeight: "500",
  },
  actionDivider: {
    marginVertical: 4,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  logoutButton: {
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
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.error,
  },
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.errorLight,
    borderRadius: 12,
    gap: 8,
  },
  deleteAccountText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.error,
  },
  version: {
    textAlign: "center",
    color: theme.colors.textPlaceholder,
    fontSize: 12,
    marginTop: 24,
  },
  bottomPadding: {
    height: 40,
  },
  referralCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.surfacePrimary,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  referralSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  referralCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surfaceSecondary,
    padding: 12,
    borderRadius: 10,
  },
  codeContainer: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 10,
    color: theme.colors.textPlaceholder,
    fontWeight: "600",
    marginBottom: 4,
  },
  codeText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textTitle,
    letterSpacing: 1,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  shareButtonText: {
    color: theme.colors.surfacePrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(251, 252, 254, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  editButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  editIcon: {
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.textTitle,
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    marginBottom: 20,
    backgroundColor: theme.colors.surfacePrimary,
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
