import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Alert,
  Share,
  Image,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Text, Button, IconButton, Divider, Chip } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useSession } from "../context/AppContext";
import { useThemedStyles } from "../styles/useThemedStyles";
import { theme, useResponsive } from "../styles/theme";
import { getUpdateType } from "../services/updatesService";
import { isUserAdmin } from "../utils/adminUtils";
import { ArticleMarkdownView } from "../utils/articleMarkdown";
import { sendReplyNotification } from "../services/notificationService";

const appIcon = require("../../assets/icon.png");

const SHARE_CARD_SIZE = 440;
const SHARE_SUMMARY_LINE_HEIGHT = 22;

/** Visible body lines that fit the leftover square. 0 hides the body. */
export function articleShareBodyLineCount(
  clipHeight,
  lineHeight = SHARE_SUMMARY_LINE_HEIGHT,
) {
  if (!Number.isFinite(clipHeight) || clipHeight < lineHeight) return 0;
  return Math.floor(clipHeight / lineHeight);
}

const UpdateDetailScreen = ({ route, navigation }) => {
  const { update } = route.params || {};
  const { styles, colors } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { isTablet, horizontalPadding, contentMaxWidth } = useResponsive();
  const { user, studyScore } = useSession();

  const isAdmin = useMemo(() => isUserAdmin(user), [user]);
  const updateType = useMemo(() => getUpdateType(update), [update]);
  const isArticleShare = updateType === "ARTICLE";
  const viewShotRef = useRef(null);
  const [articleBodyLines, setArticleBodyLines] = useState(0);
  const commentInputRef = useRef(null);
  const scrollViewRef = useRef(null);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleReplyToComment = useCallback((comment) => {
    setReplyingTo(comment);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 50);
  }, []);

  const updateTargetId = useMemo(
    () => (update?.id ? `update_${update.id}` : null),
    [update?.id],
  );

  // Subscribe to real-time comments in Firestore
  useEffect(() => {
    if (!updateTargetId) {
      setComments([]);
      setCommentsLoading(false);
      return;
    }

    setCommentsLoading(true);

    const q = isAdmin
      ? query(
          collection(db, "videoDoubts"),
          where("videoId", "==", updateTargetId),
        )
      : query(
          collection(db, "videoDoubts"),
          where("videoId", "==", updateTargetId),
          where("status", "==", "approved"),
        );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Sort newest first
        list.sort((a, b) => {
          const timeA = a.createdAt?.toMillis
            ? a.createdAt.toMillis()
            : a.createdAt?.toDate
              ? a.createdAt.toDate().getTime()
              : a.createdAt
                ? new Date(a.createdAt).getTime()
                : 0;
          const timeB = b.createdAt?.toMillis
            ? b.createdAt.toMillis()
            : b.createdAt?.toDate
              ? b.createdAt.toDate().getTime()
              : b.createdAt
                ? new Date(b.createdAt).getTime()
                : 0;
          return timeB - timeA;
        });

        setComments(list);
        setCommentsLoading(false);
      },
      (error) => {
        console.warn("Failed to subscribe to update comments:", error?.message);
        setCommentsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [updateTargetId, isAdmin]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const readingTime = useMemo(() => {
    if (!update?.summary) return "1 min read";
    const words = update.summary.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 70));
    return `${minutes} min read`;
  }, [update?.summary]);

  const onArticleBodyClipLayout = useCallback((event) => {
    const next = articleShareBodyLineCount(event?.nativeEvent?.layout?.height);
    setArticleBodyLines((prev) => (prev === next ? prev : next));
  }, []);

  const handleShare = useCallback(async () => {
    if (!update) return;

    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture({
          format: "png",
          quality: 1,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "Share Update",
          });
          return;
        }
      }

      await Share.share({
        title: update.title,
        message: `${update.title}\n\n${update.summary}\n\nRead more on the STROMA App: Community Medicine Simplified.`,
      });
    } catch (error) {
      if (error?.message !== "User did not share") {
        try {
          await Share.share({
            title: update.title,
            message: `${update.title}\n\n${update.summary}\n\nRead more on the STROMA App: Community Medicine Simplified.`,
          });
        } catch (_) {}
      }
    }
  }, [update]);

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !updateTargetId || !user?.uid) return;

    try {
      setSubmitting(true);
      const text = newCommentText.trim();
      setNewCommentText("");

      if (replyingTo) {
        const commentRef = doc(db, "videoDoubts", replyingTo.id);
        const replyItem = {
          id: Math.random().toString(36).substring(2, 9),
          userId: user.uid,
          userEmail: user.email,
          username: user.username || user.displayName || "Dr. Resident",
          userStromaScore: studyScore || 0,
          text,
          createdAt: new Date().toISOString(),
          upvotedBy: [],
        };
        await updateDoc(commentRef, {
          replies: arrayUnion(replyItem),
        });

        if (replyingTo.authorPushToken && replyingTo.userId !== user.uid) {
          sendReplyNotification(replyingTo.authorPushToken, {
            replierName: user.username || user.displayName || "Dr. Resident",
            targetType: "update",
            updateId: update?.id,
            updateTag: updateType,
            itemTitle:
              update?.title ||
              (updateType === "ARTICLE" ? "Article" : "Health News"),
            doubtId: replyingTo.id,
          });
        }

        setReplyingTo(null);
      } else {
        await addDoc(collection(db, "videoDoubts"), {
          videoId: updateTargetId,
          updateId: update?.id,
          targetType: "update",
          targetTag: updateType,
          targetTitle:
            update?.title ||
            (updateType === "ARTICLE" ? "Article" : "Health News"),
          userId: user.uid,
          userEmail: user.email,
          username: user.username || user.displayName || "Dr. Resident",
          authorPushToken: user.pushToken || null,
          userStromaScore: studyScore || 0,
          text,
          status: "approved",
          createdAt: serverTimestamp(),
          upvotedBy: [],
          replies: [],
        });
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
      Alert.alert("Error", "Could not post your comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUpvote = async (comment) => {
    if (!user?.uid || !comment?.id) return;
    const isUpvoted = (comment.upvotedBy || []).includes(user.uid);
    const commentRef = doc(db, "videoDoubts", comment.id);

    try {
      if (isUpvoted) {
        await updateDoc(commentRef, {
          upvotedBy: arrayRemove(user.uid),
        });
      } else {
        await updateDoc(commentRef, {
          upvotedBy: arrayUnion(user.uid),
        });
      }
    } catch (err) {
      console.warn("Failed to toggle upvote:", err?.message);
    }
  };

  const handleToggleReplyUpvote = async (comment, replyId) => {
    if (!user?.uid || !comment?.id || !replyId) return;
    const commentRef = doc(db, "videoDoubts", comment.id);

    try {
      const updatedReplies = (comment.replies || []).map((r) => {
        if (r.id === replyId) {
          const isUpvoted = (r.upvotedBy || []).includes(user.uid);
          const nextUpvoted = isUpvoted
            ? (r.upvotedBy || []).filter((id) => id !== user.uid)
            : [...(r.upvotedBy || []), user.uid];
          return { ...r, upvotedBy: nextUpvoted };
        }
        return r;
      });

      await updateDoc(commentRef, { replies: updatedReplies });
    } catch (err) {
      console.warn("Failed to toggle reply upvote:", err?.message);
    }
  };

  const confirmDeleteComment = (comment) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to remove this comment and its replies?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "videoDoubts", comment.id));
            } catch {
              Alert.alert("Error", "Failed to delete comment.");
            }
          },
        },
      ],
    );
  };

  const confirmDeleteReply = (comment, replyId) => {
    Alert.alert("Delete Reply", "Are you sure you want to remove this reply?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const nextReplies = (comment.replies || []).filter(
              (r) => r.id !== replyId,
            );
            await updateDoc(doc(db, "videoDoubts", comment.id), {
              replies: nextReplies,
            });
          } catch {
            Alert.alert("Error", "Failed to delete reply.");
          }
        },
      },
    ]);
  };

  const handleApprove = async (commentId) => {
    try {
      await updateDoc(doc(db, "videoDoubts", commentId), { status: "approved" });
    } catch (err) {
      Alert.alert("Error", "Failed to approve.");
    }
  };

  const handleDisapprove = async (commentId) => {
    try {
      await updateDoc(doc(db, "videoDoubts", commentId), {
        status: "under_review",
      });
    } catch (err) {
      Alert.alert("Error", "Failed to disapprove.");
    }
  };

  if (!update) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.errorText}>Update not found</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Hidden card for branded image sharing */}
      <View style={styles.hiddenCapture}>
        <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
          <View
            style={[styles.shareCard, isArticleShare && styles.shareCardSquare]}
            collapsable={false}
            testID="update-share-card"
          >
            <View style={styles.shareAccentBar} />
            <View
              style={[
                styles.shareContent,
                isArticleShare && styles.shareContentFill,
              ]}
            >
              <View style={styles.shareTagRow}>
                <Text style={styles.shareTypeBadge}>{updateType}</Text>
                {update.category ? (
                  <Text style={styles.shareCategory}>{update.category}</Text>
                ) : null}
              </View>
              <Text style={styles.shareTitle}>{update.title}</Text>
              <Text style={styles.shareDate}>{formatDate(update.date)}</Text>
              <View style={styles.shareDivider} />
              {isArticleShare ? (
                <View
                  style={styles.shareSummaryClip}
                  onLayout={onArticleBodyClipLayout}
                  testID="update-share-body-clip"
                >
                  {/* Absolute so the full article cannot grow the square. */}
                  <Text
                    style={[styles.shareSummary, styles.shareSummaryClipped]}
                    numberOfLines={
                      articleBodyLines > 0 ? articleBodyLines : undefined
                    }
                    ellipsizeMode="tail"
                    testID="update-share-body"
                  >
                    {update.summary}
                  </Text>
                </View>
              ) : (
                <Text style={styles.shareSummary} testID="update-share-body">
                  {update.summary}
                </Text>
              )}
              {update.source ? (
                <Text style={styles.shareSource}>Source: {update.source}</Text>
              ) : null}
            </View>
            <View style={styles.shareFooter}>
              <View style={styles.shareFooterTop}>
                <Image source={appIcon} style={styles.shareAppIcon} />
                <View style={styles.shareFooterTextCol}>
                  <Text style={styles.shareAppName}>STROMA</Text>
                  <Text style={styles.shareAppTagline}>
                    Community Medicine · Simplified
                  </Text>
                </View>
              </View>
              <Text style={styles.shareCTA}>
                Download the STROMA app to stay updated with the latest public health news and guidelines.
              </Text>
            </View>
          </View>
        </ViewShot>
      </View>

      {/* Medscape Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textTitle} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {updateType === "ARTICLE" ? "Special Article" : "Public Health News"}
        </Text>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleShare}
          accessibilityLabel="Share update"
        >
          <MaterialIcons name="share" size={22} color={colors.textTitle} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && {
              paddingHorizontal: horizontalPadding,
              maxWidth: contentMaxWidth,
              alignSelf: "center",
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tag Pills Row */}
          <View style={styles.tagRow}>
            <View
              style={[
                styles.typeBadge,
                updateType === "ARTICLE"
                  ? styles.articleTypeBadge
                  : styles.newsTypeBadge,
              ]}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  updateType === "ARTICLE"
                    ? styles.articleTypeBadgeText
                    : styles.newsTypeBadgeText,
                ]}
              >
                {updateType}
              </Text>
            </View>

            {update.category ? (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{update.category}</Text>
              </View>
            ) : null}
          </View>

          {/* Medscape Editorial Title */}
          <Text style={styles.headline}>{update.title}</Text>

          {/* Byline & Metadata */}
          <View style={styles.bylineRow}>
            <View style={styles.metaItem}>
              <MaterialIcons
                name="calendar-today"
                size={14}
                color={colors.textTertiary}
              />
              <Text style={styles.metaText}>{formatDate(update.date)}</Text>
            </View>
            <Text style={styles.metaDot}>·</Text>
            <View style={styles.metaItem}>
              <MaterialIcons
                name="source"
                size={14}
                color={colors.textTertiary}
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {update.source || (updateType === "ARTICLE" ? "Editorial Desk" : "PIB Delhi")}
              </Text>
            </View>
            <Text style={styles.metaDot}>·</Text>
            <View style={styles.metaItem}>
              <MaterialIcons
                name="schedule"
                size={14}
                color={colors.textTertiary}
              />
              <Text style={styles.metaText}>{readingTime}</Text>
            </View>
          </View>

          <Divider style={styles.editorialDivider} />

          {/* Lead Summary if distinct from full content */}
          {update.summary &&
          update.content &&
          update.summary.trim() !== update.content.trim() ? (
            <View style={styles.leadSummaryCard}>
              <Text style={styles.leadSummaryText}>{update.summary}</Text>
            </View>
          ) : null}

          {/* Body Prose with Markdown Subheadings & formatting */}
          <ArticleMarkdownView
            content={update.content || update.summary || ""}
            colors={colors}
          />

          {/* Related Curriculum Topics */}
          {Array.isArray(update.updatedItems) &&
            update.updatedItems.length > 0 && (
              <View style={styles.curriculumBox}>
                <View style={styles.curriculumHeader}>
                  <MaterialIcons
                    name="menu-book"
                    size={18}
                    color={theme.colors.secondary}
                  />
                  <Text style={styles.curriculumLabel}>
                    Related Curriculum Topics
                  </Text>
                </View>
                <View style={styles.curriculumPillsWrap}>
                  {update.updatedItems.map((topic, i) => (
                    <View key={i} style={styles.curriculumPill}>
                      <Text style={styles.curriculumPillText}>{topic}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

          {/* Source Link Action */}
          {update.link ? (
            <TouchableOpacity
              style={styles.sourceActionCard}
              onPress={() => Linking.openURL(update.link)}
              activeOpacity={0.7}
            >
              <View style={styles.sourceActionLeft}>
                <MaterialCommunityIcons
                  name="newspaper-variant-outline"
                  size={24}
                  color={theme.colors.secondary}
                />
                <View style={styles.sourceActionTextCol}>
                  <Text style={styles.sourceActionTitle}>
                    View Official Press Release
                  </Text>
                  <Text style={styles.sourceActionSubtitle} numberOfLines={1}>
                    {update.link}
                  </Text>
                </View>
              </View>
              <MaterialIcons
                name="open-in-new"
                size={20}
                color={theme.colors.secondary}
              />
            </TouchableOpacity>
          ) : null}

          {/* Bottom Share Action */}
          <View style={styles.bottomShareSection}>
            <Button
              mode="contained"
              icon="share-variant"
              onPress={handleShare}
              style={styles.bottomShareBtn}
              labelStyle={styles.bottomShareBtnLabel}
            >
              Share Update with Colleagues
            </Button>
          </View>

          <Divider style={styles.sectionDivider} />

          {/* Medscape Discussion / Comment Section */}
          <View style={styles.discussionSection}>
            <View style={styles.discussionHeader}>
              <MaterialIcons
                name="forum"
                size={22}
                color={theme.colors.secondary}
              />
              <Text style={styles.discussionTitle}>
                Discussion ({comments.length})
              </Text>
            </View>

            <Text style={styles.discussionSubtitle}>
              Join the clinical dialogue with fellow Community Medicine residents and faculty.
            </Text>

            {/* Comments List */}
            {commentsLoading ? (
              <ActivityIndicator
                color={theme.colors.secondary}
                style={{ marginVertical: 24 }}
              />
            ) : comments.length === 0 ? (
              <View style={styles.emptyCommentsState}>
                <MaterialCommunityIcons
                  name="comment-text-multiple-outline"
                  size={42}
                  color={colors.textPlaceholder}
                />
                <Text style={styles.emptyCommentsTitle}>No comments yet</Text>
                <Text style={styles.emptyCommentsText}>
                  Be the first to share your thoughts, question the guidelines, or discuss public health implications!
                </Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((comment) => {
                  const isUpvoted = (comment.upvotedBy || []).includes(
                    user?.uid,
                  );
                  const isOwn = user?.uid && comment.userId === user.uid;
                  const canDelete = isAdmin || isOwn;
                  const dateLabel = comment.createdAt
                    ? new Date(
                        comment.createdAt?.toDate
                          ? comment.createdAt.toDate()
                          : comment.createdAt,
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })
                    : "Just now";

                  return (
                    <View key={comment.id} style={styles.commentCard}>
                      <View style={styles.commentHeader}>
                        <View style={styles.commentAuthorRow}>
                          <View style={styles.avatarCircle}>
                            <Text style={styles.avatarInitial}>
                              {(comment.username || "D").charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.commentAuthorName}>
                              {comment.username || "Colleague"}
                            </Text>
                            <View style={styles.stromaBadge}>
                              <Text style={styles.stromaBadgeText}>
                                {isOwn
                                  ? studyScore || 0
                                  : comment.userStromaScore || 0}{" "}
                                pts
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Text style={styles.commentDateText}>{dateLabel}</Text>
                      </View>

                      <Text style={styles.commentBodyText}>{comment.text}</Text>

                      {/* Comment Actions */}
                      <View style={styles.commentActionsRow}>
                        <TouchableOpacity
                          style={[
                            styles.actionPill,
                            isUpvoted && styles.actionPillActive,
                          ]}
                          onPress={() => handleToggleUpvote(comment)}
                        >
                          <MaterialIcons
                            name={
                              isUpvoted ? "thumb-up" : "thumb-up-off-alt"
                            }
                            size={14}
                            color={
                              isUpvoted
                                ? theme.colors.secondary
                                : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.actionPillText,
                              isUpvoted && styles.actionPillActiveText,
                            ]}
                          >
                            {comment.upvotedBy?.length || 0}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionPill}
                          onPress={() => handleReplyToComment(comment)}
                        >
                          <MaterialIcons
                            name="reply"
                            size={15}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.actionPillText}>Reply</Text>
                        </TouchableOpacity>

                        {canDelete && (
                          <TouchableOpacity
                            style={styles.actionPill}
                            onPress={() => confirmDeleteComment(comment)}
                          >
                            <MaterialIcons
                              name="delete-outline"
                              size={15}
                              color={theme.colors.error}
                            />
                            <Text
                              style={[
                                styles.actionPillText,
                                { color: theme.colors.error },
                              ]}
                            >
                              Delete
                            </Text>
                          </TouchableOpacity>
                        )}

                        {isAdmin && comment.status === "under_review" && (
                          <TouchableOpacity
                            style={styles.actionPill}
                            onPress={() => handleApprove(comment.id)}
                          >
                            <MaterialIcons
                              name="check-circle"
                              size={15}
                              color={theme.colors.success}
                            />
                            <Text
                              style={[
                                styles.actionPillText,
                                { color: theme.colors.success },
                              ]}
                            >
                              Approve
                            </Text>
                          </TouchableOpacity>
                        )}

                        {isAdmin && comment.status === "approved" && (
                          <TouchableOpacity
                            style={styles.actionPill}
                            onPress={() => handleDisapprove(comment.id)}
                          >
                            <MaterialIcons
                              name="visibility-off"
                              size={15}
                              color={theme.colors.warningText}
                            />
                            <Text
                              style={[
                                styles.actionPillText,
                                { color: theme.colors.warningText },
                              ]}
                            >
                              Disapprove
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Nested Replies */}
                      {Array.isArray(comment.replies) &&
                        comment.replies.length > 0 && (
                          <View style={styles.repliesList}>
                            {comment.replies.map((reply) => {
                              const isReplyUpvoted = (
                                reply.upvotedBy || []
                              ).includes(user?.uid);
                              const isOwnReply =
                                user?.uid && reply.userId === user.uid;
                              const canDeleteReply = isAdmin || isOwnReply;
                              const replyDate = reply.createdAt
                                ? new Date(reply.createdAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                    },
                                  )
                                : "Just now";

                              return (
                                <View
                                  key={reply.id}
                                  style={styles.replyItemCard}
                                >
                                  <View style={styles.commentHeader}>
                                    <View style={styles.commentAuthorRow}>
                                      <View
                                        style={[
                                          styles.avatarCircle,
                                          styles.replyAvatarCircle,
                                        ]}
                                      >
                                        <Text style={styles.avatarInitialSmall}>
                                          {(reply.username || "D")
                                            .charAt(0)
                                            .toUpperCase()}
                                        </Text>
                                      </View>
                                      <View>
                                        <Text
                                          style={styles.replyAuthorName}
                                        >
                                          {reply.username || "Colleague"}
                                        </Text>
                                        <View style={styles.stromaBadgeReply}>
                                          <Text
                                            style={styles.stromaBadgeText}
                                          >
                                            {isOwnReply
                                              ? studyScore || 0
                                              : reply.userStromaScore || 0}{" "}
                                            pts
                                          </Text>
                                        </View>
                                      </View>
                                    </View>
                                    <Text style={styles.commentDateText}>
                                      {replyDate}
                                    </Text>
                                  </View>

                                  <Text style={styles.replyBodyText}>
                                    {reply.text}
                                  </Text>

                                  <View style={styles.commentActionsRow}>
                                    <TouchableOpacity
                                      style={[
                                        styles.actionPill,
                                        isReplyUpvoted &&
                                          styles.actionPillActive,
                                      ]}
                                      onPress={() =>
                                        handleToggleReplyUpvote(
                                          comment,
                                          reply.id,
                                        )
                                      }
                                    >
                                      <MaterialIcons
                                        name={
                                          isReplyUpvoted
                                            ? "thumb-up"
                                            : "thumb-up-off-alt"
                                        }
                                        size={13}
                                        color={
                                          isReplyUpvoted
                                            ? theme.colors.secondary
                                            : colors.textSecondary
                                        }
                                      />
                                      <Text
                                        style={[
                                          styles.actionPillText,
                                          isReplyUpvoted &&
                                            styles.actionPillActiveText,
                                        ]}
                                      >
                                        {reply.upvotedBy?.length || 0}
                                      </Text>
                                    </TouchableOpacity>

                                    {canDeleteReply && (
                                      <TouchableOpacity
                                        style={styles.actionPill}
                                        onPress={() =>
                                          confirmDeleteReply(comment, reply.id)
                                        }
                                      >
                                        <MaterialIcons
                                          name="delete-outline"
                                          size={14}
                                          color={theme.colors.error}
                                        />
                                        <Text
                                          style={[
                                            styles.actionPillText,
                                            { color: theme.colors.error },
                                          ]}
                                        >
                                          Delete
                                        </Text>
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Anchored Bottom Comment Composer */}
        <View
          style={[
            styles.anchoredComposerContainer,
            { paddingBottom: Math.max(insets.bottom, 8) },
          ]}
        >
          {replyingTo && (
            <View style={styles.replyBanner}>
              <Text style={styles.replyBannerText} numberOfLines={1}>
                Replying to{" "}
                <Text style={{ fontWeight: "700" }}>
                  {replyingTo.username}
                </Text>
              </Text>
              <TouchableOpacity
                onPress={() => setReplyingTo(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons
                  name="close"
                  size={16}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.anchoredComposerInputBox}>
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              placeholder={
                replyingTo
                  ? "Write your reply..."
                  : "Add your comment or analysis..."
              }
              placeholderTextColor={colors.textPlaceholder}
              value={newCommentText}
              onChangeText={setNewCommentText}
              multiline
              maxLength={1000}
            />
            <IconButton
              icon="send"
              size={22}
              iconColor={
                newCommentText.trim()
                  ? theme.colors.secondary
                  : colors.textPlaceholder
              }
              disabled={!newCommentText.trim() || submitting}
              onPress={handleAddComment}
              style={styles.sendIconBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundMain,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.surfacePrimary,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight || "#E5E7EB",
    },
    navButton: {
      padding: 8,
      borderRadius: 20,
    },
    topBarTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textTitle,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 8,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },
    tagRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
      flexWrap: "wrap",
    },
    typeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 14,
    },
    newsTypeBadge: {
      backgroundColor: colors.primarySoft || "#E0F2FE",
    },
    articleTypeBadge: {
      backgroundColor: "#EDE9FE",
    },
    typeBadgeText: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    newsTypeBadgeText: {
      color: colors.primary || "#0369A1",
    },
    articleTypeBadgeText: {
      color: "#6D28D9",
    },
    categoryPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 14,
      backgroundColor: colors.surfaceSecondary,
    },
    categoryPillText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    headline: {
      fontSize: 22,
      fontWeight: "800",
      lineHeight: 30,
      color: colors.textTitle,
      letterSpacing: -0.2,
      marginBottom: 14,
    },
    bylineRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 14,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: colors.textTertiary,
      fontWeight: "500",
    },
    metaDot: {
      fontSize: 14,
      color: colors.textTertiary,
    },
    editorialDivider: {
      marginVertical: 14,
      backgroundColor: colors.borderLight || "#E5E7EB",
    },
    leadSummaryCard: {
      backgroundColor: colors.surfaceSecondary,
      borderLeftWidth: 3.5,
      borderLeftColor: theme.colors.secondary,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    leadSummaryText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary,
      fontStyle: "italic",
    },
    bodyText: {
      fontSize: 16,
      lineHeight: 26,
      color: colors.textPrimary,
      letterSpacing: 0.1,
      marginBottom: 20,
    },
    curriculumBox: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.secondary,
    },
    curriculumHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
    },
    curriculumLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textTitle,
    },
    curriculumPillsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    curriculumPill: {
      backgroundColor: colors.surfacePrimary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    curriculumPillText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    sourceActionCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderLight || "#E5E7EB",
      marginBottom: 20,
    },
    sourceActionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
      paddingRight: 10,
    },
    sourceActionTextCol: {
      flex: 1,
    },
    sourceActionTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textTitle,
    },
    sourceActionSubtitle: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    bottomShareSection: {
      marginVertical: 10,
    },
    bottomShareBtn: {
      borderRadius: 10,
      backgroundColor: theme.colors.secondary,
      paddingVertical: 4,
    },
    bottomShareBtnLabel: {
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    sectionDivider: {
      marginTop: 24,
      marginBottom: 20,
      backgroundColor: colors.borderLight || "#E5E7EB",
    },
    discussionSection: {
      marginTop: 4,
    },
    discussionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    discussionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.textTitle,
    },
    discussionSubtitle: {
      fontSize: 13,
      color: colors.textTertiary,
      marginBottom: 16,
    },
    anchoredComposerContainer: {
      backgroundColor: colors.surfacePrimary,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight || "#E5E7EB",
      paddingHorizontal: 14,
      paddingTop: 8,
      shadowColor: colors.shadow || "#000",
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: -2 },
      elevation: 8,
    },
    anchoredComposerInputBox: {
      flexDirection: "row",
      alignItems: "flex-end",
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 22,
      paddingLeft: 14,
      paddingRight: 4,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: colors.borderLight || "#E5E7EB",
    },
    replyBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surfaceSecondary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginBottom: 8,
    },
    replyBannerText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    commentInput: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      fontSize: 14,
      color: colors.textTitle,
      paddingTop: 8,
      paddingBottom: 8,
      paddingHorizontal: 4,
    },
    sendIconBtn: {
      margin: 0,
    },
    emptyCommentsState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
      paddingHorizontal: 20,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      marginTop: 8,
    },
    emptyCommentsTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.textTitle,
      marginTop: 10,
      marginBottom: 4,
    },
    emptyCommentsText: {
      fontSize: 13,
      color: colors.textTertiary,
      textAlign: "center",
      lineHeight: 18,
    },
    commentsList: {
      gap: 12,
    },
    commentCard: {
      backgroundColor: colors.surfacePrimary,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.borderLight || "#E5E7EB",
    },
    commentHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    commentAuthorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    avatarCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitial: {
      color: "#FFF",
      fontWeight: "800",
      fontSize: 14,
    },
    avatarInitialSmall: {
      color: "#FFF",
      fontWeight: "800",
      fontSize: 12,
    },
    replyAvatarCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.primary || "#0369A1",
    },
    commentAuthorName: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textTitle,
    },
    replyAuthorName: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textTitle,
    },
    stromaBadge: {
      backgroundColor: colors.surfaceSecondary,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 6,
      alignSelf: "flex-start",
      marginTop: 2,
    },
    stromaBadgeReply: {
      backgroundColor: colors.surfaceSecondary,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 5,
      alignSelf: "flex-start",
      marginTop: 1,
    },
    stromaBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.colors.secondary,
    },
    commentDateText: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    commentBodyText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textPrimary,
      marginBottom: 10,
    },
    commentActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    actionPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: colors.surfaceSecondary,
    },
    actionPillActive: {
      backgroundColor: colors.primarySoft || "#E0F2FE",
    },
    actionPillText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    actionPillActiveText: {
      color: theme.colors.secondary,
      fontWeight: "700",
    },
    repliesList: {
      marginTop: 12,
      paddingLeft: 12,
      borderLeftWidth: 2,
      borderLeftColor: colors.borderLight || "#E5E7EB",
      gap: 10,
    },
    replyItemCard: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 10,
      padding: 10,
    },
    replyBodyText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    errorContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 12,
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: "600",
    },

    /* Hidden capture card styling */
    hiddenCapture: {
      position: "absolute",
      left: -9999,
      top: -9999,
    },
    shareCard: {
      width: SHARE_CARD_SIZE,
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      overflow: "hidden",
    },
    shareCardSquare: {
      height: SHARE_CARD_SIZE,
    },
    shareContentFill: {
      flex: 1,
      minHeight: 0,
      overflow: "hidden",
    },
    shareSummaryClip: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      minHeight: 0,
      overflow: "hidden",
      marginBottom: 12,
    },
    shareSummaryClipped: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      marginBottom: 0,
    },
    shareAccentBar: {
      height: 6,
      backgroundColor: "#0D9488",
    },
    shareContent: {
      padding: 24,
    },
    shareTagRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
    },
    shareTypeBadge: {
      backgroundColor: "#CCFBF1",
      color: "#0F766E",
      fontSize: 11,
      fontWeight: "800",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      overflow: "hidden",
    },
    shareCategory: {
      fontSize: 12,
      fontWeight: "700",
      color: "#0D9488",
      textTransform: "uppercase",
    },
    shareTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: "#1E293B",
      lineHeight: 28,
      marginBottom: 8,
    },
    shareDate: {
      fontSize: 12,
      color: "#64748B",
      marginBottom: 14,
    },
    shareDivider: {
      height: 1,
      backgroundColor: "#E2E8F0",
      marginBottom: 14,
    },
    shareSummary: {
      fontSize: 14,
      lineHeight: SHARE_SUMMARY_LINE_HEIGHT,
      color: "#334155",
      marginBottom: 12,
    },
    shareSource: {
      fontSize: 11,
      color: "#94A3B8",
      fontStyle: "italic",
    },
    shareFooter: {
      backgroundColor: "#F8FAFC",
      paddingHorizontal: 24,
      paddingVertical: 18,
      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
    },
    shareFooterTop: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    shareAppIcon: {
      width: 32,
      height: 32,
      borderRadius: 7,
      marginRight: 10,
    },
    shareFooterTextCol: {
      flex: 1,
    },
    shareAppName: {
      fontSize: 15,
      fontWeight: "800",
      color: "#0D9488",
      letterSpacing: 1,
    },
    shareAppTagline: {
      fontSize: 11,
      color: "#64748B",
      fontWeight: "500",
    },
    shareCTA: {
      fontSize: 11,
      color: "#94A3B8",
      lineHeight: 16,
    },
  });

export default UpdateDetailScreen;
