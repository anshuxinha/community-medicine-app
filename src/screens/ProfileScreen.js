import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { Text, Avatar, Card, Divider } from "react-native-paper";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { AppContext } from "../context/AppContext";
import { theme } from "../styles/theme";
import { MaterialIcons } from "@expo/vector-icons";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const {
    user,
    isPremium,
    currentStreak,
    studyScore,
    readingProgress,
    bookmarks,
    readItems,
    logout,
  } = React.useContext(AppContext);

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
          await signOut(auth);
          logout();
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
      },
    ]);
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

  const handleDeviceManagement = () => {
    navigation.navigate("DeviceManagement");
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
          <Text style={styles.userName}>{displayName}</Text>
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
              <Text style={styles.statLabel}>Study Score</Text>
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
                <Text style={styles.activityLabel}>Articles Read</Text>
              </View>
              <View style={styles.activityDivider} />
              <View style={styles.activityItem}>
                <Text style={styles.activityValue}>{bookmarksCount}</Text>
                <Text style={styles.activityLabel}>Bookmarks</Text>
              </View>
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
              onPress={handleDeviceManagement}
            >
              <View style={styles.actionIconBox}>
                <MaterialIcons
                  name="devices"
                  size={20}
                  color={theme.colors.secondary}
                />
              </View>
              <Text style={styles.actionLabel}>Device Management</Text>
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
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.version}>STROMA v1.0.0</Text>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  version: {
    textAlign: "center",
    color: theme.colors.textPlaceholder,
    fontSize: 12,
    marginTop: 24,
  },
  bottomPadding: {
    height: 40,
  },
});

export default ProfileScreen;
