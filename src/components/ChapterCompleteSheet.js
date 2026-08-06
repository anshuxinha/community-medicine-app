import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text, Button, Dialog, Portal } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import { useThemedStyles } from "../styles/useThemedStyles";
import { progressToPercent } from "../utils/progressPresentation";
import { FEEDBACK_MESSAGE_MAX_LENGTH } from "../services/feedbackService";

/**
 * Chapter completion sheet with optional in-sheet app review CTA.
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
 *  - showReviewCta
 *  - onRateFiveStars
 *  - onSubmitLowRatingFeedback ({ rating, message }) => Promise
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
  showReviewCta = false,
  onRateFiveStars,
  onSubmitLowRatingFeedback,
}) => {
  const { styles, colors } = useThemedStyles(createStyles);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const [selectedStars, setSelectedStars] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [ctaHiddenLocally, setCtaHiddenLocally] = useState(false);

  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0.85);
      setSelectedStars(0);
      setFeedbackText("");
      setSubmitting(false);
      setReviewBusy(false);
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
  const showCta = Boolean(showReviewCta) && !ctaHiddenLocally;
  const showFeedbackForm = selectedStars >= 1 && selectedStars <= 4;

  const handleStarPress = async (star) => {
    if (reviewBusy || submitting) return;

    if (star === 5) {
      setSelectedStars(5);
      setReviewBusy(true);
      setCtaHiddenLocally(true);
      try {
        // Parent dismisses this sheet first, then launches native review.
        // Do not keep the dialog open; it blocks Play In-App Review on Android.
        await onRateFiveStars?.();
      } catch (err) {
        console.warn("ChapterCompleteSheet: 5-star review failed", err?.message);
      } finally {
        setReviewBusy(false);
      }
      return;
    }

    setSelectedStars(star);
  };

  const handleSubmitFeedback = async () => {
    const trimmed = feedbackText.trim();
    if (!trimmed) {
      Alert.alert(
        "Add a note",
        "Please share a short note about what we can improve.",
      );
      return;
    }
    if (!onSubmitLowRatingFeedback) return;

    setSubmitting(true);
    try {
      await onSubmitLowRatingFeedback({
        rating: selectedStars,
        message: trimmed,
      });
      setSelectedStars(0);
      setFeedbackText("");
      // Close the progress report after a successful feedback submit.
      onDismiss?.();
    } catch (err) {
      console.warn("ChapterCompleteSheet: feedback failed", err?.message);
      Alert.alert(
        "Could not send",
        err?.message || "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  };

  const handleDismissFeedback = () => {
    if (submitting) return;
    setSelectedStars(0);
    setFeedbackText("");
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <View style={styles.accentBar} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Dialog.Content style={styles.content}>
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <View style={[styles.checkCircle, { backgroundColor: colors.primarySoft }]}>
                <MaterialIcons
                  name="check"
                  size={32}
                  color={colors.secondary}
                />
              </View>
            </Animated.View>

            <Text style={styles.heading}>Chapter complete</Text>

            {title ? (
              <Text style={styles.chapterTitle} numberOfLines={2}>
                {title}
              </Text>
            ) : null}

            <View style={[styles.progressChip, { backgroundColor: colors.primarySoft }]}>
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
                <Text style={styles.streakText}>
                  {currentStreak}-day streak
                </Text>
              </View>
            ) : null}

            {showCta ? (
              <View style={[styles.reviewBlock, { borderColor: colors.border }]}>
                <Text style={[styles.reviewPrompt, { color: colors.textTitle }]}>
                  Enjoying STROMA?
                </Text>
                <Text
                  style={[styles.reviewHint, { color: colors.textSecondary }]}
                >
                  Tap a star to rate the app
                </Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= selectedStars;
                    return (
                      <Pressable
                        key={star}
                        onPress={() => handleStarPress(star)}
                        disabled={reviewBusy || submitting}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel={`${star} star${star === 1 ? "" : "s"}`}
                        style={styles.starBtn}
                      >
                        <MaterialIcons
                          name={filled ? "star" : "star-border"}
                          size={32}
                          color={
                            filled ? "#F59E0B" : colors.textPlaceholder
                          }
                        />
                      </Pressable>
                    );
                  })}
                </View>

                {reviewBusy ? (
                  <ActivityIndicator
                    color={colors.secondary}
                    style={styles.reviewSpinner}
                  />
                ) : null}

                {showFeedbackForm ? (
                  <View style={styles.feedbackWrap}>
                    <Text
                      style={[
                        styles.feedbackLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      What can we improve?
                    </Text>
                    <TextInput
                      style={[
                        styles.feedbackInput,
                        {
                          borderColor: colors.inputBorder,
                          backgroundColor: colors.inputBackground,
                          color: colors.inputText,
                        },
                      ]}
                      value={feedbackText}
                      onChangeText={setFeedbackText}
                      placeholder="Share a short note..."
                      placeholderTextColor={colors.inputPlaceholder}
                      multiline
                      maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
                      editable={!submitting}
                      textAlignVertical="top"
                    />
                    <View style={styles.feedbackActions}>
                      <Pressable
                        onPress={handleDismissFeedback}
                        disabled={submitting}
                        style={styles.feedbackSkip}
                      >
                        <Text
                          style={[
                            styles.feedbackSkipLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Not now
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={handleSubmitFeedback}
                        disabled={submitting}
                        style={[
                          styles.feedbackSubmit,
                          { backgroundColor: colors.secondary },
                          submitting && styles.feedbackSubmitDisabled,
                        ]}
                      >
                        {submitting ? (
                          <ActivityIndicator
                            color={theme.colors.onPrimary}
                            size="small"
                          />
                        ) : (
                          <Text style={styles.feedbackSubmitLabel}>
                            Submit
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : null}
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
              Library
            </Button>
            {nextChapterTitle && onNextChapter ? (
              <Button
                mode="contained"
                onPress={onNextChapter}
                icon="arrow-forward"
                contentStyle={{ flexDirection: "row-reverse" }}
                style={[styles.btnPrimary, { backgroundColor: colors.secondary }]}
                labelStyle={styles.btnLabelPrimary}
              >
                Next
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={onDismiss}
                style={[styles.btnPrimary, { backgroundColor: colors.secondary }]}
                labelStyle={styles.btnLabelPrimary}
              >
                Continue
              </Button>
            )}
          </Dialog.Actions>
        </KeyboardAvoidingView>
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
    content: {
      paddingTop: 20,
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
    reviewBlock: {
      width: "100%",
      marginTop: 8,
      paddingTop: 12,
      paddingBottom: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      alignItems: "center",
    },
    reviewPrompt: {
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
    },
    reviewHint: {
      fontSize: 12,
      marginTop: 2,
      marginBottom: 8,
      textAlign: "center",
    },
    starsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    starBtn: {
      padding: 2,
    },
    reviewSpinner: {
      marginTop: 10,
    },
    feedbackWrap: {
      width: "100%",
      marginTop: 12,
    },
    feedbackLabel: {
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 6,
    },
    feedbackInput: {
      minHeight: 72,
      maxHeight: 110,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
    },
    feedbackActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: 8,
      gap: 10,
    },
    feedbackSkip: {
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    feedbackSkipLabel: {
      fontSize: 14,
      fontWeight: "600",
    },
    feedbackSubmit: {
      minWidth: 96,
      minHeight: 40,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
    },
    feedbackSubmitDisabled: {
      opacity: 0.7,
    },
    feedbackSubmitLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.onPrimary,
    },
    actions: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      paddingTop: 4,
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
      borderRadius: 12,
    },
    btnLabelPrimary: {
      fontWeight: "700",
      fontSize: 14,
    },
  });

export default ChapterCompleteSheet;
