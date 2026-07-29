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
import { registerOpenFeedbackForm } from "../utils/reviewPrompt";

/**
 * Global modal opened when the user taps "Not Really" on the review prompt.
 * Submits feedback to Firestore for the admin queue.
 */
const ReviewFeedbackModal = () => {
  const { styles, colors } = useThemedStyles(createStyles);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const handlersRef = useRef({});

  useEffect(() => {
    return registerOpenFeedbackForm((handlers = {}) => {
      handlersRef.current = handlers;
      setMessage("");
      setSubmitting(false);
      setVisible(true);
    });
  }, []);

  const finish = () => {
    const { onSoftDismiss } = handlersRef.current || {};
    setVisible(false);
    setMessage("");
    setSubmitting(false);
    handlersRef.current = {};
    onSoftDismiss?.();
  };

  const handleSkip = () => {
    if (submitting) return;
    finish();
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      Alert.alert(
        "Add a note",
        "Please share a short note about what we can improve, or tap Skip.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await submitAppFeedback(trimmed, {
        source: "review_prompt_negative",
      });
      Alert.alert(
        "Thank you",
        "Your feedback was sent. We read every note and use it to improve STROMA.",
        [{ text: "OK", onPress: finish }],
      );
    } catch (err) {
      console.warn("ReviewFeedbackModal: submit failed", err?.message);
      Alert.alert(
        "Could not send",
        "Something went wrong sending your feedback. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
      supportedOrientations={ALL_ORIENTATIONS}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdropPress} onPress={handleSkip} />
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialIcons
              name="rate-review"
              size={28}
              color={theme.colors.secondary}
            />
          </View>
          <Text style={styles.title}>How can we improve?</Text>
          <Text style={styles.subtitle}>
            Sorry this has not been helpful enough. Tell us what would make
            STROMA better for you.
          </Text>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="What should we fix or add?"
            placeholderTextColor={colors.inputPlaceholder}
            multiline
            maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
            editable={!submitting}
            textAlignVertical="top"
            autoFocus
          />
          <Text style={styles.counter}>
            {message.trim().length}/{FEEDBACK_MESSAGE_MAX_LENGTH}
          </Text>
          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnSecondary]}
              onPress={handleSkip}
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
              onPress={handleSubmit}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Submit feedback"
            >
              {submitting ? (
                <ActivityIndicator color={theme.colors.onPrimary} size="small" />
              ) : (
                <Text style={styles.btnPrimaryLabel}>Submit</Text>
              )}
            </Pressable>
          </View>
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
      padding: 20,
      zIndex: 1,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      alignSelf: "center",
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
      marginBottom: 14,
    },
    input: {
      minHeight: 110,
      maxHeight: 180,
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

export default ReviewFeedbackModal;
