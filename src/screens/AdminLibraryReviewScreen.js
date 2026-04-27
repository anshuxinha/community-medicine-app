import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Dialog,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import { db } from "../config/firebase";
import { AppContext } from "../context/AppContext";
import { theme } from "../styles/theme";

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
  pending: { backgroundColor: "#FEF3C7", textColor: "#92400E" },
  approved: { backgroundColor: "#DCFCE7", textColor: "#166534" },
  superseded: { backgroundColor: "#E5E7EB", textColor: "#374151" },
};

const AdminLibraryReviewScreen = () => {
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
    () =>
      suggestions.filter((item) => item.status === "pending" || item.status === "approved"),
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

  const handleApprove = async () => {
    if (!selectedSuggestion) return;
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
      Alert.alert("Approved", "The Library override is now live in the app.");
    } catch (error) {
      Alert.alert(
        "Approval failed",
        error?.message || "Could not approve this suggestion.",
      );
    } finally {
      setSaving(false);
    }
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

  if (!user?.isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredState}>
          <MaterialIcons name="lock-outline" size={44} color={theme.colors.error} />
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
            <ActivityIndicator color={theme.colors.secondary} />
            <Text style={styles.loadingText}>Loading suggestions...</Text>
          </View>
        ) : pendingSuggestions.length === 0 ? (
          <View style={styles.centeredState}>
            <MaterialIcons
              name="playlist-add-check-circle"
              size={46}
              color={theme.colors.chartGreen}
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
                            textColor={theme.colors.secondary}
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
                        textColor={theme.colors.error}
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

      <Portal>
        <Dialog
          visible={Boolean(selectedSuggestion)}
          onDismiss={saving ? undefined : closeEditor}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            {selectedSuggestion?.libraryTitle || "Edit suggestion"}
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <Text style={styles.dialogLabel}>Summary reason</Text>
              <TextInput
                mode="outlined"
                value={editedReason}
                onChangeText={setEditedReason}
                multiline
                style={styles.input}
              />

              <Text style={styles.dialogLabel}>Original content</Text>
              <Text style={styles.readOnlyBlock}>
                {selectedSuggestion?.originalContent || ""}
              </Text>

              <Text style={styles.dialogLabel}>Proposed content</Text>
              <TextInput
                mode="outlined"
                value={editedContent}
                onChangeText={setEditedContent}
                multiline
                style={styles.contentInput}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions style={styles.dialogActions}>
            <Button onPress={closeEditor} disabled={saving}>
              Cancel
            </Button>
            <Button onPress={handleSaveDraft} loading={saving} disabled={saving}>
              Save
            </Button>
            <Button
              mode="contained"
              onPress={handleApprove}
              loading={saving}
              disabled={saving}
            >
              Approve Live
            </Button>
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.textTitle,
  },
  headerSubtitle: {
    marginTop: 6,
    color: theme.colors.textSecondary,
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
    color: theme.colors.textSecondary,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textTitle,
  },
  emptyText: {
    marginTop: 8,
    textAlign: "center",
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  lockedTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textTitle,
  },
  lockedText: {
    marginTop: 8,
    textAlign: "center",
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: theme.colors.surfacePrimary,
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
    color: theme.colors.textTitle,
  },
  cardMeta: {
    marginTop: 4,
    color: theme.colors.textTertiary,
  },
  summaryReason: {
    marginTop: 12,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  metricText: {
    color: theme.colors.textSecondary,
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
  dialog: {
    backgroundColor: theme.colors.surfacePrimary,
  },
  dialogTitle: {
    color: theme.colors.textTitle,
    fontWeight: "700",
  },
  dialogScrollArea: {
    borderColor: "transparent",
    paddingHorizontal: 20,
  },
  dialogLabel: {
    marginTop: 8,
    marginBottom: 8,
    color: theme.colors.textTitle,
    fontWeight: "700",
  },
  input: {
    backgroundColor: theme.colors.surfacePrimary,
  },
  contentInput: {
    minHeight: 220,
    backgroundColor: theme.colors.surfacePrimary,
  },
  readOnlyBlock: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  dialogActions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: "space-between",
  },
});

export default AdminLibraryReviewScreen;
