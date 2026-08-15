import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { ALL_ORIENTATIONS } from "../constants/orientations";
import {
  FEEDBACK_MESSAGE_MAX_LENGTH,
  submitAppFeedback,
} from "../services/feedbackService";
import { theme } from "../styles/theme";
import { useThemedStyles } from "../styles/useThemedStyles";
import {
  registerOpenReviewRequest,
  requestNativeStoreReview,
  REVIEW_REQUEST_VARIANTS,
  takeNextReviewCopyIndex,
  waitForUiSettle,
} from "../utils/reviewPrompt";

/**
 * Standalone Review Request. Shown after chapter complete when the 5-day
 * clock allows it, until the user taps 5 stars.
 */
const ReviewRequestModal = () => {
  const { styles, colors } = useThemedStyles(createStyles);
  const [visible, setVisible] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [copyIndex, setCopyIndex] = useState(0);
  const uidRef = useRef(undefined);

  useEffect(() => {
    return registerOpenReviewRequest((handlers = {}) => {
      uidRef.current = handlers.uid;
      setSelectedStars(0);
      setFeedbackText("");
      setSubmitting(false);
      setReviewBusy(false);
      setVisible(true);
      void (async () => {
        const next = await takeNextReviewCopyIndex(handlers.uid);
        setCopyIndex(next);
      })();
    });
  }, []);

  const copy = REVIEW_REQUEST_VARIANTS[copyIndex] || REVIEW_REQUEST_VARIANTS[0];
  const showFeedbackForm = selectedStars >= 1 && selectedStars <= 4;

  const finish = () => {
    setVisible(false);
    setSelectedStars(0);
    setFeedbackText("");
    setSubmitting(false);
    setReviewBusy(false);
    uidRef.current = undefined;
  };

  const handleClose = () => {
    if (submitting || reviewBusy) return;
    finish();
  };

  const handleStarPress = async (star) => {
    if (reviewBusy || submitting) return;

    if (star === 5) {
      setSelectedStars(5);
      setReviewBusy(true);
      setVisible(false);
      const uid = uidRef.current;
      try {
        await waitForUiSettle(500);
        await requestNativeStoreReview({
          markRated: true,
          openStoreListing: true,
          uid,
        });
      } catch (err) {
        console.warn("ReviewRequestModal: 5-star review failed", err?.message);
      } finally {
        setReviewBusy(false);
        finish();
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

    setSubmitting(true);
    try {
      await submitAppFeedback(trimmed, {
        source: "review_request_rating",
        rating: selectedStars,
      });
      Alert.alert(
        "Thank you",
        "Your feedback was sent. We read every note and use it to improve STROMA.",
        [{ text: "OK", onPress: finish }],
      );
    } catch (err) {
      console.warn("ReviewRequestModal: feedback failed", err?.message);
      Alert.alert(
        "Could not send",
        err?.message || "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      supportedOrientations={ALL_ORIENTATIONS}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdropPress} onPress={handleClose} />
        <View style={styles.card}>
          <View style={styles.topBar}>
            <View style={styles.topBarSpacer} />
            <Pressable
              onPress={handleClose}
              hitSlop={10}
              disabled={submitting || reviewBusy}
              accessibilityRole="button"
              accessibilityLabel="Close review request"
              style={styles.closeBtn}
            >
              <MaterialIcons
                name="close"
                size={22}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.body}</Text>
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
                    size={36}
                    color={filled ? "#F59E0B" : colors.textPlaceholder}
                  />
                </Pressable>
              );
            })}
          </View>

          {reviewBusy ? (
            <ActivityIndicator
              color={theme.colors.secondary}
              style={styles.spinner}
            />
          ) : null}

          {showFeedbackForm ? (
            <View style={styles.feedbackWrap}>
              <Text style={styles.feedbackLabel}>What can we improve?</Text>
              <TextInput
                style={styles.input}
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="Share a short note..."
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
                editable={!submitting}
                textAlignVertical="top"
              />
              <Text style={styles.counter}>
                {feedbackText.trim().length}/{FEEDBACK_MESSAGE_MAX_LENGTH}
              </Text>
              <View style={styles.actions}>
                <Pressable
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={handleClose}
                  disabled={submitting}
                  accessibilityRole="button"
                  accessibilityLabel="Skip feedback"
                >
                  <Text style={styles.btnSecondaryLabel}>Skip</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.btn,
                    styles.btnPrimary,
                    submitting && styles.btnDisabled,
                  ]}
                  onPress={handleSubmitFeedback}
                  disabled={submitting}
                  accessibilityRole="button"
                  accessibilityLabel="Submit feedback"
                >
                  {submitting ? (
                    <ActivityIndicator
                      color={theme.colors.onPrimary}
                      size="small"
                    />
                  ) : (
                    <Text style={styles.btnPrimaryLabel}>Submit</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      backgroundColor: colors.overlay,
    },
    backdropPress: {
      ...StyleSheet.absoluteFillObject,
    },
    card: {
      backgroundColor: colors.surfacePrimary,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: 4,
      zIndex: 1,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      minHeight: 36,
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
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textTitle,
      textAlign: "center",
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 16,
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
    spinner: {
      marginTop: 12,
    },
    feedbackWrap: {
      width: "100%",
      marginTop: 16,
    },
    feedbackLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 6,
    },
    input: {
      minHeight: 88,
      maxHeight: 140,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.inputText,
    },
    counter: {
      alignSelf: "flex-end",
      marginTop: 4,
      marginBottom: 12,
      fontSize: 12,
      color: colors.textTertiary,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
    },
    btn: {
      flex: 1,
      minHeight: 44,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    btnSecondary: {
      backgroundColor: colors.surfaceSecondary,
    },
    btnSecondaryLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    btnPrimary: {
      backgroundColor: theme.colors.secondary,
    },
    btnPrimaryLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.onPrimary,
    },
    btnDisabled: {
      opacity: 0.7,
    },
  });

export default ReviewRequestModal;
