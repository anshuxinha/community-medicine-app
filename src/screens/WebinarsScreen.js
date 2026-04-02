import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { Text, Card, Button } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import {
  isSubscribedToWebinarNotifications,
  requestPermissions,
} from "../services/notificationService";

const WEBINAR_NOTIFICATION_KEY = "webinar_notification_subscribed";

const WebinarsScreen = ({ navigation }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const subscribed = await isSubscribedToWebinarNotifications();
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  };

  const handleNotifyPress = async () => {
    if (isSubscribed) {
      Alert.alert(
        "Already Subscribed",
        "You're already subscribed to webinar notifications. You'll be notified when new webinars are available.",
        [{ text: "OK" }],
      );
      return;
    }

    setIsLoading(true);
    try {
      // Request notification permissions
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
          "Please enable notifications in your device settings to get webinar updates.",
          [{ text: "OK" }],
        );
        setIsLoading(false);
        return;
      }

      // Store subscription preference
      await AsyncStorage.setItem(WEBINAR_NOTIFICATION_KEY, "true");
      setIsSubscribed(true);

      // Show success message
      Alert.alert(
        "Success!",
        "You'll receive a push notification when new webinars are added. Stay tuned!",
        [{ text: "OK" }],
      );

      // Log subscription for analytics (optional)
      console.log("User subscribed to webinar notifications");
    } catch (error) {
      console.error("Error subscribing to webinar notifications:", error);
      Alert.alert(
        "Error",
        "Failed to subscribe to notifications. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialIcons
            name="ondemand-video"
            size={80}
            color={theme.colors.secondary}
          />
          <Text variant="headlineMedium" style={styles.title}>
            Webinars
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Live and recorded sessions on Community Medicine topics
          </Text>
        </View>

        <Card style={styles.comingSoonCard}>
          <Card.Content style={styles.cardContent}>
            <MaterialIcons
              name="hourglass-empty"
              size={48}
              color={theme.colors.accent}
            />
            <Text variant="headlineSmall" style={styles.comingSoonText}>
              Coming soon...
            </Text>
            <Text variant="bodyMedium" style={styles.comingSoonDescription}>
              We're preparing a series of expert-led webinars covering the
              latest updates, case discussions, and interactive Q&A sessions.
            </Text>
            <Text variant="bodyMedium" style={styles.comingSoonDescription}>
              Stay tuned for announcements!
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.infoTitle}>
              What to expect
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={theme.colors.success}
                />
                <Text style={styles.bulletText}>
                  Live sessions with faculty
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={theme.colors.success}
                />
                <Text style={styles.bulletText}>
                  Recorded videos for revision
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={theme.colors.success}
                />
                <Text style={styles.bulletText}>Interactive Q&A and polls</Text>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={theme.colors.success}
                />
                <Text style={styles.bulletText}>
                  Certificates of participation
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          icon={isSubscribed ? "bell-check" : "bell"}
          style={styles.notifyButton}
          onPress={handleNotifyPress}
          loading={isLoading}
          disabled={isLoading}
        >
          {isSubscribed
            ? "Subscribed to Notifications"
            : "Notify me when ready"}
        </Button>

        {isSubscribed && (
          <Text style={styles.subscriptionNote}>
            ✓ You'll receive a push notification when new webinars are added
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundMain,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginVertical: 30,
  },
  title: {
    marginTop: 16,
    color: theme.colors.textTitle,
    fontWeight: "bold",
  },
  subtitle: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 300,
  },
  comingSoonCard: {
    marginVertical: 20,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  cardContent: {
    alignItems: "center",
    paddingVertical: 30,
  },
  comingSoonText: {
    marginTop: 20,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  comingSoonDescription: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  infoCard: {
    marginVertical: 20,
    backgroundColor: theme.colors.surfacePrimary,
  },
  infoTitle: {
    color: theme.colors.textTitle,
    marginBottom: 16,
    fontWeight: "600",
  },
  bulletList: {
    gap: 12,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bulletText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    flex: 1,
  },
  notifyButton: {
    marginTop: 30,
    backgroundColor: theme.colors.secondary,
    paddingVertical: 8,
  },
  subscriptionNote: {
    marginTop: 12,
    textAlign: "center",
    color: theme.colors.success,
    fontSize: 14,
    fontStyle: "italic",
  },
});

export default WebinarsScreen;
