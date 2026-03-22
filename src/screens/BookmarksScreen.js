import React, { useContext } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Button, List, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { theme } from '../styles/theme';
import {
    getContentKey,
    getContentSignature,
    getCurrentContentEntry,
    getUpdatedSegmentsForItem,
    getItemStatus,
} from '../utils/contentRegistry';

const BookmarksScreen = ({ navigation }) => {
    const { bookmarks, readItemVersions } = useContext(AppContext);

    const openBookmark = (bookmark) => {
        const currentEntry = getCurrentContentEntry(bookmark);
        const currentItem = currentEntry?.item || bookmark;
        const effectiveSection = currentEntry?.section || bookmark.section || null;
        const itemStatus = effectiveSection ? getItemStatus(currentItem, effectiveSection, readItemVersions) : 'none';

        navigation.navigate('Reading', {
            ...bookmark,
            id: currentItem.id,
            title: currentItem.title,
            content: currentItem.content,
            quizzes: currentItem.quizzes,
            section: effectiveSection,
            contentKey: bookmark.contentKey || (effectiveSection ? getContentKey(effectiveSection, currentItem.id) : null),
            contentSignature: getContentSignature(currentItem),
            updatedSegments: getUpdatedSegmentsForItem(currentItem),
            showUpdateHighlights: itemStatus === 'updated',
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text variant="headlineMedium" style={styles.header}>Bookmarks</Text>
                {bookmarks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text variant="bodyLarge" style={styles.emptyText}>No bookmarks yet.</Text>
                        <Button mode="text" onPress={() => navigation.navigate('Library')}>
                            Browse Library
                        </Button>
                    </View>
                ) : (
                    <FlatList
                        data={bookmarks}
                        keyExtractor={(item, index) => item.contentKey || `${item.title}-${index}`}
                        renderItem={({ item }) => (
                            <List.Item
                                title={item.title}
                                titleStyle={styles.itemTitle}
                                left={(leftProps) => (
                                    <List.Icon
                                        {...leftProps}
                                        icon={() => <MaterialIcons name="bookmark" size={24} color={theme.colors.secondary} />}
                                    />
                                )}
                                right={(rightProps) => (
                                    <List.Icon
                                        {...rightProps}
                                        icon={() => <MaterialIcons name="chevron-right" size={24} color={theme.colors.textTertiary} />}
                                    />
                                )}
                                onPress={() => openBookmark(item)}
                            />
                        )}
                        ItemSeparatorComponent={Divider}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.surfacePrimary,
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: theme.colors.surfacePrimary,
    },
    header: {
        marginBottom: 16,
        fontWeight: 'bold',
        color: theme.colors.textTitle,
    },
    itemTitle: {
        color: theme.colors.textTitle,
        fontWeight: '600',
        fontSize: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#374151',
    },
});

export default BookmarksScreen;
