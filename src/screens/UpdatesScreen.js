import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Text, Card, Button, Dialog, Portal, Paragraph } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { theme, useResponsive } from "../styles/theme";
import currentUpdates from "../data/updates.json";
import archiveData from "../data/updates_archive.json";

const MONTH_NAMES = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const UpdatesScreen = () => {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const { isTablet, horizontalPadding, contentMaxWidth } = useResponsive();

  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth(); // 0-based

  // Build a map: monthIndex -> updates[]
  const monthData = useMemo(() => {
    const map = {};

    // Archive data (keyed by "YYYY-MM")
    for (const [key, updates] of Object.entries(archiveData)) {
      const [yearStr, monthStr] = key.split("-");
      if (parseInt(yearStr, 10) !== currentYear) continue;
      const mIdx = parseInt(monthStr, 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        map[mIdx] = (map[mIdx] || []).concat(updates);
      }
    }

    // Current month: use live updates.json
    const currentMonthUpdates = currentUpdates.filter((u) => {
      const d = u.date || "";
      if (d.length < 7) return true; // include if no date info
      const [yearStr, monthStr] = d.split("-");
      return (
        parseInt(yearStr, 10) === currentYear &&
        parseInt(monthStr, 10) === currentMonthIndex + 1
      );
    });
    if (currentMonthUpdates.length > 0) {
      map[currentMonthIndex] = (map[currentMonthIndex] || []).concat(
        currentMonthUpdates,
      );
    }

    // Deduplicate within each month by link
    for (const mIdx of Object.keys(map)) {
      const seen = new Set();
      map[mIdx] = map[mIdx].filter((u) => {
        if (!u.link || seen.has(u.link)) return false;
        seen.add(u.link);
        return true;
      });
    }

    return map;
  }, [currentYear, currentMonthIndex]);

  const showUpdateDialog = (update) => {
    setSelectedUpdate(update);
    setDialogVisible(true);
  };

  const renderMonthGrid = () => {
    const rows = [];
    for (let row = 0; row < 3; row++) {
      const cols = [];
      for (let col = 0; col < 4; col++) {
        const mIdx = row * 4 + col;
        const updates = monthData[mIdx] || [];
        const count = updates.length;
        const isSelected = selectedMonth === mIdx;
        const isCurrent = mIdx === currentMonthIndex;
        const hasData = count > 0;
        const isFuture = mIdx > currentMonthIndex;

        cols.push(
          <TouchableOpacity
            key={mIdx}
            style={[
              styles.monthBox,
              isSelected && styles.monthBoxSelected,
              isCurrent && !isSelected && styles.monthBoxCurrent,
              isFuture && !hasData && styles.monthBoxFuture,
            ]}
            onPress={() => hasData ? setSelectedMonth(mIdx) : null}
            activeOpacity={hasData ? 0.7 : 1}
          >
            <Text
              style={[
                styles.monthName,
                isSelected && styles.monthNameSelected,
                isCurrent && !isSelected && styles.monthNameCurrent,
                (!hasData || isFuture) && styles.monthNameEmpty,
              ]}
            >
              {MONTH_SHORT[mIdx]}
            </Text>
            {hasData ? (
              <View
                style={[
                  styles.badge,
                  isSelected && styles.badgeSelected,
                  isCurrent && !isSelected && styles.badgeCurrent,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    (isSelected || isCurrent) && styles.badgeTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            ) : (
              <MaterialIcons
                name={isFuture ? "lock-clock" : "remove"}
                size={16}
                color={theme.colors.textPlaceholder}
                style={{ marginTop: 4 }}
              />
            )}
          </TouchableOpacity>,
        );
      }
      rows.push(
        <View key={row} style={styles.monthRow}>
          {cols}
        </View>,
      );
    }
    return rows;
  };

  const selectedUpdates = selectedMonth !== null ? monthData[selectedMonth] || [] : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          isTablet && {
            paddingHorizontal: horizontalPadding,
            maxWidth: contentMaxWidth,
            alignSelf: "center",
          },
        ]}
      >
        {/* Header */}
        <Text style={styles.header}>Updates Archive</Text>
        <Text style={styles.subHeader}>{currentYear}</Text>

        {/* Month Grid */}
        <Card style={styles.gridCard}>{renderMonthGrid()}</Card>

        {/* Selected month updates */}
        {selectedMonth !== null && (
          <View style={styles.updatesSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {MONTH_NAMES[selectedMonth]} {currentYear}
              </Text>
              <TouchableOpacity onPress={() => setSelectedMonth(null)}>
                <MaterialIcons
                  name="close"
                  size={22}
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
            </View>

            {selectedUpdates.length === 0 ? (
              <Text style={styles.emptyText}>No updates for this month.</Text>
            ) : (
              selectedUpdates.map((update) => (
                <Card key={update.id} style={styles.updateCard}>
                  <Card.Content>
                    <Text variant="labelSmall" style={styles.dateText}>
                      {update.date}
                    </Text>
                    <Text variant="titleMedium" style={styles.updateTitle}>
                      {update.title}
                    </Text>
                    <Text variant="bodyMedium" style={styles.updateSummary}>
                      {update.summary && update.summary.length > 100
                        ? `${update.summary.substring(0, 100)}...`
                        : update.summary}
                    </Text>
                  </Card.Content>
                  <Card.Actions>
                    <Button
                      textColor={theme.colors.secondary}
                      onPress={() => showUpdateDialog(update)}
                      mode="text"
                      compact
                    >
                      Read More
                    </Button>
                  </Card.Actions>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Update detail dialog */}
      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
        >
          <Dialog.Title>{selectedUpdate?.title}</Dialog.Title>
          <Dialog.Content>
            <Text
              variant="labelSmall"
              style={{
                marginBottom: 16,
                color: theme.colors.primary,
                fontWeight: "bold",
              }}
            >
              {selectedUpdate?.date}
            </Text>
            <Paragraph style={{ lineHeight: 22 }}>
              {selectedUpdate?.summary}
            </Paragraph>
            {selectedUpdate?.link && (
              <Button
                mode="text"
                onPress={() => Linking.openURL(selectedUpdate.link)}
                style={{
                  marginTop: 16,
                  alignSelf: "flex-start",
                  marginLeft: -8,
                }}
                icon="open-in-new"
              >
                Source Article
              </Button>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundMain,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 32,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.textTitle,
    marginBottom: 2,
  },
  subHeader: {
    fontSize: 15,
    color: theme.colors.textTertiary,
    marginBottom: 20,
    fontWeight: "500",
  },
  gridCard: {
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    padding: 12,
    marginBottom: 24,
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  monthBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginHorizontal: 4,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    minHeight: 72,
  },
  monthBoxSelected: {
    backgroundColor: theme.colors.secondary,
    elevation: 4,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  monthBoxCurrent: {
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 2,
    borderColor: theme.colors.secondary,
  },
  monthBoxFuture: {
    backgroundColor: theme.colors.surfaceTertiary,
    opacity: 0.6,
  },
  monthName: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  monthNameSelected: {
    color: "#FFFFFF",
  },
  monthNameCurrent: {
    color: theme.colors.secondary,
  },
  monthNameEmpty: {
    color: theme.colors.textPlaceholder,
  },
  badge: {
    marginTop: 4,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  badgeSelected: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  badgeCurrent: {
    backgroundColor: theme.colors.secondary,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: theme.colors.textSecondary,
  },
  badgeTextActive: {
    color: "#FFFFFF",
  },
  updatesSection: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 20,
    color: theme.colors.textTitle,
  },
  emptyText: {
    color: theme.colors.textTertiary,
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 24,
  },
  updateCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  dateText: {
    color: theme.colors.secondary,
    marginBottom: 6,
    fontWeight: "bold",
    fontSize: 12,
  },
  updateTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
    color: theme.colors.textTitle,
  },
  updateSummary: {
    color: theme.colors.textTertiary,
    lineHeight: 22,
  },
});

export default UpdatesScreen;
