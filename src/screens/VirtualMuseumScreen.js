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
import { theme } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';
import {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
} from "../utils/screenCaptureProtection";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

// Individual card component to manage its own image loading state
const MuseumCard = ({ item }) => {
  const { styles, colors } = useThemedStyles(createStyles);

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
            <DescriptionBlock text={item.description} />
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
  const { styles, colors } = useThemedStyles(createStyles);

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

  useEffect(() => {
    enableScreenCaptureProtection();
    return () => {
      disableScreenCaptureProtection();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
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

// Renders description lines with highlighted labels
const LABEL_REGEX = /^([^:\n]{1,60}):\s*/;
const KNOWN_HEADERS = [
  "Advantages", "Disadvantages", "Disadvantages/Side Effects", "Disadvantages/Side effects",
  "Adverse Effects", "Adverse effects", "Failure Rate", "Failure rate", "Dosage", "Dosage (Adults)",
  "Contraindications", "Action", "Composition", "Composition, strain of vaccine",
  "Types of IUCD and Composition", "Malaria Types Detected", "Confirmatory Test",
  "Formulation", "Route", "Dosage and Schedule", "Types available under the national program"
];

const DescriptionBlock = ({ text }) => {
  const { styles, colors } = useThemedStyles(createStyles);

  if (!text) return null;
  const lines = text.split("\n");
  return (
    <View style={styles.descriptionBlock}>
      {lines.map((line, idx) => {
        const match = line.match(LABEL_REGEX);
        let label = null;
        let value = "";
        let hasColon = false;

        if (match) {
          label = match[1];
          value = line.slice(match[0].length);
          hasColon = true;
        } else {
          // Check if the entire line is a known header
          const trimmed = line.trim();
          const isKnownHeader = KNOWN_HEADERS.some(h => h.toLowerCase() === trimmed.toLowerCase());
          if (isKnownHeader) {
            label = trimmed;
            value = "";
            hasColon = line.includes(":");
          }
        }

        if (label) {
          return (
            <Text key={idx} style={styles.descriptionRowText}>
              <Text style={styles.descriptionLabel}>{label}{hasColon ? ":" : ""}{value ? " " : ""}</Text>
              <Text style={styles.descriptionValue}>{value}</Text>
            </Text>
          );
        }
        return (
          <Text key={idx} style={styles.descriptionPlain}>
            {line}
          </Text>
        );
      })}
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundMain },
  container: { padding: 16, paddingBottom: 48 },
  captureProtectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backgroundMain,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  captureProtectedText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textTitle,
    marginBottom: 4,
  },
  subText: {
    color: colors.textTertiary,
    marginBottom: 16,
    lineHeight: 20,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { backgroundColor: colors.surfaceSecondary },
  chipActive: { backgroundColor: colors.primaryLight },
  chipTextActive: { color: colors.primary, fontWeight: "bold" },
  freeLabel: { color: colors.success, fontWeight: "bold" },
  card: {
    marginBottom: 10,
    backgroundColor: colors.surfacePrimary,
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
    fontWeight: "700",
    color: colors.textTitle,
    marginBottom: 3,
    lineHeight: 20,
  },
  cardSubtitle: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  expandedContent: { paddingTop: 0, paddingBottom: 14 },
  contentDivider: { marginBottom: 12 },
  imageWrapper: {
    width: "100%",
    height: 200,
    marginBottom: 14,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.surfaceTertiary,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
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
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: { fontSize: 48, marginBottom: 6 },
  placeholderText: { color: colors.textPlaceholder, fontSize: 13 },
  imageHint: {
    color: colors.textTertiary,
    fontSize: 12,
    marginBottom: 10,
    marginTop: -2,
  },
  descriptionBlock: { marginTop: 4 },
  descriptionRowText: { marginBottom: 5, lineHeight: 20 },
  descriptionLabel: {
    color: colors.secondary,
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 20,
  },
  descriptionValue: {
    color: colors.textTitle ?? colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
  descriptionPlain: {
    color: colors.textBody,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 3,
  },
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
    color: colors.surfacePrimary,
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
    backgroundColor: colors.textTitle,
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
    color: colors.surfacePrimary,
    fontWeight: "700",
    fontSize: 14,
    marginHorizontal: 16,
  },
});

export default VirtualMuseumScreen;
