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
import updatesData from "../data/updates.json";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSubscribedToWebinarNotifications } from "../services/notificationService";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

const WEBINAR_NOTIFICATION_KEY = "webinar_notification_subscribed";

const NotificationsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [isWebinarSubscribed, setIsWebinarSubscribed] = useState(false);
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load updates
      setUpdates(updatesData);

      // Check webinar subscription status
      const subscribed = await isSubscribedToWebinarNotifications();
      setIsWebinarSubscribed(subscribed);
    } catch (error) {
      console.error("Error loading notification data:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleWebinarSubscription = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isWebinarSubscribed) {
        // Unsubscribe
        await AsyncStorage.removeItem(WEBINAR_NOTIFICATION_KEY);
        setIsWebinarSubscribed(false);

        Alert.alert(
          "Unsubscribed",
          "You've been unsubscribed from webinar notifications. You won't receive updates about new webinars.",
          [{ text: "OK" }],
        );

        console.log("User unsubscribed from webinar notifications");
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

        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device settings to get webinar updates.",
            [{ text: "OK" }],
          );
          setIsLoading(false);
          return;
        }

        await AsyncStorage.setItem(WEBINAR_NOTIFICATION_KEY, "true");
        setIsWebinarSubscribed(true);

        Alert.alert(
          "Subscribed!",
          "You'll receive push notifications when new webinars are added. Stay tuned!",
          [{ text: "OK" }],
        );

        console.log("User subscribed to webinar notifications");
      }
    } catch (error) {
      console.error("Error toggling webinar subscription:", error);
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
    <SafeAreaView style={styles.safeArea}>
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
                <Text style={styles.preferenceText}>Webinar Updates</Text>
              </View>
              <Chip
                icon={isWebinarSubscribed ? "bell-check" : "bell-outline"}
                mode="outlined"
                style={[
                  styles.chip,
                  isWebinarSubscribed ? styles.chipActive : styles.chipInactive,
                ]}
                textStyle={styles.chipText}
                onPress={toggleWebinarSubscription}
                disabled={isLoading}
                showSelectedOverlay={false}
              >
                {isWebinarSubscribed ? "Subscribed" : "Subscribe"}
              </Chip>
            </View>

            <Text style={styles.preferenceDescription}>
              {isWebinarSubscribed
                ? "You'll receive push notifications when new webinars are added."
                : "Enable webinar notifications to get updates about new sessions."}
            </Text>
          </Card.Content>
        </Card>

        {/* Recent Updates Section */}
        <Text style={styles.sectionTitle}>Recent Updates</Text>

        {updates.length > 0 ? (
          updates.slice(0, 10).map((update, index) => (
            <Card key={update.id} style={styles.updateCard}>
              <Card.Content>
                <View style={styles.updateHeader}>
                  <Chip mode="outlined" style={styles.dateChip}>
                    {formatDate(update.date)}
                  </Chip>
                  {index === 0 && (
                    <Chip mode="outlined" style={styles.newChip} icon="new-box">
                      New
                    </Chip>
                  )}
                </View>
                <Text style={styles.updateTitle}>{update.title}</Text>
                <Text style={styles.updateSummary}>{update.summary}</Text>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons
                name="notifications-none"
                size={72}
                color="#D1D5DB"
              />
              <Text style={styles.emptyTitle}>No updates available</Text>
              <Text style={styles.emptyBody}>
                Check back later for new updates and announcements.
              </Text>
            </Card.Content>
          </Card>
        )}

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
              • Study reminders are sent daily at 8:00 PM
              {"\n"}• Weekly progress digest every Sunday at 10:00 AM
              {"\n"}• Webinar notifications when new sessions are added
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
  container: { padding: 16, paddingBottom: 40 },
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
  },
  updateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateChip: {
    backgroundColor: theme.colors.surfaceSecondary,
  },
  newChip: {
    backgroundColor: theme.colors.accent + "20",
    borderColor: theme.colors.accent,
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
