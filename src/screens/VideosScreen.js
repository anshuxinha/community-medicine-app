import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  ImageBackground,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Chip,
  IconButton,
  Text,
} from "react-native-paper";
import { WebView } from "react-native-webview";
import { MaterialIcons } from "@expo/vector-icons";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../config/firebase";
import * as Device from "expo-device";
import { AppContext } from "../context/AppContext";
import { theme } from "../styles/theme";
import {
  formatDuration,
  formatPublishedDate,
  getVideoCategories,
  subscribeToVideos,
} from "../services/videoService";
import {
  addVideoSubscriptionListener,
  isSubscribedToVideoNotifications,
  requestPermissions,
  subscribeToVideoNotifications,
  unsubscribeFromVideoNotifications,
} from "../services/notificationService";

const { width } = Dimensions.get("window");

const playerHtml = (embedUrl) => `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #000; }
      iframe { border: 0; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <iframe
      src="${embedUrl}"
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
      allowfullscreen="true"
    ></iframe>
</body>
</html>`;

const getThumbnailSource = (thumbnailUrl) => {
  if (!thumbnailUrl) return null;

  if (thumbnailUrl.includes(".b-cdn.net/")) {
    return {
      uri: thumbnailUrl,
      headers: { Referer: "https://player.mediadelivery.net/" },
    };
  }

  return { uri: thumbnailUrl };
};

const EmptyState = ({ isFiltered }) => (
  <View style={styles.emptyState}>
    <MaterialIcons
      name="video-library"
      size={48}
      color={theme.colors.textPlaceholder}
    />
    <Text style={styles.emptyTitle}>
      {isFiltered ? "No videos in this category" : "No videos yet"}
    </Text>
    <Text style={styles.emptyText}>
      {isFiltered
        ? "Choose another category or pull to refresh."
        : "New teaching videos will appear here as soon as they are synced."}
    </Text>
  </View>
);

const getDoubtTime = (createdAt) => {
  if (!createdAt) return 0;
  if (typeof createdAt.toDate === "function") {
    try {
      return createdAt.toDate().getTime();
    } catch (e) {}
  }
  if (createdAt.seconds !== undefined) {
    return createdAt.seconds * 1000;
  }
  if (createdAt._seconds !== undefined) {
    return createdAt._seconds * 1000;
  }
  const t = new Date(createdAt).getTime();
  return isNaN(t) ? 0 : t;
};

const VideosScreen = ({ navigation }) => {
  const { isPremium, user, studyScore, setStudyScore } = useContext(AppContext);
  const [videos, setVideos] = useState([]);
  
  // Video Doubts state
  const [doubts, setDoubts] = useState([]);
  const [newDoubtText, setNewDoubtText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  // Subscribe to doubts for selected video
  useEffect(() => {
    if (!selectedVideo) {
      setDoubts([]);
      setReplyingTo(null);
      setNewDoubtText("");
      return;
    }

    const doubtsQuery = query(
      collection(db, "videoDoubts"),
      where("videoId", "==", selectedVideo.id)
    );

    const unsubscribe = onSnapshot(doubtsQuery, (snapshot) => {
      const fetchedDoubts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).sort((a, b) => getDoubtTime(a.createdAt) - getDoubtTime(b.createdAt));
      console.log(`[Doubts Debug] videoId: ${selectedVideo.id}, fetched count: ${fetchedDoubts.length}`);
      setDoubts(fetchedDoubts);
    }, (error) => {
      console.warn("Failed to subscribe to doubts:", error?.message);
    });

    return unsubscribe;
  }, [selectedVideo]);

  const userEmail = user?.email?.toLowerCase();
  const isAdmin = userEmail === "anshuxinha@gmail.com" || userEmail === "kaushikeec@gmail.com";

  // Filter doubts: visible only to authors and admins if under review, else visible to everyone
  const visibleDoubts = useMemo(() => {
    const filtered = doubts.filter((doubt) => {
      if (isAdmin) return true;
      if (doubt.status === "approved") return true;
      return doubt.userId === user?.uid;
    });
    console.log(`[Doubts Debug] user: ${user?.email} (${user?.uid}), isAdmin: ${isAdmin}, visible count: ${filtered.length}`);
    return filtered;
  }, [doubts, isAdmin, user?.uid]);

  const handleAddDoubt = async () => {
    if (!newDoubtText.trim() || !selectedVideo) return;

    try {
      const doubtText = newDoubtText.trim();
      setNewDoubtText("");

      if (replyingTo) {
        const doubtRef = doc(db, "videoDoubts", replyingTo.id);
        const replyItem = {
          id: Math.random().toString(36).substring(2, 9),
          userId: user.uid,
          userEmail: user.email,
          username: user.username || user.displayName || "User",
          userStromaScore: studyScore,
          text: doubtText,
          createdAt: new Date().toISOString(),
          upvotedBy: [],
        };
        await updateDoc(doubtRef, {
          replies: arrayUnion(replyItem),
        });
        setReplyingTo(null);
      } else {
        await addDoc(collection(db, "videoDoubts"), {
          videoId: selectedVideo.id,
          userId: user.uid,
          userEmail: user.email,
          username: user.username || user.displayName || "User",
          userStromaScore: studyScore,
          text: doubtText,
          status: "under_review",
          createdAt: serverTimestamp(),
          upvotedBy: [],
          replies: [],
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to post. Please try again.");
      console.error(error);
    }
  };

  const handleApproveDoubt = async (doubtId) => {
    try {
      await updateDoc(doc(db, "videoDoubts", doubtId), {
        status: "approved",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to approve doubt.");
    }
  };

  const handleToggleDoubtUpvote = async (doubt) => {
    if (!user?.uid) return;
    const isUpvoted = (doubt.upvotedBy || []).includes(user.uid);
    const doubtRef = doc(db, "videoDoubts", doubt.id);

    try {
      if (isUpvoted) {
        await updateDoc(doubtRef, {
          upvotedBy: arrayRemove(user.uid),
          userStromaScore: (doubt.userStromaScore || 0) - 5,
        });
        setStudyScore((prev) => Math.max(0, prev - 5));
      } else {
        await updateDoc(doubtRef, {
          upvotedBy: arrayUnion(user.uid),
          userStromaScore: (doubt.userStromaScore || 0) + 5,
        });
        setStudyScore((prev) => prev + 5);
      }
    } catch (error) {
      console.warn("Failed to toggle upvote:", error?.message);
    }
  };

  const handleToggleReplyUpvote = async (doubt, replyId) => {
    if (!user?.uid) return;
    const doubtRef = doc(db, "videoDoubts", doubt.id);

    try {
      const updatedReplies = (doubt.replies || []).map((r) => {
        if (r.id === replyId) {
          const isUpvoted = (r.upvotedBy || []).includes(user.uid);
          const nextUpvotedBy = isUpvoted
            ? r.upvotedBy.filter((id) => id !== user.uid)
            : [...r.upvotedBy, user.uid];
          const scoreDiff = isUpvoted ? -5 : 5;
          setStudyScore((prev) => Math.max(0, prev + scoreDiff));

          return {
            ...r,
            upvotedBy: nextUpvotedBy,
            userStromaScore: (r.userStromaScore || 0) + scoreDiff,
          };
        }
        return r;
      });

      await updateDoc(doubtRef, {
        replies: updatedReplies,
      });
    } catch (error) {
      console.warn("Failed to toggle reply upvote:", error?.message);
    }
  };

  const renderDoubtItem = ({ item }) => {
    const isDoubtUpvoted = (item.upvotedBy || []).includes(user?.uid);
    const hasReplies = item.replies && item.replies.length > 0;
    const isPending = item.status === "under_review";
    const dateStr = item.createdAt ? new Date(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).toLocaleDateString() : "Just now";

    return (
      <View style={styles.doubtItemContainer}>
        <View style={styles.doubtCard}>
          <View style={styles.doubtHeader}>
            <View style={styles.doubtAuthorInfo}>
              <Text style={styles.doubtAuthorName}>{item.username}</Text>
              <View style={styles.stromaScoreBadge}>
                <Text style={styles.stromaScoreText}>{item.userStromaScore || 0} pts</Text>
              </View>
              {isPending && (
                <View style={styles.underReviewBadge}>
                  <Text style={styles.underReviewText}>Under Review</Text>
                </View>
              )}
            </View>
            <Text style={styles.doubtDate}>{dateStr}</Text>
          </View>
          <Text style={styles.doubtText}>{item.text}</Text>
          <View style={styles.doubtActions}>
            <Pressable
              style={[styles.actionButton, isDoubtUpvoted && styles.actionActive]}
              onPress={() => handleToggleDoubtUpvote(item)}
            >
              <MaterialIcons
                name={isDoubtUpvoted ? "thumb-up" : "thumb-up-off-alt"}
                size={16}
                color={isDoubtUpvoted ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={[styles.actionButtonText, isDoubtUpvoted && styles.actionActiveText]}>
                {item.upvotedBy?.length || 0}
              </Text>
            </Pressable>
            {item.status === "approved" && (
              <Pressable
                style={styles.actionButton}
                onPress={() => setReplyingTo(item)}
              >
                <MaterialIcons name="reply" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.actionButtonText}>Reply</Text>
              </Pressable>
            )}
            {isAdmin && isPending && (
              <Pressable
                style={styles.approveButton}
                onPress={() => handleApproveDoubt(item.id)}
              >
                <MaterialIcons name="check-circle" size={16} color={theme.colors.success} />
                <Text style={styles.approveButtonText}>Approve</Text>
              </Pressable>
            )}
          </View>
        </View>
        {hasReplies && (
          <View style={styles.repliesContainer}>
            {item.replies.map((reply) => {
              const isReplyUpvoted = (reply.upvotedBy || []).includes(user?.uid);
              const replyDate = reply.createdAt ? new Date(reply.createdAt).toLocaleDateString() : "Just now";
              return (
                <View key={reply.id} style={styles.replyCard}>
                  <View style={styles.doubtHeader}>
                    <View style={styles.doubtAuthorInfo}>
                      <Text style={styles.replyAuthorName}>{reply.username}</Text>
                      <View style={styles.stromaScoreBadgeReply}>
                        <Text style={styles.stromaScoreTextReply}>{reply.userStromaScore || 0} pts</Text>
                      </View>
                    </View>
                    <Text style={styles.doubtDate}>{replyDate}</Text>
                  </View>
                  <Text style={styles.replyText}>{reply.text}</Text>
                  <View style={styles.doubtActions}>
                    <Pressable
                      style={[styles.actionButton, isReplyUpvoted && styles.actionActive]}
                      onPress={() => handleToggleReplyUpvote(item, reply.id)}
                    >
                      <MaterialIcons
                        name={isReplyUpvoted ? "thumb-up" : "thumb-up-off-alt"}
                        size={14}
                        color={isReplyUpvoted ? theme.colors.primary : theme.colors.textSecondary}
                      />
                      <Text style={[styles.actionButtonText, isReplyUpvoted && styles.actionActiveText]}>
                        {reply.upvotedBy?.length || 0}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTogglingNotifications, setIsTogglingNotifications] =
    useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    let mounted = true;

    if (!isPremium) {
      navigation.getParent()?.navigate("Paywall");
      setIsLoadingVideos(false);
      return () => {
        mounted = false;
      };
    }

    isSubscribedToVideoNotifications().then((subscribed) => {
      if (mounted) setIsSubscribed(subscribed);
    });

    const unsubscribeVideos = subscribeToVideos({
      onData: (nextVideos) => {
        setVideos(nextVideos);
        setIsLoadingVideos(false);
        setIsRefreshing(false);
      },
      onError: (error) => {
        console.warn("Video subscription failed:", error?.message);
        setIsLoadingVideos(false);
        setIsRefreshing(false);
      },
    });

    const unsubscribeNotifications = addVideoSubscriptionListener(
      (subscribed) => {
        setIsSubscribed(subscribed);
      },
    );

    return () => {
      mounted = false;
      unsubscribeVideos?.();
      unsubscribeNotifications?.();
    };
  }, [isPremium, navigation]);

  const categories = useMemo(() => getVideoCategories(videos), [videos]);

  const filteredVideos = useMemo(() => {
    let list = videos;
    if (selectedCategory !== "all") {
      list = videos.filter((video) => video.category === selectedCategory);
    }
    return list;
  }, [selectedCategory, videos]);

  const displayedVideos = useMemo(() => filteredVideos.slice(0, visibleCount), [filteredVideos, visibleCount]);

  const toggleNotifications = async () => {
    if (isTogglingNotifications) return;

    setIsTogglingNotifications(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromVideoNotifications();
        return;
      }

      if (!Device.isDevice) {
        Alert.alert(
          "Physical Device Required",
          "Push notifications need a real device for testing.",
        );
        return;
      }

      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Enable notifications in device settings to receive new video alerts.",
        );
        return;
      }

      await subscribeToVideoNotifications();
    } catch (error) {
      Alert.alert(
        "Notification update failed",
        error?.message || "Please try again.",
      );
    } finally {
      setIsTogglingNotifications(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 700);
  };

  const renderVideoItem = ({ item }) => {
    const duration = formatDuration(item.duration);
    const publishedAt = formatPublishedDate(item.publishedAt || item.createdAt);
    const thumbnailSource = getThumbnailSource(item.thumbnailUrl);

    return (
      <Pressable style={styles.videoItem} onPress={() => setSelectedVideo(item)}>
        <View style={styles.videoLeft}>
          <ImageBackground
            source={thumbnailSource}
            style={styles.itemThumbnail}
            imageStyle={styles.itemThumbnailImage}
          >
            <View style={styles.itemPlayOverlay}>
              <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
            </View>
            {duration ? (
              <View style={styles.itemDurationBadge}>
                <Text style={styles.itemDurationText}>{duration}</Text>
              </View>
            ) : null}
          </ImageBackground>
        </View>
        
        <View style={styles.videoRight}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title || "Untitled video"}
          </Text>
          <Text style={styles.itemMeta}>
            {publishedAt}  •  {item.categoryLabel || "Lecture"}
          </Text>
        </View>

        <IconButton
          icon="dots-vertical"
          size={20}
          iconColor={theme.colors.textTertiary}
          onPress={() => {}}
          style={styles.itemOptions}
        />
      </Pressable>
    );
  };

  if (!isPremium) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={displayedVideos}
        keyExtractor={(item) => item.id}
        renderItem={renderVideoItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.title}>Videos</Text>
                <Text style={styles.subtitle}>
                  Recorded lectures, revisions, and case discussions.
                </Text>
              </View>
              <IconButton
                icon={isSubscribed ? "bell" : "bell-outline"}
                iconColor={isSubscribed ? theme.colors.success : theme.colors.textTitle}
                size={24}
                onPress={toggleNotifications}
                disabled={isTogglingNotifications}
              />
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => (
                <Chip
                  selected={selectedCategory === item.id}
                  mode={selectedCategory === item.id ? "flat" : "outlined"}
                  selectedColor={theme.colors.primary}
                  style={[
                    styles.filterChip,
                    selectedCategory === item.id && styles.filterChipSelected,
                  ]}
                  textStyle={[
                    styles.filterChipText,
                    selectedCategory === item.id &&
                      styles.filterChipTextSelected,
                  ]}
                  onPress={() => setSelectedCategory(item.id)}
                  showSelectedOverlay={false}
                  icon={selectedCategory === item.id ? ({ size, color }) => (
                    <MaterialIcons name="check" size={18} color={theme.colors.primary} />
                  ) : undefined}
                >
                  {item.label}
                </Chip>
              )}
            />

            <Text style={styles.sectionHeading}>LATEST VIDEOS</Text>
          </View>
        }
        ListFooterComponent={
          visibleCount < filteredVideos.length ? (
            <Pressable 
              style={styles.loadMoreBtn} 
              onPress={() => setVisibleCount(prev => prev + 10)}
            >
              <Text style={styles.loadMoreText}>Load more</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={theme.colors.textPrimary} />
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          isLoadingVideos ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={theme.colors.secondary} />
              <Text style={styles.loadingText}>Loading videos...</Text>
            </View>
          ) : (
            <EmptyState isFiltered={selectedCategory !== "all"} />
          )
        }
      />

      <Modal
        visible={Boolean(selectedVideo)}
        animationType="slide"
        onRequestClose={() => setSelectedVideo(null)}
      >
        <SafeAreaView style={styles.playerSafeArea}>
          <View style={styles.playerHeader}>
            <IconButton
              icon="close"
              iconColor={theme.colors.textTitle}
              onPress={() => setSelectedVideo(null)}
            />
            <Text style={styles.playerTitle} numberOfLines={1}>
              {selectedVideo?.title || "Video"}
            </Text>
            <View style={styles.playerHeaderSpacer} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 44 : 0}
          >
            <View style={styles.videoPlayerContainer}>
              {selectedVideo?.embedUrl ? (
                <WebView
                  originWhitelist={["*"]}
                  source={{ html: playerHtml(selectedVideo.embedUrl) }}
                  allowsFullscreenVideo
                  mediaPlaybackRequiresUserAction={false}
                  style={styles.player}
                />
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons
                    name="error-outline"
                    size={42}
                    color={theme.colors.warning}
                  />
                  <Text style={styles.emptyTitle}>Video is still processing</Text>
                  <Text style={styles.emptyText}>
                    The player will appear here once Bunny finishes preparing it.
                  </Text>
                </View>
              )}
            </View>

            <FlatList
              style={styles.doubtsList}
              data={visibleDoubts}
              keyExtractor={(item) => item.id}
              renderItem={renderDoubtItem}
              contentContainerStyle={styles.doubtsListContent}
              ListEmptyComponent={
                <View style={styles.emptyDoubts}>
                  <MaterialIcons name="forum" size={40} color={theme.colors.textPlaceholder} />
                  <Text style={styles.emptyDoubtsTitle}>No doubts asked yet</Text>
                  <Text style={styles.emptyDoubtsText}>Be the first to ask a doubt or query about this video!</Text>
                </View>
              }
            />

            {replyingTo && (
              <View style={styles.replyBanner}>
                <Text style={styles.replyBannerText} numberOfLines={1}>
                  Replying to <Text style={{ fontWeight: "bold" }}>{replyingTo.username}</Text>
                </Text>
                <IconButton
                  icon="close"
                  size={16}
                  iconColor={theme.colors.textSecondary}
                  onPress={() => setReplyingTo(null)}
                  style={{ margin: 0 }}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newDoubtText}
                onChangeText={setNewDoubtText}
                placeholder={replyingTo ? "Type your reply..." : "Ask a doubt about this video..."}
                placeholderTextColor={theme.colors.textPlaceholder}
                multiline
              />
              <IconButton
                icon="send"
                iconColor={newDoubtText.trim() ? theme.colors.primary : theme.colors.textPlaceholder}
                disabled={!newDoubtText.trim()}
                onPress={handleAddDoubt}
                size={24}
                style={styles.sendButton}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surfacePrimary,
  },
  listContent: {
    paddingBottom: 32,
  },
  header: {
    padding: 20,
    gap: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: theme.colors.textTitle,
  },
  subtitle: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 260,
  },
  categoryList: {
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: theme.colors.surfacePrimary,
    borderColor: "#E5E7EB",
    borderRadius: 20,
  },
  filterChipSelected: {
    backgroundColor: "#EDE9FE", // Light purple background
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  filterChipText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 14,
  },
  filterChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.textTertiary,
    letterSpacing: 1,
    marginTop: 10,
  },
  // -- New List Item Style --
  videoItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    gap: 16,
  },
  videoLeft: {
    width: 110,
    aspectRatio: 1.2,
  },
  itemThumbnail: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  itemThumbnailImage: {
    borderRadius: 12,
    backgroundColor: "#4C1D95", // Dark purple base
  },
  itemPlayOverlay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(17, 24, 39, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  itemDurationBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  itemDurationText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  videoRight: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  itemTitle: {
    color: theme.colors.textTitle,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  itemMeta: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: "500",
  },
  itemOptions: {
    margin: 0,
    marginRight: -8,
  },
  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 4,
  },
  loadMoreText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 56,
  },
  emptyTitle: {
    marginTop: 12,
    color: theme.colors.textTitle,
    fontWeight: "800",
    fontSize: 18,
    textAlign: "center",
  },
  emptyText: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  playerSafeArea: {
    flex: 1,
    backgroundColor: theme.colors.surfacePrimary,
  },
  playerHeader: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfacePrimary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceSecondary,
  },
  playerTitle: {
    flex: 1,
    textAlign: "center",
    color: theme.colors.textTitle,
    fontWeight: "800",
  },
  playerHeaderSpacer: {
    width: 48,
  },
  player: {
    flex: 1,
    backgroundColor: "#000000",
  },
  videoPlayerContainer: {
    width: "100%",
    height: width * (9 / 16),
    backgroundColor: "#000000",
  },
  doubtsList: {
    flex: 1,
  },
  doubtsListContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  doubtItemContainer: {
    paddingHorizontal: 20,
    marginVertical: 6,
  },
  doubtCard: {
    backgroundColor: theme.colors.surfaceTertiary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceSecondary,
  },
  doubtHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  doubtAuthorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  doubtAuthorName: {
    fontWeight: "bold",
    fontSize: 14,
    color: theme.colors.textTitle,
  },
  stromaScoreBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stromaScoreText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "600",
  },
  underReviewBadge: {
    backgroundColor: theme.colors.warningBackground,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: theme.colors.warning,
  },
  underReviewText: {
    color: theme.colors.warningText,
    fontSize: 11,
    fontWeight: "bold",
  },
  doubtDate: {
    fontSize: 11,
    color: theme.colors.textTertiary,
  },
  doubtText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  doubtActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  actionActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  actionButtonText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  actionActiveText: {
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#E8F5E9",
    borderRadius: 6,
  },
  approveButtonText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: "bold",
  },
  repliesContainer: {
    marginLeft: 20,
    marginTop: 4,
    borderLeftWidth: 1.5,
    borderLeftColor: theme.colors.surfaceSecondary,
    paddingLeft: 12,
  },
  replyCard: {
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: theme.colors.surfaceSecondary,
  },
  replyAuthorName: {
    fontWeight: "600",
    fontSize: 13,
    color: theme.colors.textTitle,
  },
  stromaScoreBadgeReply: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  stromaScoreTextReply: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "500",
  },
  replyText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 16,
  },
  emptyDoubts: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyDoubtsTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: theme.colors.textTitle,
    marginTop: 8,
  },
  emptyDoubtsText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceSecondary,
    backgroundColor: theme.colors.surfacePrimary,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  sendButton: {
    margin: 0,
  },
  replyBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  replyBannerText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
});

export default VideosScreen;
