import React, { useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
  Share,
  Image,
} from "react-native";
import {
  Text,
  Button,
  Dialog,
  Portal,
  Chip,
  IconButton,
  Divider,
} from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { theme } from "../styles/theme";
import { UPDATES_IMAGES } from "../data/updates_images_map";

const appIcon = require("../../assets/icon.png");

/**
 * Reusable premium update detail dialog with branded image share.
 *
 * Props:
 *  - visible: boolean
 *  - update: { title, date, summary, link, source, category, updatedItems }
 *  - onDismiss: () => void
 */
const UpdateDetailDialog = ({ visible, update, onDismiss }) => {
  const viewShotRef = useRef(null);

  const handleShare = useCallback(async () => {
    if (!update) return;

    try {
      // Capture the branded card as an image
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
      } else {
        // Fallback to text share
        await Share.share({
          message: `${update.title}\n\n${update.summary}\n\nDownload the STROMA app to stay updated with the latest public health news and guidelines.`,
        });
      }
    } catch (error) {
      // User cancelled or error — try text fallback
      if (error?.message !== "User did not share") {
        try {
          await Share.share({
            message: `${update.title}\n\n${update.summary}\n\nDownload the STROMA app to stay updated with the latest public health news and guidelines.`,
          });
        } catch (_) {
          // silently ignore
        }
      }
    }
  }, [update]);

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

  if (!update) return null;

  return (
    <>
      {/* Hidden branded card for share image capture */}
      <View style={styles.hiddenCapture}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1 }}
        >
          <View style={styles.shareCard}>
            {/* Top accent bar */}
            <View style={styles.shareAccentBar} />

            {/* Custom generated header image (if available) */}
            {UPDATES_IMAGES[update.id] && (
              <Image
                source={UPDATES_IMAGES[update.id]}
                style={styles.shareCardImage}
              />
            )}

            {/* Content */}
            <View style={styles.shareContent}>
              {update.category && (
                <Text style={styles.shareCategory}>
                  {update.category}
                </Text>
              )}
              <Text style={styles.shareTitle}>{update.title}</Text>
              <Text style={styles.shareDate}>
                {formatDate(update.date)}
              </Text>
              <View style={styles.shareDivider} />
              <Text style={styles.shareSummary}>{update.summary}</Text>
              {update.source && (
                <Text style={styles.shareSource}>
                  Source: {update.source}
                </Text>
              )}
            </View>

            {/* Branded footer */}
            <View style={styles.shareFooter}>
              <View style={styles.shareFooterTop}>
                <Image source={appIcon} style={styles.shareAppIcon} />
                <View style={styles.shareFooterTextCol}>
                  <Text style={styles.shareAppName}>STROMA</Text>
                  <Text style={styles.shareAppTagline}>
                    Community Medicine Learning App
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

      {/* Actual dialog */}
      <Portal>
        <Dialog
          visible={visible}
          onDismiss={onDismiss}
          style={styles.dialog}
        >
          {/* Accent bar */}
          <View style={styles.accentBar} />

          <Dialog.ScrollArea style={styles.scrollArea}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Date chip + category */}
              <View style={styles.metaRow}>
                <Chip
                  icon="calendar"
                  textStyle={styles.dateChipText}
                  style={styles.dateChip}
                  compact
                >
                  {formatDate(update.date)}
                </Chip>
              </View>

              {update.category && (
                <Chip
                  style={styles.categoryChip}
                  textStyle={styles.categoryChipText}
                  compact
                >
                  {update.category}
                </Chip>
              )}

              {/* Title */}
              <Text style={styles.title}>{update.title}</Text>

              <Divider style={styles.divider} />

              {/* Body */}
              <Text style={styles.body}>{update.summary}</Text>

              {/* Updated items */}
              {Array.isArray(update.updatedItems) &&
                update.updatedItems.length > 0 && (
                  <View style={styles.updatedItemsBox}>
                    <Text style={styles.updatedItemsLabel}>
                      Updated Topics
                    </Text>
                    <Text style={styles.updatedItemsText}>
                      {update.updatedItems.join(", ")}
                    </Text>
                  </View>
                )}

              {/* Source + link */}
              {update.source && (
                <Text style={styles.sourceText}>
                  Source: {update.source}
                </Text>
              )}

              {update.link && (
                <Button
                  mode="outlined"
                  onPress={() => Linking.openURL(update.link)}
                  style={styles.sourceBtn}
                  labelStyle={styles.sourceBtnLabel}
                  icon="open-in-new"
                  compact
                >
                  View Source Article
                </Button>
              )}
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions style={styles.actions}>
            <Button
              onPress={onDismiss}
              textColor={theme.colors.textSecondary}
            >
              Close
            </Button>
            <Button
              mode="contained"
              onPress={handleShare}
              icon="share-variant"
              style={styles.shareBtn}
              labelStyle={styles.shareBtnLabel}
            >
              Share
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  /* ── Hidden capture area ── */
  hiddenCapture: {
    position: "absolute",
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  shareCard: {
    width: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  shareAccentBar: {
    height: 6,
    backgroundColor: theme.colors.secondary,
  },
  shareContent: {
    padding: 24,
    paddingBottom: 16,
  },
  shareCategory: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  shareTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    lineHeight: 28,
    marginBottom: 8,
  },
  shareDate: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  shareDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 12,
  },
  shareSummary: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  shareSource: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 12,
  },
  shareFooter: {
    backgroundColor: "#0D1B2A",
    padding: 20,
  },
  shareFooterTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  shareAppIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 12,
  },
  shareFooterTextCol: {
    flex: 1,
  },
  shareAppName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  shareAppTagline: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  shareCTA: {
    fontSize: 12,
    color: "#D1D5DB",
    lineHeight: 18,
  },

  /* ── Dialog ── */
  dialog: {
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 20,
    maxHeight: "85%",
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  accentBar: {
    height: 4,
    backgroundColor: theme.colors.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollArea: {
    paddingHorizontal: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderColor: "transparent",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dateChip: {
    backgroundColor: theme.colors.primaryLight,
    height: 30,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  categoryChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(138, 43, 226, 0.1)",
    marginBottom: 12,
    height: 28,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.textTitle,
    lineHeight: 30,
    marginBottom: 12,
  },
  divider: {
    backgroundColor: "#E5E7EB",
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  updatedItemsBox: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  updatedItemsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  updatedItemsText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  sourceText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginBottom: 8,
  },
  sourceBtn: {
    alignSelf: "flex-start",
    borderColor: theme.colors.secondary,
    borderRadius: 10,
    marginBottom: 4,
  },
  sourceBtnLabel: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: "space-between",
  },
  shareBtn: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 10,
    elevation: 2,
  },
  shareBtnLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  shareCardImage: {
    width: 380,
    height: 220,
    resizeMode: "cover",
  },
});

export default UpdateDetailDialog;
