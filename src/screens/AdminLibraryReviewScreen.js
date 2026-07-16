import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Text,
  TextInput,
} from "react-native-paper";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import { db } from "../config/firebase";
import { AppContext } from "../context/AppContext";
import { useThemedStyles } from "../styles/useThemedStyles";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const getSortValue = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === "function") {
    return value.toDate().getTime();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }
  return parsed.getTime();
};

const STATUS_TONES = {
  pending: { backgroundColor: colors.warningBackground, textColor: colors.warningText },
  approved: { backgroundColor: colors.successSoft, textColor: colors.successStrong },
  superseded: { backgroundColor: colors.border, textColor: colors.textBody },
};

/**
 * Fetch all Expo push tokens from the users collection and send
 * a broadcast notification about a library update.
 */
const sendLibraryUpdateNotification = async (libraryTitle) => {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const tokens = [];
    usersSnapshot.forEach((userDoc) => {
      const data = userDoc.data();
      const token = data.pushToken;
      if (
        typeof token === "string" &&
        (token.startsWith("ExponentPushToken[") ||
          token.startsWith("ExpoPushToken["))
      ) {
        tokens.push(token);
      }
    });

    if (tokens.length === 0) return;

    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title: "Library Updated",
      body: `"${libraryTitle}" has been updated with the latest information. Tap to check it out.`,
      data: { screen: "Dashboard" },
    }));

    // Expo recommends up to 100 per request
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
    }
  } catch (err) {
    console.warn("Failed to send library update notification:", err?.message);
  }
};

const AdminLibraryReviewScreen = () => {
  const { styles, colors } = useThemedStyles(createStyles);

  const { user, refreshLibraryContent } = useContext(AppContext);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedReason, setEditedReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "libraryReviewSuggestions"),
      (snapshot) => {
        const nextSuggestions = snapshot.docs
          .map((itemDoc) => ({
            id: itemDoc.id,
            ...itemDoc.data(),
          }))
          .filter((item) => item.status !== "deleted")
          .sort(
            (left, right) =>
              getSortValue(right.generatedAt) - getSortValue(left.generatedAt),
          );

        setSuggestions(nextSuggestions);
        setLoading(false);
      },
      (error) => {
        console.warn("Admin review queue subscription failed:", error?.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const pendingSuggestions = useMemo(
    () => suggestions.filter((item) => item.status === "pending"),
    [suggestions],
  );

  const openEditor = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setEditedContent(suggestion.proposedContent || "");
    setEditedReason(suggestion.summaryReason || "");
  };

  const closeEditor = () => {
    setSelectedSuggestion(null);
    setEditedContent("");
    setEditedReason("");
  };

  const handleSaveDraft = async () => {
    if (!selectedSuggestion) return;
    setSaving(true);

    try {
      await updateDoc(doc(db, "libraryReviewSuggestions", selectedSuggestion.id), {
        proposedContent: editedContent,
        summaryReason: editedReason,
        lastEditedAt: serverTimestamp(),
        editedBy: user?.email || "admin",
      });
      closeEditor();
    } catch (error) {
      Alert.alert("Save failed", error?.message || "Could not save the draft.");
    } finally {
      setSaving(false);
    }
  };

  const applyApproval = async (shouldNotify) => {
    setSaving(true);

    try {
      const approvedAt = new Date().toISOString();
      const overridePayload = {
        libraryId: selectedSuggestion.libraryId,
        libraryTitle: selectedSuggestion.libraryTitle,
        proposalId: selectedSuggestion.proposalId,
        proposedContent: editedContent,
        updatedSegments: selectedSuggestion.updatedSegments || [],
        status: "active",
        summaryReason: editedReason,
        sourceUpdates: selectedSuggestion.sourceUpdates || [],
        approvedAt,
        approvedBy: user?.email || "admin",
      };

      await setDoc(
        doc(db, "libraryContentOverrides", String(selectedSuggestion.libraryId)),
        overridePayload,
      );

      await updateDoc(doc(db, "libraryReviewSuggestions", selectedSuggestion.id), {
        proposedContent: editedContent,
        summaryReason: editedReason,
        status: "approved",
        approvedAt,
        approvedBy: user?.email || "admin",
        lastEditedAt: serverTimestamp(),
        editedBy: user?.email || "admin",
      });

      await refreshLibraryContent?.();
      closeEditor();

      if (shouldNotify) {
        Alert.alert("Approved", "The Library override is now live. A notification will be sent to all users.");
        sendLibraryUpdateNotification(
          selectedSuggestion.libraryTitle || "Community Medicine Library",
        );
      } else {
        Alert.alert("Approved", "The Library override is now live. No notification was sent.");
      }
    } catch (error) {
      Alert.alert(
        "Approval failed",
        error?.message || "Could not approve this suggestion.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = () => {
    if (!selectedSuggestion) return;

    Alert.alert(
      "Approve Live",
      "This will make the change live for all users. Do you also want to send a push notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve Only",
          onPress: () => applyApproval(false),
        },
        {
          text: "Approve + Notify",
          style: "default",
          onPress: () => applyApproval(true),
        },
      ],
    );
  };

  const handleDelete = (suggestion) => {
    Alert.alert(
      "Delete suggestion",
      "This will remove the suggestion from the admin queue. If it is already approved, the live override will also be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (suggestion.status === "approved") {
                await deleteDoc(
                  doc(db, "libraryContentOverrides", String(suggestion.libraryId)),
                );
                await refreshLibraryContent?.();
              }
              await deleteDoc(doc(db, "libraryReviewSuggestions", suggestion.id));
            } catch (error) {
              Alert.alert(
                "Delete failed",
                error?.message || "Could not delete this suggestion.",
              );
            }
          },
        },
      ],
    );
  };

  const renderChangeItem = (change, index) => {
    const original = change.originalLine || change.original || "";
    const replacement = change.replacementLine || change.replacement || "";
    return (
      <View key={index} style={styles.changeItem}>
        <Text style={styles.changeLabel}>Change {index + 1}</Text>
        <View style={styles.changeDiffRow}>
          <View style={styles.changeOld}>
            <Text style={styles.changePrefixOld}>−</Text>
            <Text style={styles.changeTextOld} selectable>
              {original}
            </Text>
          </View>
          <View style={styles.changeNew}>
            <Text style={styles.changePrefixNew}>+</Text>
            <Text style={styles.changeTextNew} selectable>
              {replacement}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (!user?.isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredState}>
          <MaterialIcons name="lock-outline" size={44} color={colors.error} />
          <Text style={styles.lockedTitle}>Admin Access Required</Text>
          <Text style={styles.lockedText}>
            Sign in with your admin account to review and publish Library suggestions.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Library Review Queue</Text>
          <Text style={styles.headerSubtitle}>
            Approve, edit, or delete staged textbook updates before they go live.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator color={colors.secondary} />
            <Text style={styles.loadingText}>Loading suggestions...</Text>
          </View>
        ) : pendingSuggestions.length === 0 ? (
          <View style={styles.centeredState}>
            <MaterialIcons
              name="playlist-add-check-circle"
              size={46}
              color={colors.chartGreen}
            />
            <Text style={styles.emptyTitle}>No pending suggestions</Text>
            <Text style={styles.emptyText}>
              The weekly verification queue is empty right now.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {pendingSuggestions.map((suggestion) => {
              const tone =
                STATUS_TONES[suggestion.status] || STATUS_TONES.pending;
              const changeCount = Array.isArray(suggestion.changes)
                ? suggestion.changes.length
                : 0;
              const sourceCount = Array.isArray(suggestion.sourceUpdates)
                ? suggestion.sourceUpdates.length
                : 0;

              return (
                <Card key={suggestion.id} style={styles.card}>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleWrap}>
                        <Text style={styles.cardTitle}>
                          {suggestion.libraryTitle || "Untitled suggestion"}
                        </Text>
                        <Text style={styles.cardMeta}>
                          Library ID {suggestion.libraryId} · Root {suggestion.rootChapterId}
                        </Text>
                      </View>
                      <Chip
                        compact
                        style={{ backgroundColor: tone.backgroundColor }}
                        textStyle={{ color: tone.textColor, fontWeight: "700" }}
                      >
                        {(suggestion.status || "pending").toUpperCase()}
                      </Chip>
                    </View>

                    <Text style={styles.summaryReason}>
                      {suggestion.summaryReason || "No summary reason provided."}
                    </Text>

                    <View style={styles.metricRow}>
                      <Text style={styles.metricText}>{changeCount} exact line change(s)</Text>
                      <Text style={styles.metricText}>{sourceCount} source update(s)</Text>
                    </View>

                    {Array.isArray(suggestion.sourceUpdates) &&
                    suggestion.sourceUpdates.length > 0 ? (
                      <View style={styles.sourcesBlock}>
                        {suggestion.sourceUpdates.slice(0, 2).map((sourceUpdate) => (
                          <Button
                            key={`${suggestion.id}:${sourceUpdate.link}`}
                            mode="text"
                            compact
                            textColor={colors.secondary}
                            onPress={() => Linking.openURL(sourceUpdate.link)}
                            contentStyle={styles.sourceButtonContent}
                          >
                            {sourceUpdate.title}
                          </Button>
                        ))}
                      </View>
                    ) : null}

                    <View style={styles.actionRow}>
                      <Button mode="outlined" onPress={() => openEditor(suggestion)}>
                        Edit
                      </Button>
                      <Button
                        mode="text"
                        textColor={colors.error}
                        onPress={() => handleDelete(suggestion)}
                      >
                        Delete
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ── Full-screen Editor Modal ── */}
      <Modal
        visible={Boolean(selectedSuggestion)}
        animationType="slide"
        onRequestClose={saving ? undefined : closeEditor}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.modalSafeArea}>
          {/* Fixed header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={closeEditor}
              disabled={saving}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={24} color={colors.textTitle} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              {selectedSuggestion?.libraryTitle || "Edit suggestion"}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.dialogLabel}>Summary reason</Text>
            <TextInput
              mode="outlined"
              value={editedReason}
              onChangeText={setEditedReason}
              multiline
              style={styles.input}
            />

            <Text style={styles.dialogLabel}>Line Changes</Text>
            {Array.isArray(selectedSuggestion?.changes) &&
            selectedSuggestion.changes.length > 0 ? (
              selectedSuggestion.changes.map(renderChangeItem)
            ) : (
              <Text style={styles.noChangesText}>
                No exact line changes recorded. The proposed content is a full replacement.
              </Text>
            )}

            <Text style={styles.dialogLabel}>Proposed content (editable)</Text>
            <TextInput
              mode="outlined"
              value={editedContent}
              onChangeText={setEditedContent}
              multiline
              style={styles.contentInput}
            />
          </ScrollView>

          {/* Fixed bottom actions */}
          <View style={styles.modalActions}>
            <Button onPress={closeEditor} disabled={saving}>
              Cancel
            </Button>
            <Button onPress={handleSaveDraft} loading={saving} disabled={saving}>
              Save Draft
            </Button>
            <Button
              mode="contained"
              onPress={handleApprove}
              loading={saving}
              disabled={saving}
              buttonColor={colors.chartGreen}
            >
              Approve Live
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textTitle,
  },
  headerSubtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  scrollContent: {
    paddingBottom: 28,
    gap: 14,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: colors.textTitle,
  },
  emptyText: {
    marginTop: 8,
    textAlign: "center",
    color: colors.textSecondary,
    lineHeight: 20,
  },
  lockedTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: colors.textTitle,
  },
  lockedText: {
    marginTop: 8,
    textAlign: "center",
    color: colors.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 18,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textTitle,
  },
  cardMeta: {
    marginTop: 4,
    color: colors.textTertiary,
  },
  summaryReason: {
    marginTop: 12,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  metricText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  sourcesBlock: {
    marginTop: 12,
    alignItems: "flex-start",
  },
  sourceButtonContent: {
    justifyContent: "flex-start",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  // ── Full-screen Modal ──
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
    backgroundColor: colors.surfacePrimary,
  },
  modalHeaderTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textTitle,
    textAlign: "center",
    marginHorizontal: 12,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSecondary,
    backgroundColor: colors.surfacePrimary,
  },
  dialogLabel: {
    marginTop: 16,
    marginBottom: 8,
    color: colors.textTitle,
    fontWeight: "700",
    fontSize: 15,
  },
  input: {
    backgroundColor: colors.surfacePrimary,
  },
  contentInput: {
    minHeight: 180,
    backgroundColor: colors.surfacePrimary,
  },
  noChangesText: {
    color: colors.textSecondary,
    fontStyle: "italic",
    lineHeight: 20,
  },

  // ── Line change diff items ──
  changeItem: {
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: colors.surfacePrimary,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.surfaceSecondary,
  },
  changeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textTertiary,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  changeDiffRow: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  changeOld: {
    flexDirection: "row",
    backgroundColor: colors.errorLight,
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
  },
  changePrefixOld: {
    color: colors.errorStrong,
    fontWeight: "700",
    fontSize: 14,
    marginRight: 6,
    width: 16,
  },
  changeTextOld: {
    flex: 1,
    color: colors.errorStrong,
    fontSize: 13,
    lineHeight: 19,
  },
  changeNew: {
    flexDirection: "row",
    backgroundColor: colors.successSoft,
    borderRadius: 6,
    padding: 8,
  },
  changePrefixNew: {
    color: colors.successStrong,
    fontWeight: "700",
    fontSize: 14,
    marginRight: 6,
    width: 16,
  },
  changeTextNew: {
    flex: 1,
    color: "#14532D",
    fontSize: 13,
    lineHeight: 19,
  },
});

export default AdminLibraryReviewScreen;
