import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Pressable,
  TextInput,
  Platform,
  ToastAndroid,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import { normalizeUpdatedSnippet } from "../utils/contentRegistry";

const stripBold = (text) => text.replace(/\*\*(.+?)\*\*/g, "$1");
const normalizeAnchorText = (text = "") =>
  stripBold(String(text)).replace(/\s+/g, " ").trim().toLowerCase();

const parseMarkdown = (content) => {
  const lines = content.split("\n");
  const blocks = [];
  let bulletGroup = [];
  let nestedGroup = [];

  const flushBullets = () => {
    if (bulletGroup.length > 0) {
      blocks.push({ type: "bullets", items: [...bulletGroup] });
      bulletGroup = [];
    }
  };

  const flushNested = () => {
    if (nestedGroup.length > 0) {
      blocks.push({ type: "nested_bullets", items: [...nestedGroup] });
      nestedGroup = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("# ")) {
      flushBullets();
      flushNested();
      blocks.push({ type: "h1", text: stripBold(line.replace(/^# /, "")) });
    } else if (line.startsWith("## ")) {
      flushBullets();
      flushNested();
      blocks.push({ type: "h2", text: stripBold(line.replace(/^## /, "")) });
    } else if (/^  - /.test(line)) {
      flushBullets();
      nestedGroup.push(stripBold(line.replace(/^  - /, "")));
    } else if (/^[*\-] /.test(line)) {
      flushNested();
      bulletGroup.push(stripBold(line.replace(/^[*\-] /, "")));
    } else if (line.match(/^!\[(.*?)\]\((.*?)\)$/)) {
      flushBullets();
      flushNested();
      const match = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      blocks.push({ type: "image", url: match[2], alt: match[1] });
    } else if (line.trim() === "") {
      flushBullets();
      flushNested();
      blocks.push({ type: "spacing" });
    } else {
      flushBullets();
      flushNested();
      blocks.push({ type: "body", text: stripBold(line) });
    }
  }

  flushBullets();
  flushNested();
  return blocks;
};

const getBlockAnchorText = (block) => {
  if (!block) return "";
  if (block.type === "h1" || block.type === "h2" || block.type === "body") {
    return normalizeAnchorText(block.text);
  }
  return "";
};

const buildIllustrationBlock = (illustration) => ({
  type: "illustration",
  ...illustration,
});

const mergeBlocksWithIllustrations = (blocks, illustrations = []) => {
  console.log(
    "mergeBlocksWithIllustrations: illustrations count",
    illustrations.length,
  );
  if (!Array.isArray(illustrations) || illustrations.length === 0) {
    console.log(
      "mergeBlocksWithIllustrations: no illustrations, returning blocks",
    );
    return blocks;
  }

  const topBlocks = [];
  const bottomBlocks = [];
  const beforeMap = new Map();
  const afterMap = new Map();

  illustrations.forEach((illustration) => {
    const normalizedPlacement = illustration.placement || "after";
    const normalizedAnchor = normalizeAnchorText(illustration.anchorText || "");
    const illustrationBlock = buildIllustrationBlock(illustration);
    console.log("mergeBlocksWithIllustrations: processing illustration", {
      normalizedPlacement,
      normalizedAnchor,
      illustrationId: illustration.id,
      fileName: illustration.fileName,
    });

    if (normalizedPlacement === "top") {
      topBlocks.push(illustrationBlock);
      console.log("mergeBlocksWithIllustrations: added to topBlocks");
      return;
    }

    if (normalizedPlacement === "bottom" || !normalizedAnchor) {
      bottomBlocks.push(illustrationBlock);
      console.log(
        "mergeBlocksWithIllustrations: added to bottomBlocks (no anchor or bottom placement)",
      );
      return;
    }

    const targetMap = normalizedPlacement === "before" ? beforeMap : afterMap;
    const bucket = targetMap.get(normalizedAnchor) || [];
    bucket.push(illustrationBlock);
    targetMap.set(normalizedAnchor, bucket);
    console.log("mergeBlocksWithIllustrations: added to map", {
      targetMap: normalizedPlacement === "before" ? "before" : "after",
      key: normalizedAnchor,
      bucketSize: bucket.length,
    });
  });

  const mergedBlocks = [...topBlocks];
  const unmatchedBottomBlocks = [...bottomBlocks];

  // Helper function to check if anchor matches block text (exact or substring)
  const doesAnchorMatchBlock = (anchor, block) => {
    if (!anchor || !block) return false;

    const blockText = getBlockAnchorText(block);
    if (!blockText) return false;

    // Exact match after normalization
    if (blockText === anchor) return true;

    // Substring match: check if anchor is contained within block text
    if (blockText.includes(anchor)) return true;

    // Also check if block text is contained within anchor (for shorter headings)
    if (anchor.includes(blockText)) return true;

    return false;
  };

  blocks.forEach((block) => {
    const blockAnchor = getBlockAnchorText(block);
    console.log("mergeBlocksWithIllustrations: checking block", {
      blockType: block.type,
      blockAnchor,
      blockText:
        block.type === "h1" || block.type === "h2" || block.type === "body"
          ? block.text?.substring(0, 50)
          : "",
    });

    // Check for before placement matches
    let matchedBefore = false;
    for (const [anchor, illustrationBlocks] of beforeMap.entries()) {
      if (doesAnchorMatchBlock(anchor, block)) {
        mergedBlocks.push(...illustrationBlocks);
        beforeMap.delete(anchor);
        console.log(
          "mergeBlocksWithIllustrations: inserted beforeMap blocks for anchor",
          anchor,
        );
        matchedBefore = true;
        break;
      }
    }

    mergedBlocks.push(block);

    // Check for after placement matches
    let matchedAfter = false;
    for (const [anchor, illustrationBlocks] of afterMap.entries()) {
      if (doesAnchorMatchBlock(anchor, block)) {
        mergedBlocks.push(...illustrationBlocks);
        afterMap.delete(anchor);
        console.log(
          "mergeBlocksWithIllustrations: inserted afterMap blocks for anchor",
          anchor,
        );
        matchedAfter = true;
        break;
      }
    }
  });

  // Add any remaining unmatched illustrations to bottom
  beforeMap.forEach((value) => {
    unmatchedBottomBlocks.push(...value);
    console.log(
      "mergeBlocksWithIllustrations: flushing unmatched beforeMap blocks",
      value.length,
    );
  });
  afterMap.forEach((value) => {
    unmatchedBottomBlocks.push(...value);
    console.log(
      "mergeBlocksWithIllustrations: flushing unmatched afterMap blocks",
      value.length,
    );
  });

  console.log(
    "mergeBlocksWithIllustrations: mergedBlocks count",
    mergedBlocks.length,
    "unmatchedBottomBlocks count",
    unmatchedBottomBlocks.length,
  );
  return [...mergedBlocks, ...unmatchedBottomBlocks];
};

/** Split text into sentences for granular highlighting. */
const splitSentences = (text) => {
  if (!text) return [text || ""];
  // Match runs of text ending with sentence punctuation
  const matches = text.match(/[^.!?]*[.!?]+/g);
  if (!matches) return [text];
  const joined = matches.join("");
  const remaining = text.slice(joined.length).trim();
  if (remaining) matches.push(remaining);
  return matches.map((s) => s.trim()).filter(Boolean);
};

const REACH_END_THRESHOLD = 0.98;
const SHORT_CONTENT_TOLERANCE = 24;
const SCREEN = Dimensions.get("window");
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const resolveAspectRatio = (source, fallback = 1) => {
  const resolved = source ? Image.resolveAssetSource(source) : null;
  if (resolved?.width && resolved?.height) {
    return clamp(resolved.width / resolved.height, 0.6, 2.4);
  }

  if (typeof fallback === "number" && fallback > 0) {
    return clamp(fallback, 0.6, 2.4);
  }

  return 1;
};

const getContainSize = (aspectRatio, maxWidth, maxHeight) => {
  if (!aspectRatio || maxWidth <= 0 || maxHeight <= 0) {
    return { width: maxWidth, height: maxHeight };
  }

  const viewportRatio = maxWidth / maxHeight;
  if (aspectRatio >= viewportRatio) {
    return {
      width: maxWidth,
      height: maxWidth / aspectRatio,
    };
  }

  return {
    width: maxHeight * aspectRatio,
    height: maxHeight,
  };
};

const getRotationKey = (source, fallback = "") => {
  if (typeof source === "number") {
    return `asset:${source}`;
  }

  if (source?.uri) {
    return `uri:${source.uri}`;
  }

  return fallback;
};

const getRotatedAspectRatio = (aspectRatio, rotation = 0) => {
  const normalizedTurns = Math.abs(Math.round(rotation / 90)) % 2;
  return normalizedTurns === 1 ? 1 / aspectRatio : aspectRatio;
};

const ReadingView = ({
  content,
  title,
  topicId,
  isBookmarked,
  onToggleBookmark,
  isSpeaking,
  onToggleSpeak,
  highlightedSegments = [],
  showUpdateHighlights = false,
  illustrations = [],
  onReachEnd,
  isScreenCapturePrevented = false,
  navigation,
  section,
  annotations = [],
  onSaveAnnotation,
  onDeleteAnnotation,
  userHighlights = {},
  onToggleHighlight,
}) => {
  console.log("ReadingView: illustrations prop", illustrations);
  const insets = useSafeAreaInsets();
  const blocks = useMemo(() => parseMarkdown(content || ""), [content]);
  const mergedBlocks = useMemo(
    () => mergeBlocksWithIllustrations(blocks, illustrations),
    [blocks, illustrations],
  );
  const [scrollProgress, setScrollProgress] = useState(0);
  const [imageRotationMap, setImageRotationMap] = useState({});
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [viewerZoomScale, setViewerZoomScale] = useState(MIN_ZOOM);
  const [fullscreenRotation, setFullscreenRotation] = useState(0);
  const [fullscreenViewport, setFullscreenViewport] = useState({
    width: SCREEN.width - 32,
    height: SCREEN.height * 0.78,
  });
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [annotationText, setAnnotationText] = useState("");
  const [showHighlightsLocal, setShowHighlightsLocal] = useState(showUpdateHighlights);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const hasReachedEndRef = useRef(false);
  const viewportHeightRef = useRef(0);
  const contentHeightRef = useRef(0);

  const highlightSet = useMemo(
    () =>
      new Set(
        (highlightedSegments || [])
          .map((segment) => normalizeUpdatedSnippet(segment))
          .filter(Boolean),
      ),
    [highlightedSegments],
  );

  useEffect(() => {
    hasReachedEndRef.current = false;
    setScrollProgress(0);
    viewportHeightRef.current = 0;
    contentHeightRef.current = 0;
  }, [content, title]);

  const rotateImage = (rotationKey, delta) => {
    if (!rotationKey) {
      return;
    }

    setImageRotationMap((current) => {
      const nextRotation =
        ((((current[rotationKey] || 0) + delta) % 360) + 360) % 360;
      return {
        ...current,
        [rotationKey]: nextRotation,
      };
    });
  };

  const openFullscreenImage = ({ source, alt, aspectRatio, rotationKey }) => {
    const currentRotation = imageRotationMap[rotationKey] || 0;
    setViewerZoomScale(MIN_ZOOM);
    setFullscreenRotation(currentRotation);
    setFullscreenImage({
      source,
      alt,
      aspectRatio,
      rotationKey,
    });
  };

  useEffect(() => {
    if (!fullscreenImage) {
      setViewerZoomScale(MIN_ZOOM);
      setFullscreenRotation(0);
    }
  }, [fullscreenImage]);

  const fullscreenBaseSize = useMemo(() => {
    const originalAspectRatio = resolveAspectRatio(
      fullscreenImage?.source,
      fullscreenImage?.aspectRatio || 1,
    );
    const rotatedAspectRatio = getRotatedAspectRatio(
      originalAspectRatio,
      fullscreenRotation,
    );
    return getContainSize(
      rotatedAspectRatio,
      fullscreenViewport.width,
      fullscreenViewport.height,
    );
  }, [
    fullscreenImage,
    fullscreenRotation,
    fullscreenViewport.height,
    fullscreenViewport.width,
  ]);

  const fullscreenZoomedSize = useMemo(
    () => ({
      width: fullscreenBaseSize.width * viewerZoomScale,
      height: fullscreenBaseSize.height * viewerZoomScale,
    }),
    [fullscreenBaseSize.height, fullscreenBaseSize.width, viewerZoomScale],
  );

  const shouldHighlightText = (text) =>
    showHighlightsLocal &&
    highlightSet.has(normalizeUpdatedSnippet(text || ""));

  const showToast = useCallback((message) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("", message);
    }
  }, []);

  const toggleHighlightMode = useCallback(() => {
    setIsHighlightMode((prev) => {
      const next = !prev;
      if (next) {
        setIsAnnotationMode(false);
        showToast("Click on any sentence to highlight it");
      }
      return next;
    });
  }, [showToast]);



  const handleBlockPress = useCallback(
    (blockIndex) => {
      if (!isAnnotationMode) return;
      setEditingAnnotation({ blockIndex, id: null });
      setAnnotationText("");
      setNoteModalVisible(true);
    },
    [isAnnotationMode],
  );

  const handleSaveAnnotation = useCallback(() => {
    if (!annotationText.trim() || !editingAnnotation) return;
    const annotation = {
      id: editingAnnotation.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      blockIndex: editingAnnotation.blockIndex,
      text: annotationText.trim(),
      createdAt: new Date().toISOString(),
    };
    onSaveAnnotation?.(annotation);
    setEditingAnnotation(null);
    setAnnotationText("");
    setNoteModalVisible(false);
    setIsAnnotationMode(false);
  }, [annotationText, editingAnnotation, onSaveAnnotation]);

  const handleDeleteAnnotation = useCallback(
    (annotationId) => {
      onDeleteAnnotation?.(annotationId);
    },
    [onDeleteAnnotation],
  );

  const annotationsByBlock = useMemo(() => {
    const map = {};
    (annotations || []).forEach((a) => {
      if (!map[a.blockIndex]) map[a.blockIndex] = [];
      map[a.blockIndex].push(a);
    });
    return map;
  }, [annotations]);

  const maybeMarkAsReachedEnd = (progress, viewportHeight, contentHeight) => {
    if (hasReachedEndRef.current) {
      return;
    }

    const contentFitsScreen =
      contentHeight > 0 &&
      viewportHeight > 0 &&
      contentHeight <= viewportHeight + SHORT_CONTENT_TOLERANCE;
    const scrolledToBottom = progress >= REACH_END_THRESHOLD;

    if (contentFitsScreen || scrolledToBottom) {
      hasReachedEndRef.current = true;
      onReachEnd?.();
    }
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const viewportHeight = layoutMeasurement.height;
    const contentHeight = contentSize.height;
    const totalContentHeight = contentHeight - viewportHeight;
    const progress =
      totalContentHeight > 0
        ? Math.min(Math.max(contentOffset.y / totalContentHeight, 0), 1)
        : 1;

    viewportHeightRef.current = viewportHeight;
    contentHeightRef.current = contentHeight;
    setScrollProgress(progress);
    maybeMarkAsReachedEnd(progress, viewportHeight, contentHeight);
  };

  const handleLayout = (event) => {
    viewportHeightRef.current = event.nativeEvent.layout.height;
    maybeMarkAsReachedEnd(
      scrollProgress,
      viewportHeightRef.current,
      contentHeightRef.current,
    );
  };

  const handleContentSizeChange = (_, height) => {
    contentHeightRef.current = height;
    maybeMarkAsReachedEnd(
      scrollProgress,
      viewportHeightRef.current,
      contentHeightRef.current,
    );
  };

  const renderBlock = (block, index) => {
    switch (block.type) {
      case "h1": {
        const highlighted = shouldHighlightText(block.text);
        const hlKey = `${index}`;
        const userHighlighted = userHighlights[hlKey];
        const inner = (
          <View key={index} style={[highlighted ? styles.highlightBlock : null, userHighlighted ? styles.userHighlightBlock : null]}>
            <Text style={styles.h1} selectable={false}>
              {block.text}
            </Text>
          </View>
        );
        return (
          <Pressable key={index} disabled={!isHighlightMode && !userHighlighted} onPress={() => onToggleHighlight(hlKey)}>
            {inner}
          </Pressable>
        );
      }
      case "h2": {
        const highlighted = shouldHighlightText(block.text);
        const hlKey = `${index}`;
        const userHighlighted = userHighlights[hlKey];
        const inner = (
          <View key={index} style={[highlighted ? styles.highlightBlock : null, userHighlighted ? styles.userHighlightBlock : null]}>
            <Text style={styles.h2} selectable={false}>
              {block.text}
            </Text>
          </View>
        );
        return (
          <Pressable key={index} disabled={!isHighlightMode && !userHighlighted} onPress={() => onToggleHighlight(hlKey)}>
            {inner}
          </Pressable>
        );
      }
      case "body": {
        const highlighted = shouldHighlightText(block.text);
        const sentences = splitSentences(block.text);
        return (
          <View key={index} style={[highlighted ? styles.highlightBlock : null, { marginVertical: 4 }]}>
            <Text style={styles.body} selectable={false}>
              {sentences.map((sentence, sIdx) => {
                const hlKey = `${index}:${sIdx}`;
                const isHl = userHighlights[hlKey];
                return (
                  <Text
                    key={sIdx}
                    style={isHl ? styles.userHighlightSentence : null}
                    selectable={false}
                    onPress={(isHighlightMode || isHl) ? () => onToggleHighlight(hlKey) : undefined}
                    suppressHighlighting={true}
                  >
                    {sIdx > 0 ? " " : ""}{sentence}
                  </Text>
                );
              })}
            </Text>
          </View>
        );
      }
      case "bullets":
        return (
          <View key={index} style={styles.bulletGroup}>
            {block.items.map((item, itemIndex) => {
              const highlighted = shouldHighlightText(item);
              const hlKey = `${index}:b${itemIndex}`;
              const isHl = userHighlights[hlKey];
              const row = (
                <View
                  key={itemIndex}
                  style={[
                    styles.bulletRow,
                    highlighted ? styles.highlightBulletRow : null,
                    isHl ? styles.userHighlightSentence : null,
                  ]}
                >
                  <Text style={styles.bulletDot} selectable={false}>
                    {"\u2022"}
                  </Text>
                  <Text style={styles.bulletText} selectable={false}>
                    {item}
                  </Text>
                </View>
              );
              return (
                <Pressable key={itemIndex} disabled={!isHighlightMode && !isHl} onPress={() => onToggleHighlight(hlKey)}>
                  {row}
                </Pressable>
              );
            })}
          </View>
        );
      case "nested_bullets":
        return (
          <View key={index} style={styles.nestedBulletGroup}>
            {block.items.map((item, itemIndex) => {
              const highlighted = shouldHighlightText(item);
              const hlKey = `${index}:b${itemIndex}`;
              const isHl = userHighlights[hlKey];
              const row = (
                <View
                  key={itemIndex}
                  style={[
                    styles.nestedBulletRow,
                    highlighted ? styles.highlightBulletRow : null,
                    isHl ? styles.userHighlightSentence : null,
                  ]}
                >
                  <Text style={styles.nestedBulletDot} selectable={false}>
                    -
                  </Text>
                  <Text style={styles.nestedBulletText} selectable={false}>
                    {item}
                  </Text>
                </View>
              );
              return (
                <Pressable key={itemIndex} disabled={!isHighlightMode && !isHl} onPress={() => onToggleHighlight(hlKey)}>
                  {row}
                </Pressable>
              );
            })}
          </View>
        );
      case "image": {
        const source = { uri: block.url };
        const aspectRatio = resolveAspectRatio(source, 1);
        const rotationKey = getRotationKey(source, `content:${index}`);
        const rotation = imageRotationMap[rotationKey] || 0;
        const displayAspectRatio = getRotatedAspectRatio(aspectRatio, rotation);

        return (
          <View key={index} style={styles.inlineImageShell}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                openFullscreenImage({
                  source,
                  alt: block.alt || "Content image",
                  aspectRatio,
                  rotationKey,
                })
              }
            >
              <View
                style={[
                  styles.contentImageFrame,
                  { aspectRatio: displayAspectRatio },
                ]}
              >
                <Image
                  source={source}
                  style={[
                    styles.contentImage,
                    { transform: [{ rotate: `${rotation}deg` }] },
                  ]}
                  resizeMode="contain"
                  accessible
                  accessibilityLabel={block.alt || "Content image"}
                />
              </View>
            </TouchableOpacity>
            <Pressable
              style={styles.inlineImageControl}
              onPress={() =>
                openFullscreenImage({
                  source,
                  alt: block.alt || "Content image",
                  aspectRatio,
                  rotationKey,
                })
              }
            >
              <MaterialIcons name="fullscreen" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        );
      }
      case "illustration": {
        const source = block.source || { uri: block.url };
        const aspectRatio = resolveAspectRatio(source, block.aspectRatio || 1);
        const rotationKey = getRotationKey(
          source,
          block.id || `${index}:${block.alt || "illustration"}`,
        );
        const rotation = imageRotationMap[rotationKey] || 0;
        const displayAspectRatio = getRotatedAspectRatio(aspectRatio, rotation);

        return (
          <View key={index} style={styles.illustrationCard}>
            <View style={styles.inlineImageShell}>
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() =>
                  openFullscreenImage({
                    source,
                    alt: block.alt || "Topic illustration",
                    aspectRatio,
                    rotationKey,
                  })
                }
              >
                <View
                  style={[
                    styles.illustrationImageFrame,
                    { aspectRatio: displayAspectRatio },
                  ]}
                >
                  <Image
                    source={source}
                    style={[
                      styles.illustrationImage,
                      { transform: [{ rotate: `${rotation}deg` }] },
                    ]}
                    resizeMode="contain"
                    accessible
                    accessibilityLabel={block.alt || "Topic illustration"}
                  />
                </View>
              </TouchableOpacity>
              <Pressable
                style={styles.inlineImageControl}
                onPress={() =>
                  openFullscreenImage({
                    source,
                    alt: block.alt || "Topic illustration",
                    aspectRatio,
                    rotationKey,
                  })
                }
              >
                <MaterialIcons name="fullscreen" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            {block.caption || block.purpose ? (
              <View style={styles.illustrationTextBlock}>
                {block.caption ? (
                  <Text style={styles.illustrationCaption} selectable={false}>
                    {block.caption}
                  </Text>
                ) : null}
                {block.purpose ? (
                  <Text style={styles.illustrationPurpose} selectable={false}>
                    {block.purpose}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      }
      case "spacing":
        return <View key={index} style={styles.spacing} />;
      default:
        return null;
    }
  };

  const renderAnnotationCard = (annotation) => (
    <TouchableOpacity
      key={annotation.id}
      style={styles.annotationCard}
      activeOpacity={0.7}
      onPress={() => {
        setEditingAnnotation({ blockIndex: annotation.blockIndex, id: annotation.id });
        setAnnotationText(annotation.text);
        setNoteModalVisible(true);
      }}
    >
      <View style={styles.annotationCardHeader}>
        <MaterialIcons name="sticky-note-2" size={14} color="#D4A853" />
        <Text style={styles.annotationCardLabel} selectable={false}>
          Note
        </Text>
        <TouchableOpacity
          onPress={() => handleDeleteAnnotation(annotation.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="close" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.annotationCardText} selectable={false}>
        {annotation.text}
      </Text>
    </TouchableOpacity>
  );

  const renderBlockWithAnnotations = (block, index) => {
    const blockAnnotations = annotationsByBlock[index] || [];
    const tappable = isAnnotationMode && block.type !== "spacing";

    return (
      <View key={`block-wrapper-${index}`}>
        <Pressable
          disabled={!tappable}
          onPress={() => handleBlockPress(index)}
          style={({ pressed }) => [
            { borderWidth: 1, borderColor: "transparent", borderRadius: 6, borderStyle: "dashed" },
            tappable && pressed && styles.annotationModePressedBlock,
          ]}
        >
          {renderBlock(block, index)}
        </Pressable>
        {blockAnnotations.map(renderAnnotationCard)}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {isScreenCapturePrevented && (
        <View style={styles.captureProtectedOverlay} pointerEvents="none">
          <Text style={styles.captureProtectedText}>
            Screen recording is not allowed
          </Text>
        </View>
      )}

      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textTitle} />
        </TouchableOpacity>
        <Text style={styles.headerSectionTitle} numberOfLines={1} selectable={false}>
          {topicId ? `Chapter ${topicId}` : section || ""}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={onToggleBookmark}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isBookmarked ? "bookmark" : "bookmark-border"}
              size={22}
              color={theme.colors.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={onToggleSpeak}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isSpeaking ? "stop" : "volume-up"}
              size={22}
              color={theme.colors.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Progress Bar ── */}
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${scrollProgress * 100}%` },
          ]}
        />
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Chapter intro block */}
        <View style={styles.chapterIntro}>
          <Text style={styles.chapterLabel} selectable={false}>
            {section ? section.toUpperCase() : ""}
          </Text>
          <Text style={styles.chapterTitle} selectable={false}>
            {title || ""}
          </Text>
          <View style={styles.chapterDivider} />
        </View>



        {showUpdateHighlights && highlightSet.size > 0 ? (
          <View style={styles.updateBanner}>
            <MaterialIcons
              name="auto-awesome"
              size={18}
              color={theme.colors.warningText}
            />
            <Text style={styles.updateBannerText}>
              Updated lines are highlighted in this topic until you review them.
            </Text>
          </View>
        ) : null}
        {mergedBlocks.map(renderBlockWithAnnotations)}
      </ScrollView>

      {/* ── Bottom Toolbar ── */}
      <View style={[styles.bottomToolbar, { paddingBottom: insets.bottom || 8 }]}>
        <TouchableOpacity
          style={styles.toolbarItem}
          onPress={() => navigation?.navigate("MainTabs", { screen: "Library" })}
          activeOpacity={0.7}
        >
          <MaterialIcons name="menu-book" size={22} color={theme.colors.textTertiary} />
          <Text style={styles.toolbarLabel} selectable={false}>LIBRARY</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarItem}
          onPress={toggleHighlightMode}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="border-color"
            size={22}
            color={isHighlightMode ? theme.colors.secondary : theme.colors.textTertiary}
          />
          <Text
            style={[
              styles.toolbarLabel,
              isHighlightMode && styles.toolbarLabelActive,
            ]}
            selectable={false}
          >
            HIGHLIGHT
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarItem}
          onPress={() => {
            setIsAnnotationMode((prev) => {
              const next = !prev;
              if (next) {
                setIsHighlightMode(false);
                showToast("Tap on any paragraph to add a note");
              }
              return next;
            });
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="edit-note"
            size={24}
            color={isAnnotationMode ? theme.colors.secondary : theme.colors.textTertiary}
          />
          <Text
            style={[
              styles.toolbarLabel,
              isAnnotationMode && styles.toolbarLabelActive,
            ]}
            selectable={false}
          >
            NOTE
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Note Modal ── */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => {
          setNoteModalVisible(false);
          setEditingAnnotation(null);
          setAnnotationText("");
        }}
      >
        <Pressable
          style={styles.noteModalBackdrop}
          onPress={() => {
            setNoteModalVisible(false);
            setEditingAnnotation(null);
            setAnnotationText("");
          }}
        >
          <Pressable style={styles.noteModalContent} onPress={() => {}}>
            <Text style={styles.noteModalTitle} selectable={false}>
              {editingAnnotation?.id ? "Edit Note" : "Add Note"}
            </Text>
            <TextInput
              style={styles.noteModalInput}
              placeholder="Write your note..."
              placeholderTextColor="#9CA3AF"
              value={annotationText}
              onChangeText={setAnnotationText}
              multiline
              selectable
            />
            <View style={styles.noteModalActions}>
              <TouchableOpacity
                style={styles.annotationCancelBtn}
                onPress={() => {
                  setNoteModalVisible(false);
                  setEditingAnnotation(null);
                  setAnnotationText("");
                }}
              >
                <Text style={styles.annotationCancelText} selectable={false}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.annotationSaveBtn,
                  !annotationText.trim() && styles.annotationSaveBtnDisabled,
                ]}
                onPress={handleSaveAnnotation}
                disabled={!annotationText.trim()}
              >
                <Text style={styles.annotationSaveText} selectable={false}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Fullscreen Image Modal ── */}
      <Modal
        visible={Boolean(fullscreenImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImage(null)}
      >
        <View style={styles.fullscreenBackdrop}>
          <Pressable
            style={styles.fullscreenClose}
            onPress={() => setFullscreenImage(null)}
          >
            <MaterialIcons name="close" size={28} color="#FFFFFF" />
          </Pressable>

          <View
            style={styles.fullscreenViewport}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setFullscreenViewport({ width, height });
            }}
          >
            <ScrollView
              horizontal
              bounces={false}
              contentContainerStyle={styles.viewerOuterScrollContent}
            >
              <ScrollView
                bounces={false}
                contentContainerStyle={styles.viewerInnerScrollContent}
              >
                {fullscreenImage ? (
                  <Image
                    source={fullscreenImage.source}
                    style={[
                      styles.fullscreenImage,
                      fullscreenZoomedSize,
                      { transform: [{ rotate: `${fullscreenRotation}deg` }] },
                    ]}
                    resizeMode="contain"
                    accessible
                    accessibilityLabel={fullscreenImage.alt}
                  />
                ) : null}
              </ScrollView>
            </ScrollView>
          </View>

          <View style={styles.viewerControls}>
            <Pressable
              accessibilityRole="button"
              disabled={viewerZoomScale <= MIN_ZOOM}
              onPress={() =>
                setViewerZoomScale((current) =>
                  Math.max(MIN_ZOOM, current - ZOOM_STEP),
                )
              }
              style={[
                styles.viewerControlButton,
                viewerZoomScale <= MIN_ZOOM &&
                  styles.viewerControlButtonDisabled,
              ]}
            >
              <MaterialIcons name="remove" size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.viewerZoomLabel}>
              {Math.round(viewerZoomScale * 100)}%
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={viewerZoomScale >= MAX_ZOOM}
              onPress={() =>
                setViewerZoomScale((current) =>
                  Math.min(MAX_ZOOM, current + ZOOM_STEP),
                )
              }
              style={[
                styles.viewerControlButton,
                viewerZoomScale >= MAX_ZOOM &&
                  styles.viewerControlButtonDisabled,
              ]}
            >
              <MaterialIcons name="add" size={22} color="#FFFFFF" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (fullscreenImage?.rotationKey) {
                  rotateImage(fullscreenImage.rotationKey, -90);
                }
                setFullscreenRotation(
                  (current) => (((current - 90) % 360) + 360) % 360,
                );
              }}
              style={styles.viewerControlButton}
            >
              <MaterialIcons name="rotate-left" size={22} color="#FFFFFF" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (fullscreenImage?.rotationKey) {
                  rotateImage(fullscreenImage.rotationKey, 90);
                }
                setFullscreenRotation((current) => (current + 90) % 360);
              }}
              style={styles.viewerControlButton}
            >
              <MaterialIcons name="rotate-right" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.fullscreenHint}>
            Use + / - to zoom. Rotate buttons work in both reading and
            fullscreen views.
          </Text>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfacePrimary,
  },
  captureProtectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.surfacePrimary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  captureProtectedText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Header ──
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.surfacePrimary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    zIndex: 10,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.secondary,
    marginLeft: 4,
    marginRight: "auto",
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },

  // ── Progress ──
  progressBarBackground: {
    height: 2.5,
    backgroundColor: theme.colors.surfaceSecondary,
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
  },

  // ── Chapter Intro ──
  chapterIntro: {
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  chapterLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
    color: theme.colors.textTertiary,
    marginBottom: 8,
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.textTitle,
    lineHeight: 32,
    marginBottom: 16,
  },
  chapterDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  // ── Banners ──
  updateBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.warningBackground,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  updateBannerText: {
    flex: 1,
    color: theme.colors.warningText,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  annotationModeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#F3F0FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  annotationModeBannerText: {
    flex: 1,
    color: theme.colors.secondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },

  // ── Typography (body size unchanged) ──
  h1: {
    color: theme.colors.secondary,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  h2: {
    color: theme.colors.textPrimary,
    fontSize: 19,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 6,
  },
  body: {
    color: theme.colors.textTitle,
    fontSize: 15.5,
    lineHeight: 24,
    marginVertical: 4,
  },
  bulletGroup: {
    marginVertical: 4,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  bulletDot: {
    color: theme.colors.secondary,
    fontSize: 16,
    lineHeight: 24,
    marginRight: 8,
    marginLeft: 4,
  },
  bulletText: {
    flex: 1,
    color: theme.colors.textTitle,
    fontSize: 15.5,
    lineHeight: 24,
  },
  nestedBulletGroup: {
    marginVertical: 2,
    marginLeft: 20,
  },
  nestedBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  nestedBulletDot: {
    color: theme.colors.secondary,
    fontSize: 14,
    lineHeight: 22,
    marginRight: 8,
    marginLeft: 4,
  },
  nestedBulletText: {
    flex: 1,
    color: theme.colors.textTitle,
    fontSize: 14.5,
    lineHeight: 22,
  },

  // ── Highlights (gold left-border style) ──
  highlightBlock: {
    marginVertical: 2,
    paddingLeft: 14,
    paddingVertical: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#D4A853",
    backgroundColor: "#FDFAF3",
    borderRadius: 0,
  },
  highlightBulletRow: {
    paddingLeft: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#D4A853",
    backgroundColor: "#FDFAF3",
    borderRadius: 0,
  },

  // ── User Highlights (yellow background) ──
  userHighlightBlock: {
    backgroundColor: "#FEF9C3",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginVertical: 1,
  },
  highlightModeBlock: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
    borderStyle: "dashed",
  },
  userHighlightSentence: {
    backgroundColor: "#FEF08A",
    borderRadius: 2,
  },
  sentenceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 4,
  },
  sentenceInline: {
    marginVertical: 0,
    marginRight: 4,
  },

  // ── Spacing ──
  spacing: {
    height: 14,
  },

  // ── Images ──
  inlineImageShell: {
    position: "relative",
    marginVertical: 12,
  },
  contentImageFrame: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceTertiary,
  },
  contentImage: {
    width: "100%",
    height: "100%",
  },
  inlineImageControl: {
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
  illustrationCard: {
    marginVertical: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.surfacePrimary,
    borderWidth: 1,
    borderColor: theme.colors.surfaceSecondary,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  illustrationImageFrame: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceTertiary,
  },
  illustrationImage: {
    width: "100%",
    height: "100%",
  },
  illustrationTextBlock: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  illustrationCaption: {
    color: theme.colors.textTitle,
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: "700",
  },
  illustrationPurpose: {
    color: theme.colors.textPrimary,
    fontSize: 13.5,
    lineHeight: 20,
  },

  // ── Bottom Toolbar ──
  bottomToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
    backgroundColor: theme.colors.surfacePrimary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  toolbarItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    minWidth: 64,
  },
  toolbarLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: theme.colors.textTertiary,
    marginTop: 3,
  },
  toolbarLabelActive: {
    color: theme.colors.secondary,
  },

  // ── Annotation Mode ──
  annotationModeBlock: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
    borderStyle: "dashed",
  },
  annotationModePressedBlock: {
    backgroundColor: "#F3F0FF",
    borderRadius: 6,
    borderColor: theme.colors.secondary,
    borderWidth: 1,
    borderStyle: "dashed",
  },

  // ── Annotation Cards ──
  annotationCard: {
    marginTop: 6,
    marginBottom: 8,
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#D4A853",
    backgroundColor: "#FEFCE8",
    borderRadius: 8,
  },
  annotationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  annotationCardLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: "#92400E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  annotationCardText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textPrimary,
  },

  // ── Annotation Input ──
  annotationInputCard: {
    marginTop: 6,
    marginBottom: 8,
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.secondary,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  annotationInput: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textTitle,
    minHeight: 48,
    textAlignVertical: "top",
    padding: 0,
  },
  annotationInputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  annotationCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  annotationCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textTertiary,
  },
  annotationSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.secondary,
  },
  annotationSaveBtnDisabled: {
    opacity: 0.4,
  },
  annotationSaveText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // ── Note Modal ──
  noteModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  noteModalContent: {
    width: "100%",
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  noteModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textTitle,
    marginBottom: 16,
  },
  noteModalInput: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textTitle,
    minHeight: 80,
    textAlignVertical: "top",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
  },
  noteModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },

  // ── Fullscreen Image Viewer ──
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: "rgba(13, 20, 28, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  fullscreenClose: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenContent: {
    width: "100%",
    alignItems: "center",
  },
  fullscreenViewport: {
    width: "100%",
    height: SCREEN.height * 0.78,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerOuterScrollContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  viewerInnerScrollContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenImage: {
    width: SCREEN.width - 32,
    height: SCREEN.height * 0.6,
  },
  viewerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  viewerControlButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  viewerControlButtonDisabled: {
    opacity: 0.45,
  },
  viewerZoomLabel: {
    minWidth: 58,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  fullscreenHint: {
    marginTop: 12,
    color: "#F3F4F6",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});

export default ReadingView;
