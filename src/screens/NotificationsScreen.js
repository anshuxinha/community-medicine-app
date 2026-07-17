import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Text, Card, Chip } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';

const NotificationsScreen = () => {
  const { styles, colors } = useThemedStyles(createStyles);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
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
              {"\n\n"}
              New video alerts are always on. You can manage system permission in your device settings.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundMain },
  container: { padding: 16, paddingTop: 20, paddingBottom: 40 },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.textTitle,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textTitle,
    marginTop: 8,
    marginBottom: 16,
  },
  updateCard: {
    backgroundColor: colors.surfacePrimary,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
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
    backgroundColor: colors.surfaceSecondary,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 0,
  },
  dateChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 12,
    textAlignVertical: "center",
    marginVertical: 0,
    paddingVertical: 0,
  },
  newChip: {
    backgroundColor: colors.accent + "20",
    borderColor: colors.accent,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 0,
  },
  newChipText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: "bold",
    lineHeight: 12,
    textAlignVertical: "center",
    marginVertical: 0,
    paddingVertical: 0,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textTitle,
    marginBottom: 8,
    lineHeight: 22,
  },
  updateSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.surfaceSecondary,
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
    color: colors.textTitle,
    marginLeft: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

export default NotificationsScreen;
