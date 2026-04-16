import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
} from "react-native";
import { Text, Card, Button } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import * as Device from "expo-device";
import {
  isSubscribedToWebinarNotifications,
  requestPermissions,
  addWebinarSubscriptionListener,
  subscribeToWebinarNotifications,
  unsubscribeFromWebinarNotifications,
} from "../services/notificationService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const WebinarsScreen = ({ navigation }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();

    const unsubscribe = addWebinarSubscriptionListener((subscribed) => {
      setIsSubscribed(subscribed);
    });

    return unsubscribe;
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
    setIsLoading(true);
    try {
      if (isSubscribed) {
        const success = await unsubscribeFromWebinarNotifications();
        if (success) {
          Alert.alert(
            "Unsubscribed",
            "You've been unsubscribed from webinar notifications. You won't receive updates about new webinars.",
            [{ text: "OK" }],
          );
        }
      } else {
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

        const success = await subscribeToWebinarNotifications();
        if (success) {
          Alert.alert(
            "Success!",
            "You'll receive a push notification when new webinars are added. Stay tuned!",
            [{ text: "OK" }],
          );
        }
      }
    } catch (error) {
      console.error("Error toggling webinar notifications:", error);
      Alert.alert("Error", "Failed to update subscription. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons
            name="ondemand-video"
            size={56}
            color={theme.colors.primary}
          />
          <Text variant="headlineSmall" style={styles.title}>
            Webinars
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Live and recorded sessions on Community Medicine topics
          </Text>
        </View>

        {/* Coming Soon Card */}
        <Card style={styles.comingSoonCard}>
          <Card.Content style={styles.cardContent}>
            <MaterialIcons
              name="hourglass-empty"
              size={40}
              color={theme.colors.accent}
            />
            <Text variant="titleMedium" style={styles.comingSoonText}>
              Coming soon...
            </Text>
            <Text variant="bodySmall" style={styles.comingSoonDescription}>
              We're preparing expert-led webinars covering the latest updates,
              case discussions, and interactive Q&A sessions.
            </Text>
            <Text variant="bodySmall" style={styles.comingSoonDescription}>
              Stay tuned for announcements!
            </Text>
          </Card.Content>
        </Card>

        {/* What to Expect Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.infoTitle}>
              What to expect
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons
                  name="check-circle"
                  size={18}
                  color={theme.colors.success}
                />
                <Text style={styles.bulletText}>
                  Live sessions with faculty
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons
                  name="check-circle"
                  size={18}
                  color={theme.colors.success}
                />
                <Text style={styles.bulletText}>
                  Recorded videos for revision
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons
                  name="check-circle"
                  size={18}
                  color={theme.colors.success}
                />
                <Text style={styles.bulletText}>Interactive Q&A and polls</Text>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons
                  name="check-circle"
                  size={18}
                  color={theme.colors.success}
                />
                <Text style={styles.bulletText}>
                  Certificates of participation
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Notify Button */}
        <View style={styles.buttonContainer}>
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
        </View>
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
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginVertical: 16,
  },
  title: {
    marginTop: 12,
    color: theme.colors.textTitle,
    fontWeight: "bold",
  },
  subtitle: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 280,
  },
  comingSoonCard: {
    marginVertical: 12,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  cardContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  comingSoonText: {
    marginTop: 12,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  comingSoonDescription: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  infoCard: {
    marginVertical: 12,
    backgroundColor: theme.colors.surfacePrimary,
  },
  infoTitle: {
    color: theme.colors.textTitle,
    marginBottom: 12,
    fontWeight: "600",
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bulletText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  buttonContainer: {
    marginTop: "auto",
    paddingBottom: 8,
  },
  notifyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
  },
  subscriptionNote: {
    marginTop: 10,
    textAlign: "center",
    color: theme.colors.success,
    fontSize: 12,
    fontStyle: "italic",
  },
});

export default WebinarsScreen;
