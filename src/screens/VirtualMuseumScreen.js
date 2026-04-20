import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Text, Card, Chip, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { MUSEUM_ITEMS, CATEGORIES, FREE_CATEGORY } from "../data/museumData";
import { AppContext } from "../context/AppContext";
import { theme } from "../styles/theme";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

// Individual card component to manage its own image loading state
const MuseumCard = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [zoomScale, setZoomScale] = useState(MIN_ZOOM);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (!viewerVisible) {
      setZoomScale(MIN_ZOOM);
    }
  }, [viewerVisible]);

  const viewportWidth = Math.max(width - 32, 240);
  const viewportHeight = Math.max(height - 220, 260);
  const zoomedImageSize = useMemo(
    () => ({
      width: viewportWidth * zoomScale,
      height: viewportHeight * zoomScale,
    }),
    [viewportHeight, viewportWidth, zoomScale],
  );

  return (
    <>
      <Card style={styles.card} onPress={() => setExpanded(!expanded)}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardTitle}>
              {item.emoji} {item.title}
            </Text>
            <Text style={styles.cardSubtitle}>{item.category}</Text>
          </View>
          <MaterialIcons
            name={expanded ? "expand-less" : "expand-more"}
            size={26}
            color={theme.colors.secondary}
          />
        </View>

        {/* Expanded content */}
        {expanded && (
          <Card.Content style={styles.expandedContent}>
            <Divider style={styles.contentDivider} />

            {/* Image area */}
            {item.image && !imageError ? (
              <Pressable
                style={styles.imageWrapper}
                onPress={() => setViewerVisible(true)}
              >
                {imageLoading && (
                  <View style={styles.imageLoadingOverlay}>
                    <ActivityIndicator
                      size="large"
                      color={theme.colors.secondary}
                    />
                  </View>
                )}
                <Image
                  source={{ uri: item.image }}
                  style={[styles.itemImage, imageLoading && { opacity: 0 }]}
                  resizeMode="contain"
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                />
                <View style={styles.fullscreenIconButton}>
                  <MaterialIcons name="fullscreen" size={20} color="#FFFFFF" />
                </View>
              </Pressable>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderEmoji}>{item.emoji}</Text>
                <Text style={styles.placeholderText}>
                  {item.image && imageError
                    ? "Could not load image"
                    : "Image coming soon"}
                </Text>
              </View>
            )}

            <Text style={styles.imageHint}>
              Tap the image to open and zoom.
            </Text>
            <Text style={styles.description}>{item.description}</Text>
          </Card.Content>
        )}
      </Card>

      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.viewerBackdrop}>
          <SafeAreaView style={styles.viewerSafeArea}>
            <View style={styles.viewerHeader}>
              <Text style={styles.viewerTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setViewerVisible(false)}
                style={styles.viewerCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.viewerBody}>
              <ScrollView
                horizontal
                bounces={false}
                contentContainerStyle={styles.viewerOuterScrollContent}
                maximumZoomScale={MAX_ZOOM}
                minimumZoomScale={MIN_ZOOM}
              >
                <ScrollView
                  bounces={false}
                  contentContainerStyle={styles.viewerInnerScrollContent}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={zoomedImageSize}
                    resizeMode="contain"
                  />
                </ScrollView>
              </ScrollView>
            </View>

            <View style={styles.viewerControls}>
              <Pressable
                accessibilityRole="button"
                disabled={zoomScale <= MIN_ZOOM}
                onPress={() =>
                  setZoomScale((current) =>
                    Math.max(MIN_ZOOM, current - ZOOM_STEP),
                  )
                }
                style={[
                  styles.viewerControlButton,
                  zoomScale <= MIN_ZOOM && styles.viewerControlButtonDisabled,
                ]}
              >
                <MaterialIcons name="remove" size={22} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.viewerZoomLabel}>
                {Math.round(zoomScale * 100)}%
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={zoomScale >= MAX_ZOOM}
                onPress={() =>
                  setZoomScale((current) =>
                    Math.min(MAX_ZOOM, current + ZOOM_STEP),
                  )
                }
                style={[
                  styles.viewerControlButton,
                  zoomScale >= MAX_ZOOM && styles.viewerControlButtonDisabled,
                ]}
              >
                <MaterialIcons name="add" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
};

// ── Main screen ─────────────────────────────────────────────
const VirtualMuseumScreen = () => {
  const { isPremium, isScreenCapturePrevented } = useContext(AppContext);
  const navigation = useNavigation();
  const [activeCategory, setActiveCategory] = useState(FREE_CATEGORY);

  const handleCategoryPress = (cat) => {
    if (!isPremium && cat !== FREE_CATEGORY && cat !== "All") {
      navigation.replace("Paywall");
      return;
    }
    setActiveCategory(cat);
  };

  const filtered =
    activeCategory === "All"
      ? MUSEUM_ITEMS
      : MUSEUM_ITEMS.filter((i) => i.category === activeCategory);

  return (
    <SafeAreaView style={styles.safeArea}>
      {isScreenCapturePrevented && (
        <View style={styles.captureProtectedOverlay}>
          <Text style={styles.captureProtectedText}>
            Screen recording is not allowed
          </Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerText}>🏛️ Virtual Museum</Text>
        <Text style={styles.subText}>
          Tap any spotter to view its image and description.
        </Text>

        {/* Category filter chips */}
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => {
            const isFreeCategory = cat === FREE_CATEGORY;
            const showFreeLabel = isFreeCategory && !isPremium;
            return (
              <Chip
                key={cat}
                selected={activeCategory === cat}
                selectedColor={theme.colors.primary}
                onPress={() => handleCategoryPress(cat)}
                style={[
                  styles.chip,
                  activeCategory === cat && styles.chipActive,
                ]}
                textStyle={
                  activeCategory === cat
                    ? styles.chipTextActive
                    : { color: "#374151" }
                }
              >
                {cat}
                {showFreeLabel && <Text style={styles.freeLabel}> 🎫FREE</Text>}
              </Chip>
            );
          })}
        </View>

        {filtered.map((item) => (
          <MuseumCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.backgroundMain },
  container: { padding: 16, paddingBottom: 48 },
  captureProtectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.backgroundMain,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  captureProtectedText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.textTitle,
    marginBottom: 4,
  },
  subText: {
    color: theme.colors.textTertiary,
    marginBottom: 16,
    lineHeight: 20,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { backgroundColor: theme.colors.surfaceSecondary },
  chipActive: { backgroundColor: theme.colors.primaryLight },
  chipTextActive: { color: theme.colors.primary, fontWeight: "bold" },
  freeLabel: { color: theme.colors.success, fontWeight: "bold" },
  card: {
    marginBottom: 10,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    paddingRight: 12,
  },
  cardHeaderLeft: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: theme.colors.textTitle,
    marginBottom: 2,
  },
  cardSubtitle: {
    color: theme.colors.secondary,
    fontSize: 11,
    fontWeight: "600",
  },
  expandedContent: { paddingTop: 0, paddingBottom: 14 },
  contentDivider: { marginBottom: 12 },
  imageWrapper: {
    width: "100%",
    height: 200,
    marginBottom: 14,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: theme.colors.surfaceTertiary,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceSecondary,
  },
  itemImage: { width: "100%", height: "100%" },
  fullscreenIconButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17, 24, 39, 0.72)",
  },
  imagePlaceholder: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: { fontSize: 48, marginBottom: 6 },
  placeholderText: { color: theme.colors.textPlaceholder, fontSize: 13 },
  imageHint: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    marginBottom: 10,
    marginTop: -2,
  },
  description: { color: "#374151", lineHeight: 22 },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.96)",
  },
  viewerSafeArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  viewerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
    marginRight: 12,
  },
  viewerCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  viewerBody: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  viewerOuterScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  viewerInnerScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  viewerControlButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  viewerControlButtonDisabled: {
    opacity: 0.4,
  },
  viewerZoomLabel: {
    minWidth: 70,
    textAlign: "center",
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    marginHorizontal: 16,
  },
});

export default VirtualMuseumScreen;
