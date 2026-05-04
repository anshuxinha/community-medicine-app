import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  ImageBackground,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Card,
  Chip,
  IconButton,
  Text,
} from "react-native-paper";
import { WebView } from "react-native-webview";
import { MaterialIcons } from "@expo/vector-icons";
import * as Device from "expo-device";
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

const VideosScreen = () => {
  const [videos, setVideos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTogglingNotifications, setIsTogglingNotifications] =
    useState(false);

  useEffect(() => {
    let mounted = true;

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
  }, []);

  const categories = useMemo(() => getVideoCategories(videos), [videos]);

  const filteredVideos = useMemo(() => {
    if (selectedCategory === "all") return videos;
    return videos.filter((video) => video.category === selectedCategory);
  }, [selectedCategory, videos]);

  const featuredVideo = videos[0] || null;

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

  const renderVideoCard = ({ item }) => {
    const duration = formatDuration(item.duration);
    const publishedAt = formatPublishedDate(item.publishedAt || item.createdAt);
    const thumbnailSource = getThumbnailSource(item.thumbnailUrl);

    return (
      <Pressable onPress={() => setSelectedVideo(item)}>
        <Card style={styles.videoCard}>
          {thumbnailSource ? (
            <ImageBackground
              source={thumbnailSource}
              style={styles.thumbnail}
              imageStyle={styles.thumbnailImage}
            >
              <View style={styles.playOverlay}>
                <MaterialIcons name="play-arrow" size={32} color="#FFFFFF" />
              </View>
              {duration ? (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{duration}</Text>
                </View>
              ) : null}
            </ImageBackground>
          ) : (
            <View style={styles.thumbnailFallback}>
              <MaterialIcons
                name="play-circle-filled"
                size={46}
                color={theme.colors.secondary}
              />
              {duration ? (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{duration}</Text>
                </View>
              ) : null}
            </View>
          )}

          <Card.Content style={styles.videoContent}>
            <View style={styles.videoMetaRow}>
              <Chip
                compact
                style={styles.categoryChip}
                textStyle={styles.categoryChipText}
              >
                {item.categoryLabel || "Lecture"}
              </Chip>
              <Text style={styles.videoDate}>{publishedAt}</Text>
            </View>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {item.title || "Untitled video"}
            </Text>
            {item.description ? (
              <Text style={styles.videoDescription} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </Card.Content>
        </Card>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        renderItem={renderVideoCard}
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
                icon={isSubscribed ? "bell-check" : "bell-outline"}
                mode="contained-tonal"
                iconColor={
                  isSubscribed ? theme.colors.success : theme.colors.secondary
                }
                containerColor={theme.colors.surfacePrimary}
                onPress={toggleNotifications}
                disabled={isTogglingNotifications}
              />
            </View>

            {featuredVideo ? (
              <Pressable onPress={() => setSelectedVideo(featuredVideo)}>
                <View style={styles.featured}>
                  <View style={styles.featuredIcon}>
                    <MaterialIcons
                      name="ondemand-video"
                      size={28}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.featuredCopy}>
                    <Text style={styles.featuredLabel}>Latest video</Text>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                      {featuredVideo.title}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="play-arrow"
                    size={28}
                    color={theme.colors.secondary}
                  />
                </View>
              </Pressable>
            ) : null}

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
                >
                  {item.label}
                </Chip>
              )}
            />
          </View>
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
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundMain,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  header: {
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: theme.colors.textTitle,
  },
  subtitle: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    maxWidth: 300,
  },
  featured: {
    minHeight: 92,
    borderRadius: 16,
    padding: 16,
    backgroundColor: theme.colors.surfacePrimary,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featuredIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredCopy: {
    flex: 1,
  },
  featuredLabel: {
    color: theme.colors.textTertiary,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
  },
  featuredTitle: {
    marginTop: 4,
    color: theme.colors.textTitle,
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 21,
  },
  categoryList: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    backgroundColor: theme.colors.surfacePrimary,
    borderColor: theme.colors.border || "#D1D5DB",
  },
  filterChipSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  filterChipText: {
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  filterChipTextSelected: {
    color: theme.colors.primaryDark,
  },
  videoCard: {
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 16,
    overflow: "hidden",
  },
  thumbnail: {
    height: 184,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailImage: {
    backgroundColor: theme.colors.surfaceSecondary,
  },
  thumbnailFallback: {
    height: 184,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primaryLight,
  },
  playOverlay: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(17, 24, 39, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  durationBadge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    borderRadius: 8,
    backgroundColor: "rgba(17, 24, 39, 0.82)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  videoContent: {
    paddingTop: 14,
    paddingBottom: 16,
  },
  videoMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  categoryChip: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
    borderWidth: 1,
  },
  categoryChipText: {
    color: "#3730A3",
    fontSize: 12,
    fontWeight: "800",
  },
  videoDate: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: "600",
  },
  videoTitle: {
    color: theme.colors.textTitle,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
  },
  videoDescription: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    lineHeight: 20,
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
    backgroundColor: "#000000",
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
});

export default VideosScreen;
