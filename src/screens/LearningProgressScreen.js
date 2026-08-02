import React, { useContext, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Text, Card, Button, ProgressBar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { AppContext } from "../context/AppContext";
import { useThemedStyles } from "../styles/useThemedStyles";
import { useResponsive } from "../styles/theme";
import {
  computeProgressByPaper,
  computePracticalProgress,
  getNextIncompleteLeaf,
  getDailyGoalProgress,
  getActivitySeries,
  getPaperStatusLabel,
  getRecommendedChaptersForYear,
} from "../utils/learningProgress";
import { progressToPercent } from "../utils/progressPresentation";
import {
  getContentSignature,
  getUpdatedSegmentsForItem,
} from "../utils/contentRegistry";
import { DEFAULT_DAILY_GOAL } from "../data/nmcCurriculum";

const colorForToken = (colors, token) => {
  if (token === "secondary") return colors.secondary;
  if (token === "success") return colors.successStrong || colors.success;
  if (token === "warning") return colors.warningStrong || colors.warning;
  return colors.primary;
};

const buildReadingParamsFromEntry = (entry) => {
  if (!entry?.item) return null;
  const status = "none";
  return {
    id: entry.item.id,
    title: entry.item.title,
    content: entry.item.content || "# No Content\n\nThis topic has no content yet.",
    quizzes: entry.item.quizzes,
    section: entry.section,
    contentKey: entry.key,
    contentSignature: entry.signature || getContentSignature(entry.item),
    updatedSegments: getUpdatedSegmentsForItem(entry.item),
    showUpdateHighlights: false,
    searchTerms: "",
  };
};

const isFreeTheoryRoot = (rootChapterId) =>
  String(rootChapterId) === "1";

const LearningProgressScreen = ({ navigation }) => {
  const { styles, colors } = useThemedStyles(createStyles);
  const { horizontalPadding, contentMaxWidth } = useResponsive();
  const {
    readItemVersions,
    readingProgress,
    currentStreak,
    dailyReadHistory,
    lastOpenedContentKey,
    user,
    isPremium,
    contentRegistryVersion,
  } = useContext(AppContext);

  const overallPercent = progressToPercent(readingProgress);

  const paperProgress = useMemo(
    () => computeProgressByPaper(readItemVersions),
    [readItemVersions, contentRegistryVersion],
  );

  const practicalProgress = useMemo(
    () => computePracticalProgress(readItemVersions),
    [readItemVersions, contentRegistryVersion],
  );

  const dailyGoal = useMemo(
    () => getDailyGoalProgress(dailyReadHistory, DEFAULT_DAILY_GOAL),
    [dailyReadHistory],
  );

  const activity = useMemo(
    () => getActivitySeries(dailyReadHistory, 14),
    [dailyReadHistory],
  );

  const maxActivity = Math.max(1, ...activity.map((d) => d.count));

  const preferredPaper =
    user?.preferredPaperFocus && user.preferredPaperFocus !== "all"
      ? Number(user.preferredPaperFocus)
      : null;

  const nextLeaf = useMemo(
    () =>
      getNextIncompleteLeaf(readItemVersions, {
        paperId: preferredPaper,
        preferredContentKey: lastOpenedContentKey,
      }) || getNextIncompleteLeaf(readItemVersions, {}),
    [
      readItemVersions,
      preferredPaper,
      lastOpenedContentKey,
      contentRegistryVersion,
    ],
  );

  const roleSubtitle = useMemo(() => {
    if (user?.learnerRole === "faculty") return "Faculty path · NMC 4 papers";
    if (user?.learnerRole === "ug") return "UG path · core concepts first";
    if (user?.learnerRole === "md_resident") {
      return user.trainingYear
        ? `MD Year ${user.trainingYear} · NMC 4 papers`
        : "MD path · NMC 4 papers";
    }
    return "NMC paper map · Library progress";
  }, [user?.learnerRole, user?.trainingYear]);

  const recommended = useMemo(() => {
    if (!user?.trainingYear) return [];
    return getRecommendedChaptersForYear(
      user.trainingYear,
      readItemVersions,
      6,
    );
  }, [user?.trainingYear, readItemVersions, contentRegistryVersion]);

  const openLeaf = useCallback(
    (entry) => {
      if (!entry) return;
      const readingParams = buildReadingParamsFromEntry(entry);
      if (!readingParams) return;

      const free = entry.section === "theory" && isFreeTheoryRoot(entry.rootChapterId);
      if (free || isPremium) {
        navigation.navigate("Reading", readingParams);
      } else {
        navigation.navigate("PremiumGuard", {
          destination: "Reading",
          readingParams,
        });
      }
    },
    [isPremium, navigation],
  );

  const openPaperInLibrary = (paperId) => {
    navigation.navigate("MainTabs", {
      screen: "Library",
      params: { paperFilter: String(paperId) },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal: horizontalPadding,
            maxWidth: contentMaxWidth,
            alignSelf: "center",
            width: "100%",
          },
        ]}
      >
        <View style={styles.heroCard}>
          <View style={styles.ringWrap}>
            <View
              style={[
                styles.ringOuter,
                {
                  borderColor: colors.primaryMuted || colors.primaryLight,
                },
              ]}
            >
              <View
                style={[
                  styles.ringInner,
                  { backgroundColor: colors.surfacePrimary },
                ]}
              >
                <Text style={styles.ringPercent}>{overallPercent}%</Text>
                <Text style={styles.ringLabel}>Overall</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>Learning progress</Text>
            <Text style={styles.heroSub}>{roleSubtitle}</Text>
            <Text style={styles.heroHint}>
              Progress uses NMC theory papers (not a specific university table).
            </Text>
          </View>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.todayRow}>
              <View style={styles.todayStat}>
                <Text style={styles.todayEmoji}>🔥</Text>
                <Text style={styles.todayValue}>{currentStreak}</Text>
                <Text style={styles.todayLabel}>Day streak</Text>
              </View>
              <View style={styles.todayDivider} />
              <View style={styles.todayStat}>
                <Text style={styles.todayEmoji}>📖</Text>
                <Text style={styles.todayValue}>
                  {dailyGoal.count}/{dailyGoal.goal}
                </Text>
                <Text style={styles.todayLabel}>Today’s goal</Text>
              </View>
              <View style={styles.todayDivider} />
              <View style={styles.todayStat}>
                <Text style={styles.todayEmoji}>🧪</Text>
                <Text style={styles.todayValue}>{practicalProgress.percent}%</Text>
                <Text style={styles.todayLabel}>Practical</Text>
              </View>
            </View>
            <ProgressBar
              progress={dailyGoal.fraction}
              color={colors.secondary}
              style={styles.goalBar}
            />
            <Button
              mode="contained"
              buttonColor={colors.secondary}
              textColor={colors.onPrimary || "#fff"}
              style={styles.continueBtn}
              disabled={!nextLeaf}
              onPress={() => openLeaf(nextLeaf)}
              icon="book-open-page-variant"
            >
              {nextLeaf
                ? `Continue · ${nextLeaf.title}`
                : "All theory topics complete"}
            </Button>
          </Card.Content>
        </Card>

        <Text style={styles.sectionTitle}>NMC theory papers</Text>
        {paperProgress.map((paper) => {
          const barColor = colorForToken(colors, paper.colorToken);
          return (
            <TouchableOpacity
              key={paper.paperId}
              activeOpacity={0.85}
              onPress={() => openPaperInLibrary(paper.paperId)}
            >
              <Card style={styles.paperCard}>
                <Card.Content>
                  <View style={styles.paperHeader}>
                    <View
                      style={[
                        styles.paperBadge,
                        { backgroundColor: colors.primarySoft },
                      ]}
                    >
                      <Text style={[styles.paperBadgeText, { color: colors.primary }]}>
                        P{paper.roman}
                      </Text>
                    </View>
                    <View style={styles.paperTitleCol}>
                      <Text style={styles.paperTitle}>{paper.shortTitle}</Text>
                      <Text style={styles.paperDomains} numberOfLines={2}>
                        {paper.domains}
                      </Text>
                    </View>
                    <View style={styles.paperRight}>
                      <Text style={styles.paperPercent}>{paper.percent}%</Text>
                      <Text style={styles.paperStatus}>
                        {getPaperStatusLabel(paper.fraction)}
                      </Text>
                    </View>
                  </View>
                  <ProgressBar
                    progress={paper.fraction}
                    color={barColor}
                    style={styles.paperBar}
                  />
                  <Text style={styles.paperMeta}>
                    {paper.read} of {paper.total} topics · Tap to open in Library
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          );
        })}

        {recommended.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              Year {user.trainingYear} recommendations
            </Text>
            <Card style={styles.card}>
              <Card.Content>
                {recommended.map(({ chapter, paper, completion }) => (
                  <TouchableOpacity
                    key={String(chapter.id)}
                    style={styles.recRow}
                    onPress={() => openPaperInLibrary(paper)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.recTextCol}>
                      <Text style={styles.recTitle} numberOfLines={2}>
                        {chapter.title}
                      </Text>
                      <Text style={styles.recMeta}>
                        Paper {paper} · {completion.percent}%
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={22}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                ))}
              </Card.Content>
            </Card>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Last 14 days</Text>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.activityRow}>
              {activity.map((day) => (
                <View key={day.dateKey} style={styles.activityCol}>
                  <View
                    style={[
                      styles.activityBarTrack,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}
                  >
                    <View
                      style={[
                        styles.activityBarFill,
                        {
                          height: `${Math.max(
                            day.count > 0 ? 18 : 0,
                            (day.count / maxActivity) * 100,
                          )}%`,
                          backgroundColor: colors.secondary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.activityLabel}>{day.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.activityHint}>
              Topics marked complete each day
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.backgroundMain,
    },
    container: {
      paddingTop: 8,
      paddingBottom: 32,
    },
    heroCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfacePrimary,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    ringWrap: { marginRight: 14 },
    ringOuter: {
      width: 88,
      height: 88,
      borderRadius: 44,
      borderWidth: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    ringInner: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    ringPercent: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textTitle,
    },
    ringLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      marginTop: 2,
    },
    heroTextCol: { flex: 1 },
    heroTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textTitle,
    },
    heroSub: {
      fontSize: 13,
      color: colors.secondary,
      marginTop: 4,
      fontWeight: "600",
    },
    heroHint: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 6,
      lineHeight: 16,
    },
    card: {
      marginBottom: 12,
      backgroundColor: colors.surfacePrimary,
      borderRadius: 14,
    },
    todayRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    todayStat: {
      flex: 1,
      alignItems: "center",
    },
    todayEmoji: { fontSize: 18, marginBottom: 2 },
    todayValue: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textTitle,
    },
    todayLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      marginTop: 2,
      textAlign: "center",
    },
    todayDivider: {
      width: StyleSheet.hairlineWidth,
      height: 40,
      backgroundColor: colors.border,
    },
    goalBar: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.surfaceSecondary,
      marginBottom: 12,
    },
    continueBtn: {
      borderRadius: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textTitle,
      marginTop: 8,
      marginBottom: 8,
    },
    paperCard: {
      marginBottom: 10,
      backgroundColor: colors.surfacePrimary,
      borderRadius: 14,
    },
    paperHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    paperBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginRight: 10,
    },
    paperBadgeText: {
      fontSize: 12,
      fontWeight: "800",
    },
    paperTitleCol: { flex: 1, paddingRight: 8 },
    paperTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.textTitle,
    },
    paperDomains: {
      fontSize: 11,
      color: colors.textTertiary,
      marginTop: 2,
      lineHeight: 15,
    },
    paperRight: { alignItems: "flex-end" },
    paperPercent: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textTitle,
    },
    paperStatus: {
      fontSize: 10,
      color: colors.textTertiary,
      marginTop: 2,
    },
    paperBar: {
      height: 6,
      borderRadius: 3,
      marginTop: 10,
      backgroundColor: colors.surfaceSecondary,
    },
    paperMeta: {
      fontSize: 11,
      color: colors.textTertiary,
      marginTop: 6,
    },
    recRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    recTextCol: { flex: 1 },
    recTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textTitle,
    },
    recMeta: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    activityRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      height: 88,
      justifyContent: "space-between",
    },
    activityCol: {
      flex: 1,
      alignItems: "center",
    },
    activityBarTrack: {
      width: 10,
      height: 64,
      borderRadius: 5,
      justifyContent: "flex-end",
      overflow: "hidden",
    },
    activityBarFill: {
      width: "100%",
      borderRadius: 5,
    },
    activityLabel: {
      fontSize: 9,
      color: colors.textTertiary,
      marginTop: 4,
    },
    activityHint: {
      fontSize: 11,
      color: colors.textTertiary,
      marginTop: 10,
      textAlign: "center",
    },
  });

export default LearningProgressScreen;
