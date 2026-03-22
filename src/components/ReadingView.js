import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { normalizeUpdatedSnippet } from '../utils/contentRegistry';

const stripBold = (text) => text.replace(/\*\*(.+?)\*\*/g, '$1');

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

const ReadingView = ({
    content,
    title,
    isBookmarked,
    onToggleBookmark,
    isSpeaking,
    onToggleSpeak,
    highlightedSegments = [],
    showUpdateHighlights = false,
}) => {
    const insets = useSafeAreaInsets();
    const blocks = useMemo(() => parseMarkdown(content || ''), [content]);
    const [scrollProgress, setScrollProgress] = useState(0);

    const highlightSet = useMemo(() => new Set(
        (highlightedSegments || []).map((segment) => normalizeUpdatedSnippet(segment)).filter(Boolean)
    ), [highlightedSegments]);

    const shouldHighlightText = (text) => (
        showUpdateHighlights && highlightSet.has(normalizeUpdatedSnippet(text || ''))
    );

    const handleScroll = (event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const totalContentHeight = contentSize.height - layoutMeasurement.height;

        if (totalContentHeight > 0) {
            const progress = Math.min(Math.max(contentOffset.y / totalContentHeight, 0), 1);
            setScrollProgress(progress);
        }
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
                                    <Text style={styles.bulletDot} selectable={false}>•</Text>
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
                    <Image
                        key={index}
                        source={{ uri: block.url }}
                        style={styles.contentImage}
                        resizeMode="contain"
                        accessible
                        accessibilityLabel={block.alt || 'Content image'}
                    />
                );
            case 'spacing':
                return <View key={index} style={styles.spacing} />;
            default:
                return null;
        }
    };

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
                {blocks.map(renderBlock)}
            </ScrollView>
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
    contentImage: {
        width: '100%',
        height: Dimensions.get('window').height * 0.3,
        marginVertical: 12,
        borderRadius: 8,
        backgroundColor: theme.colors.surfaceTertiary,
    },
});

export default ReadingView;
