import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    Animated,
    PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { normalizeUpdatedSnippet } from '../utils/contentRegistry';

const stripBold = (text) => text.replace(/\*\*(.+?)\*\*/g, '$1');
const normalizeAnchorText = (text = '') => stripBold(String(text))
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const parseMarkdown = (content) => {
    const lines = content.split('\n');
    const blocks = [];
    let bulletGroup = [];
    let nestedGroup = [];

    const flushBullets = () => {
        if (bulletGroup.length > 0) {
            blocks.push({ type: 'bullets', items: [...bulletGroup] });
            bulletGroup = [];
        }
    };

    const flushNested = () => {
        if (nestedGroup.length > 0) {
            blocks.push({ type: 'nested_bullets', items: [...nestedGroup] });
            nestedGroup = [];
        }
    };

    for (const line of lines) {
        if (line.startsWith('# ')) {
            flushBullets();
            flushNested();
            blocks.push({ type: 'h1', text: stripBold(line.replace(/^# /, '')) });
        } else if (line.startsWith('## ')) {
            flushBullets();
            flushNested();
            blocks.push({ type: 'h2', text: stripBold(line.replace(/^## /, '')) });
        } else if (/^  - /.test(line)) {
            flushBullets();
            nestedGroup.push(stripBold(line.replace(/^  - /, '')));
        } else if (/^[*\-] /.test(line)) {
            flushNested();
            bulletGroup.push(stripBold(line.replace(/^[*\-] /, '')));
        } else if (line.match(/^!\[(.*?)\]\((.*?)\)$/)) {
            flushBullets();
            flushNested();
            const match = line.match(/^!\[(.*?)\]\((.*?)\)$/);
            blocks.push({ type: 'image', url: match[2], alt: match[1] });
        } else if (line.trim() === '') {
            flushBullets();
            flushNested();
            blocks.push({ type: 'spacing' });
        } else {
            flushBullets();
            flushNested();
            blocks.push({ type: 'body', text: stripBold(line) });
        }
    }

    flushBullets();
    flushNested();
    return blocks;
};

const getBlockAnchorText = (block) => {
    if (!block) return '';
    if (block.type === 'h1' || block.type === 'h2' || block.type === 'body') {
        return normalizeAnchorText(block.text);
    }
    return '';
};

const buildIllustrationBlock = (illustration) => ({
    type: 'illustration',
    ...illustration,
});

const mergeBlocksWithIllustrations = (blocks, illustrations = []) => {
    if (!Array.isArray(illustrations) || illustrations.length === 0) {
        return blocks;
    }

    const topBlocks = [];
    const bottomBlocks = [];
    const beforeMap = new Map();
    const afterMap = new Map();

    illustrations.forEach((illustration) => {
        const normalizedPlacement = illustration.placement || 'after';
        const normalizedAnchor = normalizeAnchorText(illustration.anchorText || '');
        const illustrationBlock = buildIllustrationBlock(illustration);

        if (normalizedPlacement === 'top') {
            topBlocks.push(illustrationBlock);
            return;
        }

        if (normalizedPlacement === 'bottom' || !normalizedAnchor) {
            bottomBlocks.push(illustrationBlock);
            return;
        }

        const targetMap = normalizedPlacement === 'before' ? beforeMap : afterMap;
        const bucket = targetMap.get(normalizedAnchor) || [];
        bucket.push(illustrationBlock);
        targetMap.set(normalizedAnchor, bucket);
    });

    const mergedBlocks = [...topBlocks];
    const unmatchedBottomBlocks = [...bottomBlocks];

    blocks.forEach((block) => {
        const anchor = getBlockAnchorText(block);
        if (anchor && beforeMap.has(anchor)) {
            mergedBlocks.push(...beforeMap.get(anchor));
            beforeMap.delete(anchor);
        }

        mergedBlocks.push(block);

        if (anchor && afterMap.has(anchor)) {
            mergedBlocks.push(...afterMap.get(anchor));
            afterMap.delete(anchor);
        }
    });

    beforeMap.forEach((value) => unmatchedBottomBlocks.push(...value));
    afterMap.forEach((value) => unmatchedBottomBlocks.push(...value));

    return [...mergedBlocks, ...unmatchedBottomBlocks];
};

const REACH_END_THRESHOLD = 0.98;
const SHORT_CONTENT_TOLERANCE = 24;
const SCREEN = Dimensions.get('window');
const FULLSCREEN_MAX_ZOOM = 4;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getTouchDistance = (touches = []) => {
    if (!touches || touches.length < 2) {
        return null;
    }

    const [firstTouch, secondTouch] = touches;
    const deltaX = secondTouch.pageX - firstTouch.pageX;
    const deltaY = secondTouch.pageY - firstTouch.pageY;
    return Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
};

const resolveAspectRatio = (source, fallback = 1) => {
    const resolved = source ? Image.resolveAssetSource(source) : null;
    if (resolved?.width && resolved?.height) {
        return clamp(resolved.width / resolved.height, 0.6, 2.4);
    }

    if (typeof fallback === 'number' && fallback > 0) {
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

const ReadingView = ({
    content,
    title,
    isBookmarked,
    onToggleBookmark,
    isSpeaking,
    onToggleSpeak,
    highlightedSegments = [],
    showUpdateHighlights = false,
    illustrations = [],
    onReachEnd,
}) => {
    const insets = useSafeAreaInsets();
    const blocks = useMemo(() => parseMarkdown(content || ''), [content]);
    const mergedBlocks = useMemo(
        () => mergeBlocksWithIllustrations(blocks, illustrations),
        [blocks, illustrations]
    );
    const [scrollProgress, setScrollProgress] = useState(0);
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [fullscreenViewport, setFullscreenViewport] = useState({
        width: SCREEN.width - 32,
        height: SCREEN.height * 0.78,
    });
    const hasReachedEndRef = useRef(false);
    const viewportHeightRef = useRef(0);
    const contentHeightRef = useRef(0);
    const zoomScale = useRef(new Animated.Value(1)).current;
    const currentZoomRef = useRef(1);
    const pinchStartDistanceRef = useRef(null);
    const pinchStartZoomRef = useRef(1);

    const highlightSet = useMemo(() => new Set(
        (highlightedSegments || []).map((segment) => normalizeUpdatedSnippet(segment)).filter(Boolean)
    ), [highlightedSegments]);

    useEffect(() => {
        hasReachedEndRef.current = false;
        setScrollProgress(0);
        viewportHeightRef.current = 0;
        contentHeightRef.current = 0;
    }, [content, title]);

    const resetFullscreenZoom = () => {
        currentZoomRef.current = 1;
        setZoomLevel(1);
        pinchStartDistanceRef.current = null;
        pinchStartZoomRef.current = 1;
        Animated.spring(zoomScale, {
            toValue: 1,
            useNativeDriver: false,
            friction: 7,
            tension: 60,
        }).start();
    };

    useEffect(() => {
        resetFullscreenZoom();
    }, [fullscreenImage]);

    const pinchResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponderCapture: (event) => event.nativeEvent.touches.length >= 2,
        onMoveShouldSetPanResponderCapture: (event) => event.nativeEvent.touches.length >= 2,
        onPanResponderGrant: (event) => {
            const distance = getTouchDistance(event.nativeEvent.touches);
            if (distance) {
                pinchStartDistanceRef.current = distance;
                pinchStartZoomRef.current = currentZoomRef.current;
            }
        },
        onPanResponderMove: (event) => {
            const distance = getTouchDistance(event.nativeEvent.touches);
            if (!distance) {
                return;
            }

            if (!pinchStartDistanceRef.current) {
                pinchStartDistanceRef.current = distance;
                pinchStartZoomRef.current = currentZoomRef.current;
                return;
            }

            const nextZoom = clamp(
                pinchStartZoomRef.current * (distance / pinchStartDistanceRef.current),
                1,
                FULLSCREEN_MAX_ZOOM
            );
            currentZoomRef.current = nextZoom;
            setZoomLevel(nextZoom);
            zoomScale.setValue(nextZoom);
        },
        onPanResponderRelease: () => {
            pinchStartDistanceRef.current = null;
            pinchStartZoomRef.current = currentZoomRef.current;
        },
        onPanResponderTerminationRequest: () => true,
        onPanResponderTerminate: () => {
            pinchStartDistanceRef.current = null;
            pinchStartZoomRef.current = currentZoomRef.current;
        },
    }), [zoomScale]);

    const fullscreenBaseSize = useMemo(() => {
        const aspectRatio = resolveAspectRatio(fullscreenImage?.source, fullscreenImage?.aspectRatio || 1);
        return getContainSize(
            aspectRatio,
            fullscreenViewport.width,
            fullscreenViewport.height
        );
    }, [fullscreenImage, fullscreenViewport.height, fullscreenViewport.width]);

    const shouldHighlightText = (text) => (
        showUpdateHighlights && highlightSet.has(normalizeUpdatedSnippet(text || ''))
    );

    const maybeMarkAsReachedEnd = (progress, viewportHeight, contentHeight) => {
        if (hasReachedEndRef.current) {
            return;
        }

        const contentFitsScreen = contentHeight > 0 && viewportHeight > 0
            && contentHeight <= viewportHeight + SHORT_CONTENT_TOLERANCE;
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
        const progress = totalContentHeight > 0
            ? Math.min(Math.max(contentOffset.y / totalContentHeight, 0), 1)
            : 1;

        viewportHeightRef.current = viewportHeight;
        contentHeightRef.current = contentHeight;
        setScrollProgress(progress);
        maybeMarkAsReachedEnd(progress, viewportHeight, contentHeight);
    };

    const handleLayout = (event) => {
        viewportHeightRef.current = event.nativeEvent.layout.height;
        maybeMarkAsReachedEnd(scrollProgress, viewportHeightRef.current, contentHeightRef.current);
    };

    const handleContentSizeChange = (_, height) => {
        contentHeightRef.current = height;
        maybeMarkAsReachedEnd(scrollProgress, viewportHeightRef.current, contentHeightRef.current);
    };

    const renderBlock = (block, index) => {
        switch (block.type) {
            case 'h1': {
                const highlighted = shouldHighlightText(block.text);
                return (
                    <View key={index} style={highlighted ? styles.highlightBlock : null}>
                        <Text style={styles.h1} selectable={false}>
                            {block.text}
                        </Text>
                    </View>
                );
            }
            case 'h2': {
                const highlighted = shouldHighlightText(block.text);
                return (
                    <View key={index} style={highlighted ? styles.highlightBlock : null}>
                        <Text style={styles.h2} selectable={false}>
                            {block.text}
                        </Text>
                    </View>
                );
            }
            case 'body': {
                const highlighted = shouldHighlightText(block.text);
                return (
                    <View key={index} style={highlighted ? styles.highlightBlock : null}>
                        <Text style={styles.body} selectable={false}>
                            {block.text}
                        </Text>
                    </View>
                );
            }
            case 'bullets':
                return (
                    <View key={index} style={styles.bulletGroup}>
                        {block.items.map((item, itemIndex) => {
                            const highlighted = shouldHighlightText(item);
                            return (
                                <View key={itemIndex} style={[styles.bulletRow, highlighted ? styles.highlightBulletRow : null]}>
                                    <Text style={styles.bulletDot} selectable={false}>{'\u2022'}</Text>
                                    <Text style={styles.bulletText} selectable={false}>{item}</Text>
                                </View>
                            );
                        })}
                    </View>
                );
            case 'nested_bullets':
                return (
                    <View key={index} style={styles.nestedBulletGroup}>
                        {block.items.map((item, itemIndex) => {
                            const highlighted = shouldHighlightText(item);
                            return (
                                <View key={itemIndex} style={[styles.nestedBulletRow, highlighted ? styles.highlightBulletRow : null]}>
                                    <Text style={styles.nestedBulletDot} selectable={false}>-</Text>
                                    <Text style={styles.nestedBulletText} selectable={false}>{item}</Text>
                                </View>
                            );
                        })}
                    </View>
                );
            case 'image':
                return (
                    <TouchableOpacity
                        key={index}
                        activeOpacity={0.9}
                        onPress={() => setFullscreenImage({
                            source: { uri: block.url },
                            alt: block.alt || 'Content image',
                        })}
                    >
                        <View style={styles.contentImageFrame}>
                            <Image
                                source={{ uri: block.url }}
                                style={styles.contentImage}
                                resizeMode="contain"
                                accessible
                                accessibilityLabel={block.alt || 'Content image'}
                            />
                        </View>
                    </TouchableOpacity>
                );
            case 'illustration':
                {
                    const source = block.source || { uri: block.url };
                    const aspectRatio = resolveAspectRatio(source, block.aspectRatio || 1);

                    return (
                        <View key={index} style={styles.illustrationCard}>
                            <TouchableOpacity
                                activeOpacity={0.95}
                                onPress={() => setFullscreenImage({
                                    source,
                                    alt: block.alt || 'Topic illustration',
                                    aspectRatio,
                                })}
                            >
                                <View style={[styles.illustrationImageFrame, { aspectRatio }]}>
                                    <Image
                                        source={source}
                                        style={styles.illustrationImage}
                                        resizeMode="contain"
                                        accessible
                                        accessibilityLabel={block.alt || 'Topic illustration'}
                                    />
                                </View>
                            </TouchableOpacity>
                            {(block.caption || block.purpose) ? (
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
            case 'spacing':
                return <View key={index} style={styles.spacing} />;
            default:
                return null;
        }
    };

    const zoomedWidth = fullscreenBaseSize.width * zoomLevel;
    const zoomedHeight = fullscreenBaseSize.height * zoomLevel;

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>{title || ''}</Text>
                <View style={styles.fabRow}>
                    <TouchableOpacity
                        style={styles.fabBtn}
                        onPress={onToggleSpeak}
                        activeOpacity={0.85}
                    >
                        <MaterialIcons
                            name={isSpeaking ? 'stop' : 'volume-up'}
                            size={22}
                            color={theme.colors.secondary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.fabBtn}
                        onPress={onToggleBookmark}
                        activeOpacity={0.85}
                    >
                        <MaterialIcons
                            name={isBookmarked ? 'bookmark' : 'bookmark-border'}
                            size={22}
                            color={theme.colors.secondary}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${scrollProgress * 100}%` }]} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: 100 + insets.bottom },
                ]}
                showsVerticalScrollIndicator={false}
                onLayout={handleLayout}
                onContentSizeChange={handleContentSizeChange}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {showUpdateHighlights && highlightSet.size > 0 ? (
                    <View style={styles.updateBanner}>
                        <MaterialIcons name="auto-awesome" size={18} color={theme.colors.warningText} />
                        <Text style={styles.updateBannerText}>
                            Updated lines are highlighted in this topic until you review them.
                        </Text>
                    </View>
                ) : null}
                {mergedBlocks.map(renderBlock)}
            </ScrollView>

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

                    {zoomLevel > 1.01 ? (
                        <Pressable
                            style={styles.fullscreenReset}
                            onPress={resetFullscreenZoom}
                        >
                            <Text style={styles.fullscreenResetText}>Reset zoom</Text>
                        </Pressable>
                    ) : null}

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
                            maximumZoomScale={1}
                            contentContainerStyle={[
                                styles.fullscreenScrollContent,
                                {
                                    minWidth: Math.max(fullscreenViewport.width, zoomedWidth),
                                    minHeight: Math.max(fullscreenViewport.height, zoomedHeight),
                                },
                            ]}
                            showsHorizontalScrollIndicator={zoomLevel > 1.01}
                        >
                            <ScrollView
                                bounces={false}
                                maximumZoomScale={1}
                                contentContainerStyle={styles.fullscreenScrollContent}
                                showsVerticalScrollIndicator={zoomLevel > 1.01}
                            >
                                <Animated.View
                                    {...pinchResponder.panHandlers}
                                    style={[
                                        styles.fullscreenImageStage,
                                        {
                                            width: zoomScale.interpolate({
                                                inputRange: [1, FULLSCREEN_MAX_ZOOM],
                                                outputRange: [fullscreenBaseSize.width, fullscreenBaseSize.width * FULLSCREEN_MAX_ZOOM],
                                            }),
                                            height: zoomScale.interpolate({
                                                inputRange: [1, FULLSCREEN_MAX_ZOOM],
                                                outputRange: [fullscreenBaseSize.height, fullscreenBaseSize.height * FULLSCREEN_MAX_ZOOM],
                                            }),
                                        },
                                    ]}
                                >
                                    {fullscreenImage ? (
                                        <Image
                                            source={fullscreenImage.source}
                                            style={styles.fullscreenImage}
                                            resizeMode="contain"
                                            accessible
                                            accessibilityLabel={fullscreenImage.alt}
                                        />
                                    ) : null}
                                </Animated.View>
                            </ScrollView>
                        </ScrollView>
                    </View>

                    <Text style={styles.fullscreenHint}>
                        Pinch to zoom. Drag to inspect details. Use reset to return to fit.
                    </Text>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfacePrimary,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surfaceSecondary,
        backgroundColor: theme.colors.surfacePrimary,
        zIndex: 10,
    },
    headerTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 21,
        color: theme.colors.textTitle,
        marginRight: 12,
    },
    progressBarBackground: {
        height: 3,
        backgroundColor: theme.colors.surfaceSecondary,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
    },
    fabRow: {
        flexDirection: 'row',
        gap: 8,
    },
    fabBtn: {
        width: 44,
        height: 44,
        backgroundColor: theme.colors.surfacePrimary,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    updateBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 8,
        marginBottom: 10,
        borderRadius: 12,
        backgroundColor: theme.colors.warningBackground,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    updateBannerText: {
        flex: 1,
        color: theme.colors.warningText,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600',
    },
    h1: {
        color: theme.colors.secondary,
        fontSize: 22,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    h2: {
        color: theme.colors.textPrimary,
        fontSize: 19,
        fontWeight: '700',
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
        flexDirection: 'row',
        alignItems: 'flex-start',
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
        flexDirection: 'row',
        alignItems: 'flex-start',
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
    highlightBlock: {
        marginHorizontal: -6,
        marginVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 10,
        backgroundColor: '#FFF7D6',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    highlightBulletRow: {
        marginHorizontal: -6,
        paddingHorizontal: 6,
        borderRadius: 10,
        backgroundColor: '#FFF7D6',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    spacing: {
        height: 14,
    },
    contentImageFrame: {
        width: '100%',
        height: SCREEN.height * 0.32,
        marginVertical: 12,
        borderRadius: 12,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceTertiary,
    },
    contentImage: {
        width: '100%',
        height: '100%',
    },
    illustrationCard: {
        marginVertical: 14,
        borderRadius: 16,
        backgroundColor: theme.colors.surfacePrimary,
        borderWidth: 1,
        borderColor: theme.colors.surfaceSecondary,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    illustrationImageFrame: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceTertiary,
    },
    illustrationImage: {
        width: '100%',
        height: '100%',
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
        fontWeight: '700',
    },
    illustrationPurpose: {
        color: theme.colors.textPrimary,
        fontSize: 13.5,
        lineHeight: 20,
    },
    fullscreenBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(13, 20, 28, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    fullscreenClose: {
        position: 'absolute',
        top: 18,
        right: 18,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullscreenContent: {
        width: '100%',
        alignItems: 'center',
    },
    fullscreenViewport: {
        width: '100%',
        height: SCREEN.height * 0.78,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullscreenScrollContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullscreenImageStage: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullscreenImage: {
        width: '100%',
        height: '100%',
    },
    fullscreenReset: {
        position: 'absolute',
        top: 18,
        left: 18,
        zIndex: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.14)',
    },
    fullscreenResetText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    fullscreenHint: {
        marginTop: 12,
        color: '#F3F4F6',
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
    },
});

export default ReadingView;
