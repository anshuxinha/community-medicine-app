import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
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
} from "react-native-paper";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import { db } from "../config/firebase";
import { AppContext } from "../context/AppContext";
import {
  APP_FEEDBACK_COLLECTION,
  FEEDBACK_KIND_FEEDBACK,
  FEEDBACK_KIND_VIDEO_REQUEST,
  VIDEO_REQUEST_CATEGORIES,
  isVideoRequestItem,
} from "../services/feedbackService";
import { theme } from "../styles/theme";
import { useThemedStyles } from "../styles/useThemedStyles";

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

const formatWhen = (value) => {
  const ms = getSortValue(value);
  if (!ms) return "Unknown time";
  try {
    return new Date(ms).toLocaleString();
  } catch (_err) {
    return "Unknown time";
  }
};

const STATUS_TONES = {
  new: { backgroundColor: "#FEF3C7", textColor: "#92400E" },
  read: { backgroundColor: "#DBEAFE", textColor: "#1E40AF" },
  archived: { backgroundColor: "#E5E7EB", textColor: "#374151" },
};

const categoryLabelFor = (item) => {
  const id = item?.requestedCategory;
  if (!id) return null;
  return (
    VIDEO_REQUEST_CATEGORIES.find((entry) => entry.id === id)?.label || id
  );
};

const AdminAppFeedbackScreen = ({ route }) => {
  const { styles, colors } = useThemedStyles(createStyles);
  const { user } = useContext(AppContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("new");
  const initialKind =
    route?.params?.kind === FEEDBACK_KIND_VIDEO_REQUEST ||
    isVideoRequestItem(route?.params)
      ? FEEDBACK_KIND_VIDEO_REQUEST
      : FEEDBACK_KIND_FEEDBACK;
  const [kindFilter, setKindFilter] = useState(initialKind);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, APP_FEEDBACK_COLLECTION),
      (snapshot) => {
        const next = snapshot.docs
          .map((itemDoc) => ({
            id: itemDoc.id,
            ...itemDoc.data(),
          }))
          .sort(
            (left, right) =>
              getSortValue(right.createdAt) - getSortValue(left.createdAt),
          );
        setItems(next);
        setLoading(false);
      },
      (error) => {
        console.warn("Admin feedback subscription failed:", error?.message);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const feedbackItems = useMemo(
    () => items.filter((item) => !isVideoRequestItem(item)),
    [items],
  );
  const requestItems = useMemo(
    () => items.filter((item) => isVideoRequestItem(item)),
    [items],
  );
  const kindItems =
    kindFilter === FEEDBACK_KIND_VIDEO_REQUEST ? requestItems : feedbackItems;

  const filtered = useMemo(() => {
    if (filter === "all") return kindItems;
    return kindItems.filter((item) => (item.status || "new") === filter);
  }, [filter, kindItems]);

  const newFeedbackCount = useMemo(
    () =>
      feedbackItems.filter((item) => (item.status || "new") === "new").length,
    [feedbackItems],
  );
  const newRequestCount = useMemo(
    () =>
      requestItems.filter((item) => (item.status || "new") === "new").length,
    [requestItems],
  );
  const newCount =
    kindFilter === FEEDBACK_KIND_VIDEO_REQUEST
      ? newRequestCount
      : newFeedbackCount;
  const showingRequests = kindFilter === FEEDBACK_KIND_VIDEO_REQUEST;

  const setStatus = async (item, status) => {
    try {
      await updateDoc(doc(db, APP_FEEDBACK_COLLECTION, item.id), { status });
    } catch (err) {
      Alert.alert("Update failed", err?.message || "Could not update status.");
    }
  };

  const handleDelete = (item) => {
    const isRequest = isVideoRequestItem(item);
    Alert.alert(
      isRequest ? "Delete video request?" : "Delete feedback?",
      isRequest
        ? "This permanently removes the request from the admin queue."
        : "This permanently removes the note from the admin queue.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, APP_FEEDBACK_COLLECTION, item.id));
            } catch (err) {
              Alert.alert(
                "Delete failed",
                err?.message || "Could not delete feedback.",
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
            Sign in with your admin account to read feedback and video requests.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {showingRequests ? "Video Requests" : "App Feedback"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {showingRequests
              ? "Topics users asked us to record from the Videos tab."
              : "Notes from the review prompt and chapter ratings."}
            {newCount > 0 ? ` ${newCount} new.` : ""}
          </Text>
        </View>

        <View style={styles.kindRow}>
          {[
            {
              key: FEEDBACK_KIND_FEEDBACK,
              label: "Feedback",
              count: newFeedbackCount,
            },
            {
              key: FEEDBACK_KIND_VIDEO_REQUEST,
              label: "Video requests",
              count: newRequestCount,
            },
          ].map((entry) => {
            const selected = kindFilter === entry.key;
            return (
              <TouchableOpacity
                key={entry.key}
                style={[styles.kindChip, selected && styles.kindChipSelected]}
                onPress={() => setKindFilter(entry.key)}
              >
                <Text
                  style={[
                    styles.kindChipLabel,
                    selected && styles.kindChipLabelSelected,
                  ]}
                >
                  {entry.label}
                </Text>
                {entry.count > 0 ? (
                  <View
                    style={[
                      styles.kindCount,
                      selected && styles.kindCountSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.kindCountLabel,
                        selected && styles.kindCountLabelSelected,
                      ]}
                    >
                      {entry.count}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.filterRow}>
          {["new", "read", "archived", "all"].map((key) => {
            const selected = filter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                onPress={() => setFilter(key)}
              >
                <Text
                  style={[
                    styles.filterChipLabel,
                    selected && styles.filterChipLabelSelected,
                  ]}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator color={theme.colors.secondary} />
            <Text style={styles.loadingText}>
              {showingRequests ? "Loading requests..." : "Loading feedback..."}
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centeredState}>
            <MaterialIcons
              name={showingRequests ? "video-library" : "inbox"}
              size={46}
              color={colors.textTertiary}
            />
            <Text style={styles.emptyTitle}>
              {showingRequests ? "No video requests here" : "No feedback here"}
            </Text>
            <Text style={styles.emptyText}>
              {filter === "new"
                ? showingRequests
                  ? "No new requests yet. When someone asks for a lecture from the Videos tab, they show up here."
                  : "No new notes yet. When someone submits from the review flow, they show up here."
                : "Nothing matches this filter."}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {filtered.map((item) => {
              const status = item.status || "new";
              const tone = STATUS_TONES[status] || STATUS_TONES.new;
              const isRequest = isVideoRequestItem(item);
              const categoryLabel = categoryLabelFor(item);
              const userLabel =
                item.userEmail || item.username || "Anonymous user";
              return (
                <Card key={item.id} style={styles.card}>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleWrap}>
                        <Text style={styles.cardTitle}>
                          {isRequest && item.topic ? item.topic : userLabel}
                        </Text>
                        <Text style={styles.cardMeta}>
                          {isRequest ? `${userLabel} · ` : ""}
                          {formatWhen(item.createdAt)} · {item.platform || "?"} · v
                          {item.appVersion || "?"}
                          {item.source ? ` · ${item.source}` : ""}
                        </Text>
                        {isRequest && categoryLabel ? (
                          <View style={styles.categoryPill}>
                            <Text style={styles.categoryPillLabel}>
                              {categoryLabel}
                            </Text>
                          </View>
                        ) : null}
                        {typeof item.rating === "number" ? (
                          <Text style={styles.ratingLine}>
                            {"★".repeat(Math.min(5, Math.max(0, item.rating)))}
                            {"☆".repeat(Math.max(0, 5 - item.rating))}
                            {` (${item.rating}/5)`}
                          </Text>
                        ) : null}
                      </View>
                      <Chip
                        compact
                        style={{ backgroundColor: tone.backgroundColor }}
                        textStyle={{ color: tone.textColor, fontWeight: "700" }}
                      >
                        {status.toUpperCase()}
                      </Chip>
                    </View>

                    <Text style={styles.message}>{item.message}</Text>

                    <View style={styles.actionRow}>
                      {status !== "read" ? (
                        <Button
                          mode="outlined"
                          compact
                          onPress={() => setStatus(item, "read")}
                        >
                          Mark read
                        </Button>
                      ) : null}
                      {status !== "archived" ? (
                        <Button
                          mode="text"
                          compact
                          onPress={() => setStatus(item, "archived")}
                        >
                          Archive
                        </Button>
                      ) : null}
                      {status === "archived" ? (
                        <Button
                          mode="outlined"
                          compact
                          onPress={() => setStatus(item, "new")}
                        >
                          Restore
                        </Button>
                      ) : null}
                      <Button
                        mode="text"
                        compact
                        textColor={theme.colors.error}
                        onPress={() => handleDelete(item)}
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
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundMain,
    },
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    header: {
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textTitle,
    },
    headerSubtitle: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    kindRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    kindChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    kindChipSelected: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primaryMuted,
    },
    kindChipLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    kindChipLabelSelected: {
      color: theme.colors.secondary,
    },
    kindCount: {
      minWidth: 22,
      height: 22,
      paddingHorizontal: 6,
      borderRadius: 11,
      backgroundColor: colors.surfacePrimary,
      alignItems: "center",
      justifyContent: "center",
    },
    kindCountSelected: {
      backgroundColor: theme.colors.secondary,
    },
    kindCountLabel: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.textSecondary,
    },
    kindCountLabelSelected: {
      color: theme.colors.onPrimary,
    },
    filterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.surfaceSecondary,
    },
    filterChipSelected: {
      backgroundColor: colors.primarySoft,
    },
    filterChipLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    filterChipLabelSelected: {
      color: theme.colors.secondary,
    },
    centeredState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 10,
    },
    loadingText: {
      color: colors.textSecondary,
    },
    lockedTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textTitle,
      textAlign: "center",
    },
    lockedText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: "center",
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.textTitle,
      textAlign: "center",
    },
    emptyText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: "center",
    },
    scrollContent: {
      paddingBottom: 32,
      gap: 12,
    },
    card: {
      backgroundColor: colors.surfacePrimary,
      marginBottom: 4,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 10,
    },
    cardTitleWrap: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.textTitle,
    },
    cardMeta: {
      marginTop: 2,
      fontSize: 12,
      color: colors.textTertiary,
    },
    ratingLine: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: "600",
      color: colors.warningStrong || colors.warningText || colors.textSecondary,
    },
    categoryPill: {
      alignSelf: "flex-start",
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
    },
    categoryPillLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.secondary,
    },
    message: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary || colors.textTitle,
      marginBottom: 12,
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      alignItems: "center",
    },
  });

export default AdminAppFeedbackScreen;
