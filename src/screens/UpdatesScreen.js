import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text, Card, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useSession } from "../context/AppContext";
import { theme, useResponsive } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';
import useUpdatesFeed from "../hooks/useUpdatesFeed";
import { monthsToYearIndexMap, getUpdateType } from "../services/updatesService";

const MONTH_NAMES = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const UpdatesScreen = ({ navigation }) => {
  const { styles, colors } = useThemedStyles(createStyles);

  const { isPremium } = useSession();
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth(); // 0-based

  const [selectedMonth, setSelectedMonth] = useState(currentMonthIndex);
  const [updatesFilter, setUpdatesFilter] = useState("ALL");
  const { isTablet, horizontalPadding, contentMaxWidth } = useResponsive();
  const { months, loading } = useUpdatesFeed();

  useEffect(() => {
    if (!isPremium) {
      navigation.getParent()?.navigate("Paywall");
    }
  }, [isPremium, navigation]);

  // Build a map: monthIndex -> updates[]
  const monthData = useMemo(
    () => monthsToYearIndexMap(months, currentYear),
    [months, currentYear],
  );

  if (!isPremium) {
    return null;
  }

  const renderMonthGrid = () => {
    const rows = [];
    for (let row = 0; row < 3; row++) {
      const cols = [];
      for (let col = 0; col < 4; col++) {
        const mIdx = row * 4 + col;
        const allUpdates = monthData[mIdx] || [];
        const filteredUpdates = allUpdates.filter((u) => {
          if (updatesFilter === "ALL") return true;
          return getUpdateType(u) === updatesFilter;
        });
        const count = filteredUpdates.length;
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

  const rawMonthUpdates = selectedMonth !== null ? monthData[selectedMonth] || [] : [];
  const selectedUpdates = useMemo(
    () =>
      rawMonthUpdates.filter((u) => {
        if (updatesFilter === "ALL") return true;
        return getUpdateType(u) === updatesFilter;
      }),
    [rawMonthUpdates, updatesFilter],
  );

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
        {loading ? (
          <ActivityIndicator
            color={colors.secondary}
            style={{ marginVertical: 8 }}
          />
        ) : null}

        {/* 3 Filter Pills: All, News, Article */}
        <View style={styles.filterPillsRow}>
          {[
            { id: "ALL", label: "All" },
            { id: "NEWS", label: "News" },
            { id: "ARTICLE", label: "Article" },
          ].map((pill) => {
            const selected = updatesFilter === pill.id;
            return (
              <TouchableOpacity
                key={pill.id}
                style={[
                  styles.filterPill,
                  selected && styles.filterPillActive,
                ]}
                onPress={() => setUpdatesFilter(pill.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selected && styles.filterPillTextActive,
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
              <Text style={styles.emptyText}>
                No {updatesFilter === "ARTICLE" ? "articles" : updatesFilter === "NEWS" ? "news" : "updates"} for this month.
              </Text>
            ) : (
              selectedUpdates.map((update) => {
                const type = getUpdateType(update);
                const isArticle = type === "ARTICLE";

                return (
                  <Card
                    key={update.id}
                    style={styles.updateCard}
                    onPress={() => navigation.navigate("UpdateDetail", { update })}
                  >
                    <Card.Content>
                      <View style={styles.cardHeaderRow}>
                        <View
                          style={[
                            styles.cardTypeBadge,
                            isArticle ? styles.articleBadge : styles.newsBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.cardTypeBadgeText,
                              isArticle
                                ? styles.articleBadgeText
                                : styles.newsBadgeText,
                            ]}
                          >
                            {type}
                          </Text>
                        </View>
                        <Text variant="labelSmall" style={styles.dateText}>
                          {update.date}
                        </Text>
                      </View>
                      <Text variant="titleMedium" style={styles.updateTitle}>
                        {update.title}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        style={styles.updateSummary}
                        numberOfLines={3}
                        ellipsizeMode="tail"
                      >
                        {update.summary}
                      </Text>
                    </Card.Content>
                    <Card.Actions>
                      <Button
                        textColor={theme.colors.secondary}
                        onPress={() => navigation.navigate("UpdateDetail", { update })}
                        mode="text"
                        compact
                      >
                        Read More
                      </Button>
                    </Card.Actions>
                  </Card>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
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
    color: colors.textTitle,
    marginBottom: 2,
  },
  subHeader: {
    fontSize: 15,
    color: colors.textTertiary,
    marginBottom: 20,
    fontWeight: "500",
  },
  gridCard: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 20,
    elevation: 4,
    shadowColor: colors.textTitle,
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
    backgroundColor: colors.surfaceSecondary,
    minHeight: 72,
  },
  monthBoxSelected: {
    backgroundColor: colors.secondary,
    elevation: 4,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  monthBoxCurrent: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  monthBoxFuture: {
    backgroundColor: colors.surfaceTertiary,
    opacity: 0.6,
  },
  monthName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  monthNameSelected: {
    color: colors.surfacePrimary,
  },
  monthNameCurrent: {
    color: colors.secondary,
  },
  monthNameEmpty: {
    color: colors.textPlaceholder,
  },
  badge: {
    marginTop: 4,
    backgroundColor: colors.surfacePrimary,
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
    backgroundColor: colors.secondary,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.textSecondary,
  },
  badgeTextActive: {
    color: colors.surfacePrimary,
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
    color: colors.textTitle,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 24,
  },
  updateCard: {
    marginBottom: 16,
    backgroundColor: colors.surfacePrimary,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.textTitle,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  dateText: {
    color: colors.secondary,
    marginBottom: 6,
    fontWeight: "bold",
    fontSize: 12,
  },
  updateTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
    color: colors.textTitle,
  },
  updateSummary: {
    color: colors.textTertiary,
    lineHeight: 22,
  },
  filterPillsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfacePrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.secondary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.secondary,
    fontWeight: "700",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  cardTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newsBadge: {
    backgroundColor: colors.primarySoft || "#E0F2FE",
  },
  articleBadge: {
    backgroundColor: "#EDE9FE",
  },
  cardTypeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  newsBadgeText: {
    color: colors.primary || "#0369A1",
  },
  articleBadgeText: {
    color: "#6D28D9",
  },
});

export default UpdatesScreen;
