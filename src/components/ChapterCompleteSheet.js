import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Text, Dialog, Portal } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import { useThemedStyles } from "../styles/useThemedStyles";
import { progressToPercent } from "../utils/progressPresentation";

/**
 * Chapter completion sheet: progress, optional streak, Library / Next.
 * Review Request is a separate modal (`ReviewRequestModal`).
 *
 * Props:
 *  - visible
 *  - title
 *  - previousProgress / nextProgress (0–1)
 *  - currentStreak
 *  - showStreakChip
 *  - nextChapterTitle
 *  - onNextChapter
 *  - onBackToLibrary
 *  - onDismiss
 */
const ChapterCompleteSheet = ({
  visible,
  title,
  previousProgress = 0,
  nextProgress = 0,
  currentStreak = 0,
  showStreakChip = false,
  nextChapterTitle = null,
  onNextChapter,
  onBackToLibrary,
  onDismiss,
}) => {
  const { styles, colors } = useThemedStyles(createStyles);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0.85);
      return;
    }
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [visible, scaleAnim]);

  const prevPct = progressToPercent(previousProgress);
  const nextPct = progressToPercent(nextProgress);
  const progressLabel =
    nextPct > prevPct ? `${prevPct}% → ${nextPct}%` : `${nextPct}%`;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <View style={styles.accentBar} />

        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <Pressable
            onPress={onDismiss}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close progress report"
            style={styles.closeBtn}
          >
            <MaterialIcons
              name="close"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        <Dialog.Content style={styles.content}>
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View
              style={[styles.checkCircle, { backgroundColor: colors.primarySoft }]}
            >
              <MaterialIcons name="check" size={32} color={colors.secondary} />
            </View>
          </Animated.View>

          <Text style={styles.heading}>Chapter complete</Text>

          {title ? (
            <Text style={styles.chapterTitle} numberOfLines={2}>
              {title}
            </Text>
          ) : null}

          <View
            style={[styles.progressChip, { backgroundColor: colors.primarySoft }]}
          >
            <MaterialIcons
              name="trending-up"
              size={16}
              color={colors.secondary}
              style={styles.progressIcon}
            />
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              Progress
            </Text>
            <Text style={[styles.progressValue, { color: colors.secondary }]}>
              {progressLabel}
            </Text>
          </View>

          {showStreakChip && currentStreak > 0 ? (
            <View style={styles.streakChip}>
              <Text style={styles.streakText}>{currentStreak}-day streak</Text>
            </View>
          ) : null}
        </Dialog.Content>

        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={onBackToLibrary || onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Back to library"
            style={({ pressed }) => [
              styles.btnSecondary,
              {
                borderColor: colors.borderStrong,
                backgroundColor: colors.surfaceSecondary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[styles.btnLabelSecondary, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              Back to Library
            </Text>
          </Pressable>
          {nextChapterTitle && onNextChapter ? (
            <Pressable
              onPress={onNextChapter}
              accessibilityRole="button"
              accessibilityLabel={`Next chapter: ${nextChapterTitle}`}
              style={({ pressed }) => [
                styles.btnPrimary,
                {
                  backgroundColor: colors.secondary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={styles.btnLabelPrimary}>Next</Text>
              <MaterialIcons
                name="arrow-forward"
                size={18}
                color={theme.colors.onPrimary}
                style={styles.btnPrimaryIcon}
              />
            </Pressable>
          ) : (
            <Pressable
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Continue"
              style={({ pressed }) => [
                styles.btnPrimary,
                {
                  backgroundColor: colors.secondary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={styles.btnLabelPrimary}>Continue</Text>
            </Pressable>
          )}
        </View>
      </Dialog>
    </Portal>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    dialog: {
      backgroundColor: colors.surfacePrimary,
      borderRadius: 22,
      overflow: "hidden",
      elevation: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      maxWidth: 400,
      alignSelf: "center",
      width: "92%",
    },
    accentBar: {
      height: 5,
      backgroundColor: colors.secondary,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingTop: 8,
      paddingHorizontal: 8,
      minHeight: 40,
    },
    topBarSpacer: {
      flex: 1,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      paddingTop: 4,
      paddingBottom: 4,
      alignItems: "center",
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: 10,
    },
    checkCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    heading: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textTitle,
      textAlign: "center",
      marginBottom: 4,
    },
    chapterTitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    progressChip: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginBottom: 8,
      gap: 6,
    },
    progressIcon: {
      marginRight: 0,
    },
    progressLabel: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    progressValue: {
      fontSize: 15,
      fontWeight: "700",
      marginLeft: 2,
    },
    streakChip: {
      backgroundColor: "rgba(249, 115, 22, 0.12)",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 16,
      marginBottom: 8,
    },
    streakText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textTitle,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 8,
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: 18,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    btnSecondary: {
      flex: 1,
      minHeight: 46,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    btnLabelSecondary: {
      fontWeight: "600",
      fontSize: 13,
      textAlign: "center",
    },
    btnPrimary: {
      flex: 1,
      minHeight: 46,
      borderRadius: 12,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    btnPrimaryIcon: {
      marginLeft: 0,
    },
    btnLabelPrimary: {
      fontWeight: "700",
      fontSize: 14,
      color: theme.colors.onPrimary,
    },
  });

export default ChapterCompleteSheet;
