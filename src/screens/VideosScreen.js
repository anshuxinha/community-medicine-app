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

const VideosScreen = ({ navigation }) => {
  const { isPremium } = useContext(AppContext);
  const [videos, setVideos] = useState([]);
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
