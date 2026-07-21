import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Text, Button, Dialog, Portal } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import { useThemedStyles } from "../styles/useThemedStyles";
import { progressToPercent } from "../utils/progressPresentation";

/**
 * First-time chapter completion celebration.
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
    nextPct > prevPct ? `${prevPct}% → ${nextPct}%` : "Progress updated";

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={styles.dialog}
      >
        <View style={styles.accentBar} />

        <Dialog.Content style={styles.content}>
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.checkCircle}>
              <MaterialIcons
                name="check"
                size={40}
                color={theme.colors.secondary}
              />
            </View>
          </Animated.View>

          <Text style={styles.heading}>Chapter complete</Text>

          {title ? (
            <Text style={styles.chapterTitle} numberOfLines={2}>
              {title}
            </Text>
          ) : null}

          <View style={styles.progressBox}>
            <Text style={styles.progressLabel}>Learning Progress</Text>
            <Text style={styles.progressValue}>{progressLabel}</Text>
          </View>

          {showStreakChip && currentStreak > 0 ? (
            <View style={styles.streakChip}>
              <Text style={styles.streakText}>
                🔥 {currentStreak}-day streak
              </Text>
            </View>
          ) : null}
        </Dialog.Content>

        <Dialog.Actions style={styles.actions}>
          <Button
            onPress={onBackToLibrary || onDismiss}
            textColor={colors.textSecondary}
            style={styles.btnSecondary}
            labelStyle={styles.btnLabelSecondary}
          >
            Back to Library
          </Button>
          {nextChapterTitle && onNextChapter ? (
            <Button
              mode="contained"
              onPress={onNextChapter}
              icon="arrow-forward"
              contentStyle={{ flexDirection: "row-reverse" }}
              style={styles.btnPrimary}
              labelStyle={styles.btnLabelPrimary}
            >
              Next chapter
            </Button>
          ) : null}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    dialog: {
      backgroundColor: colors.surfacePrimary,
      borderRadius: 24,
      overflow: "hidden",
      elevation: 8,
      shadowColor: colors.textTitle,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    accentBar: {
      height: 6,
      backgroundColor: colors.secondary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    content: {
      paddingTop: 28,
      paddingBottom: 8,
      alignItems: "center",
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: 16,
    },
    checkCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "rgba(168, 85, 247, 0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    heading: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.textTitle,
      textAlign: "center",
      marginBottom: 8,
    },
    chapterTitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    progressBox: {
      width: "100%",
      backgroundColor: "rgba(168, 85, 247, 0.08)",
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: "center",
      marginBottom: 12,
    },
    progressLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    progressValue: {
      fontSize: 20,
      fontWeight: "700",
      color: "#A855F7",
    },
    streakChip: {
      backgroundColor: "rgba(249, 115, 22, 0.12)",
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      marginTop: 4,
    },
    streakText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textTitle,
    },
    actions: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      flexWrap: "wrap",
      justifyContent: "flex-end",
      gap: 4,
    },
    btnSecondary: {
      marginRight: 4,
    },
    btnLabelSecondary: {
      fontWeight: "600",
    },
    btnPrimary: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
    },
    btnLabelPrimary: {
      fontWeight: "700",
      fontSize: 14,
    },
  });

export default ChapterCompleteSheet;
