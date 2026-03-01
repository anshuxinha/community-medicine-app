import React from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, Image, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Parses a markdown-like string into an array of block objects.
 * Supports: # H1, ## H2, * / - bullet items, blank lines (spacing), plain paragraphs.
 */
const parseMarkdown = (content) => {
    const lines = content.split('\n');
    const blocks = [];
    let bulletGroup = [];

    const flushBullets = () => {
        if (bulletGroup.length > 0) {
            blocks.push({ type: 'bullets', items: [...bulletGroup] });
            bulletGroup = [];
        }
    };

    for (const line of lines) {
        if (line.startsWith('# ')) {
            flushBullets();
            blocks.push({ type: 'h1', text: line.replace(/^# /, '') });
        } else if (line.startsWith('## ')) {
            flushBullets();
            blocks.push({ type: 'h2', text: line.replace(/^## /, '') });
        } else if (/^[\*\-] /.test(line)) {
            bulletGroup.push(line.replace(/^[\*\-] /, ''));
        } else if (line.match(/^!\[(.*?)\]\((.*?)\)$/)) {
            flushBullets();
            const match = line.match(/^!\[(.*?)\]\((.*?)\)$/);
            blocks.push({ type: 'image', url: match[2], alt: match[1] });
        } else if (line.trim() === '') {
            flushBullets();
            blocks.push({ type: 'spacing' });
        } else {
            flushBullets();
            blocks.push({ type: 'body', text: line });
        }
    }
    flushBullets();
    return blocks;
};

const ReadingView = ({
    content,
    topicId,
    isBookmarked,
    onToggleBookmark,
    isSpeaking,
    onToggleSpeak,
}) => {
    const insets = useSafeAreaInsets();
    const blocks = parseMarkdown(content || '');

    const renderBlock = (block, index) => {
        switch (block.type) {
            case 'h1':
                return (
                    <Text key={index} style={styles.h1} selectable={false}>
                        {block.text}
                    </Text>
                );
            case 'h2':
                return (
                    <Text key={index} style={styles.h2} selectable={false}>
                        {block.text}
                    </Text>
                );
            case 'body':
                return (
                    <Text key={index} style={styles.body} selectable={false}>
                        {block.text}
                    </Text>
                );
            case 'bullets':
                return (
                    <View key={index} style={styles.bulletGroup}>
                        {block.items.map((item, i) => (
                            <View key={i} style={styles.bulletRow}>
                                <Text style={styles.bulletDot} selectable={false}>•</Text>
                                <Text style={styles.bulletText} selectable={false}>{item}</Text>
                            </View>
                        ))}
                    </View>
                );
            case 'image':
                return (
                    <Image
                        key={index}
                        source={{ uri: block.url }}
                        style={styles.contentImage}
                        resizeMode="contain"
                        accessible={true}
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
            {/* Floating action buttons */}
            <View style={styles.fabRow} pointerEvents="box-none">
                <TouchableOpacity
                    style={styles.fabBtn}
                    onPress={onToggleSpeak}
                    activeOpacity={0.85}
                >
                    <MaterialIcons
                        name={isSpeaking ? 'stop' : 'volume-up'}
                        size={22}
                        color="#6200ee"
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
                        color="#6200ee"
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: 100 + insets.bottom },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Spacer so content clears the FABs */}
                <View style={{ height: 56 }} />
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
        backgroundColor: '#fff',
        elevation: 2,
    },
    fabRow: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        zIndex: 10,
        gap: 8,
    },
    fabBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#ffffff',
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
    },
    h1: {
        color: '#6200ee',
        fontSize: 22,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
        paddingRight: 100, // clear the FABs
    },
    h2: {
        color: '#333333',
        fontSize: 19,
        fontWeight: '700',
        marginTop: 14,
        marginBottom: 6,
    },
    body: {
        color: '#1c1b1f',
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
        color: '#6200ee',
        fontSize: 16,
        lineHeight: 24,
        marginRight: 8,
        marginLeft: 4,
    },
    bulletText: {
        flex: 1,
        color: '#1c1b1f',
        fontSize: 15.5,
        lineHeight: 24,
    },
    spacing: {
        height: 14,
    },
    contentImage: {
        width: '100%',
        height: Dimensions.get('window').height * 0.3,
        marginVertical: 12,
        borderRadius: 8,
        backgroundColor: '#f9fafb',
    }
});

export default ReadingView;
