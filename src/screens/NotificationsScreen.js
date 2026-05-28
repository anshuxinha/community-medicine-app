import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { Text, Card, Divider, Chip, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  isSubscribedToVideoNotifications,
  addVideoSubscriptionListener,
  subscribeToVideoNotifications,
  unsubscribeFromVideoNotifications,
  requestPermissions,
} from "../services/notificationService";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

const NotificationsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [isVideoSubscribed, setIsVideoSubscribed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();

    // Listen for subscription changes from other screens
    const unsubscribe = addVideoSubscriptionListener((subscribed) => {
      setIsVideoSubscribed(subscribed);
    });

    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      const subscribed = await isSubscribedToVideoNotifications();
      setIsVideoSubscribed(subscribed);
    } catch (error) {
      console.error("Error loading notification data:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleVideoSubscription = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isVideoSubscribed) {
        const success = await unsubscribeFromVideoNotifications();
        if (success) {
          Alert.alert(
            "Unsubscribed",
            "You've been unsubscribed from video notifications.",
            [{ text: "OK" }],
          );
        }
      } else {
        // Subscribe
        if (!Device.isDevice) {
          Alert.alert(
            "Simulator",
            "Push notifications don't work on simulators. Please test on a real device.",
          );
          setIsLoading(false);
          return;
        }

        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device settings to get video updates.",
            [{ text: "OK" }],
          );
          setIsLoading(false);
          return;
        }

        const success = await subscribeToVideoNotifications();
        if (success) {
          Alert.alert(
            "Subscribed!",
            "You'll receive push notifications when new videos are added.",
            [{ text: "OK" }],
          );
        }
      }
    } catch (error) {
      console.error("Error toggling video subscription:", error);
      Alert.alert("Error", "Failed to update subscription. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.header}>Notifications</Text>

        {/* Notification Preferences Section */}
        <Card style={styles.preferencesCard}>
          <Card.Content>
            <View style={styles.preferenceHeader}>
              <MaterialIcons
                name="settings"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.preferenceTitle}>
                Notification Preferences
              </Text>
            </View>
            <Divider style={styles.divider} />

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <MaterialIcons
                  name="ondemand-video"
                  size={20}
                  color={theme.colors.secondary}
                />
                <Text style={styles.preferenceText}>Video Updates</Text>
              </View>
              <Chip
                icon={isVideoSubscribed ? "bell-check" : "bell-outline"}
                mode="outlined"
                style={[
                  styles.chip,
                  isVideoSubscribed ? styles.chipActive : styles.chipInactive,
                ]}
                textStyle={styles.chipText}
                onPress={toggleVideoSubscription}
                disabled={isLoading}
                showSelectedOverlay={false}
              >
                {isVideoSubscribed ? "Subscribed" : "Subscribe"}
              </Chip>
            </View>

            <Text style={styles.preferenceDescription}>
              {isVideoSubscribed
                ? "You'll receive push notifications when new videos are added."
                : "Enable video notifications to get updates about new lessons."}
            </Text>
          </Card.Content>
        </Card>

        {/* Recent Notifications Section */}
        <Text style={styles.sectionTitle}>Recent Notifications</Text>

        <Card style={styles.updateCard}>
          <Card.Content>
            <View style={styles.updateHeader}>
              <View style={styles.updateHeaderLeft}>
                <MaterialIcons
                  name="info-outline"
                  size={20}
                  color={theme.colors.accent}
                  style={{ marginRight: 6 }}
                />
                <Chip
                  mode="outlined"
                  style={styles.dateChip}
                  textStyle={styles.dateChipText}
                  showSelectedOverlay={false}
                >
                  May 28, 2026
                </Chip>
              </View>
              <Chip
                mode="outlined"
                style={styles.newChip}
                textStyle={styles.newChipText}
                showSelectedOverlay={false}
              >
                New
              </Chip>
            </View>
            <Text style={styles.updateTitle}>Early Bird Price Migration Notice</Text>
            <Text style={styles.updateSummary}>
              If you purchased your monthly or yearly subscription during the Early Bird Offer period, please note that you will be automatically migrated to the new price on your next billing date.
            </Text>
          </Card.Content>
        </Card>

        {/* System Notifications Info */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <MaterialIcons
                name="info"
                size={24}
                color={theme.colors.accent}
              />
              <Text style={styles.infoTitle}>About Notifications</Text>
            </View>
            <Text style={styles.infoText}>
              • Weekly progress digest every Sunday at 10:00 AM
              {"\n"}• Video notifications when new lessons are added
              {"\n"}• Streak milestones for consistent study habits
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.backgroundMain },
  container: { padding: 16, paddingTop: 20, paddingBottom: 40 },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: theme.colors.textTitle,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textTitle,
    marginTop: 24,
    marginBottom: 16,
  },
  preferencesCard: {
    backgroundColor: theme.colors.surfacePrimary,
    marginBottom: 20,
  },
  preferenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  preferenceTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.textTitle,
    marginLeft: 12,
  },
  divider: {
    marginVertical: 8,
    backgroundColor: theme.colors.border,
  },
  preferenceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  preferenceInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  preferenceText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: 12,
  },
  preferenceDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 12,
    lineHeight: 20,
  },
  chip: {
    height: 32,
  },
  chipActive: {
    backgroundColor: theme.colors.success + "20",
    borderColor: theme.colors.success,
  },
  chipInactive: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderColor: theme.colors.border,
  },
  chipText: {
    fontSize: 12,
  },
  updateCard: {
    backgroundColor: theme.colors.surfacePrimary,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
    borderRadius: 12,
  },
  updateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  updateHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateChip: {
    backgroundColor: theme.colors.surfaceSecondary,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 0,
  },
  dateChipText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 12,
    textAlignVertical: "center",
    marginVertical: 0,
    paddingVertical: 0,
  },
  newChip: {
    backgroundColor: theme.colors.accent + "20",
    borderColor: theme.colors.accent,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 0,
  },
  newChipText: {
    fontSize: 11,
    color: theme.colors.accent,
    fontWeight: "bold",
    lineHeight: 12,
    textAlignVertical: "center",
    marginVertical: 0,
    paddingVertical: 0,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textTitle,
    marginBottom: 8,
    lineHeight: 22,
  },
  updateSummary: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: theme.colors.surfacePrimary,
    marginBottom: 20,
  },
  emptyContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    color: theme.colors.textPlaceholder,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  infoCard: {
    backgroundColor: theme.colors.surfaceSecondary,
    marginTop: 20,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textTitle,
    marginLeft: 12,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
});

export default NotificationsScreen;
