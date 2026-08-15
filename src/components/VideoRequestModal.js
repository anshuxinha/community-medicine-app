import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { ALL_ORIENTATIONS } from "../constants/orientations";
import {
  FEEDBACK_KIND_VIDEO_REQUEST,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  VIDEO_REQUEST_CATEGORIES,
  VIDEO_REQUEST_SOURCE,
  VIDEO_REQUEST_TOPIC_MAX_LENGTH,
  buildVideoRequestMessage,
  submitAppFeedback,
} from "../services/feedbackService";
import { theme } from "../styles/theme";
import { useThemedStyles } from "../styles/useThemedStyles";

/**
 * Videos-tab modal for requesting a new lecture.
 * Submits into the same admin queue as app feedback, tagged as a video request.
 */
const VideoRequestModal = ({ visible, onClose }) => {
  const { styles, colors } = useThemedStyles(createStyles);
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [categoryId, setCategoryId] = useState(
    VIDEO_REQUEST_CATEGORIES[0].id,
  );
  const [submitting, setSubmitting] = useState(false);

  const resetAndClose = () => {
    setTopic("");
    setDetails("");
    setCategoryId(VIDEO_REQUEST_CATEGORIES[0].id);
    setSubmitting(false);
    onClose?.();
  };

  const handleClose = () => {
    if (submitting) return;
    resetAndClose();
  };

  const handleSubmit = async () => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      Alert.alert(
        "Add a topic",
        "Tell us the lecture or case you would like us to record.",
      );
      return;
    }

    const category = VIDEO_REQUEST_CATEGORIES.find(
      (item) => item.id === categoryId,
    );
    const message = buildVideoRequestMessage({
      topic: trimmedTopic,
      details,
      categoryLabel: category?.label,
    });
    if (message.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
      Alert.alert(
        "Too long",
        "Please shorten the details a little so the request can be sent.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await submitAppFeedback(message, {
        source: VIDEO_REQUEST_SOURCE,
        kind: FEEDBACK_KIND_VIDEO_REQUEST,
        topic: trimmedTopic,
        requestedCategory: category?.id,
      });
      Alert.alert(
        "Request sent",
        "Thanks. We use these notes to plan upcoming lectures.",
        [{ text: "OK", onPress: resetAndClose }],
      );
    } catch (err) {
      console.warn("VideoRequestModal: submit failed", err?.message);
      Alert.alert(
        "Could not send",
        err?.message === "Sign in to send feedback."
          ? "Sign in to request a video."
          : "Something went wrong sending your request. Please try again.",
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
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconWrap}>
              <MaterialIcons
                name="video-call"
                size={28}
                color={theme.colors.secondary}
              />
            </View>
            <Text style={styles.title}>Request a video</Text>
            <Text style={styles.subtitle}>
              Missing a lecture? Tell us the topic and we will add it to the
              recording queue.
            </Text>

            <Text style={styles.fieldLabel}>Topic</Text>
            <TextInput
              style={styles.topicInput}
              value={topic}
              onChangeText={setTopic}
              placeholder="e.g. Screening tests in epidemiology"
              placeholderTextColor={colors.inputPlaceholder}
              maxLength={VIDEO_REQUEST_TOPIC_MAX_LENGTH}
              editable={!submitting}
              autoFocus
              returnKeyType="next"
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chipRow}>
              {VIDEO_REQUEST_CATEGORIES.map((item) => {
                const selected = categoryId === item.id;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setCategoryId(item.id)}
                    disabled={submitting}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={item.label}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        selected && styles.chipLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Details (optional)</Text>
            <TextInput
              style={styles.detailsInput}
              value={details}
              onChangeText={setDetails}
              placeholder="What to cover, exam angle, or why it would help."
              placeholderTextColor={colors.inputPlaceholder}
              multiline
              maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
              editable={!submitting}
              textAlignVertical="top"
            />
            <Text style={styles.counter}>
              {details.trim().length}/{FEEDBACK_MESSAGE_MAX_LENGTH}
            </Text>

            <View style={styles.actions}>
              <Pressable
                style={[styles.btn, styles.btnSecondary]}
                onPress={handleClose}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Cancel video request"
              >
                <Text style={styles.btnSecondaryLabel}>Cancel</Text>
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
                accessibilityLabel="Submit video request"
              >
                {submitting ? (
                  <ActivityIndicator
                    color={theme.colors.onPrimary}
                    size="small"
                  />
                ) : (
                  <Text style={styles.btnPrimaryLabel}>Send request</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
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
      borderRadius: 18,
      padding: 20,
      zIndex: 1,
      maxHeight: "88%",
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
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: colors.textTertiary,
      marginBottom: 6,
    },
    topicInput: {
      minHeight: 46,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.inputText,
      marginBottom: 14,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 14,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipSelected: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    chipLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    chipLabelSelected: {
      color: theme.colors.secondary,
    },
    detailsInput: {
      minHeight: 96,
      maxHeight: 150,
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
      marginBottom: 14,
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

export default VideoRequestModal;
