import React, { useContext, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Searchbar, Text, Card, Badge } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import mockData from '../data/mockData.json';
import practicalData from '../data/practical.json';
import { AppContext } from '../context/AppContext';
import {
    getContentKey,
    getContentSignature,
    getItemStatus,
    getUpdatedSegmentsForItem,
} from '../utils/contentRegistry';
import { theme } from '../styles/theme';

const allData = [
    ...mockData.map((item) => ({ ...item, uniqueId: `theory_${item.id}`, section: 'theory' })),
    ...practicalData.map((item) => ({ ...item, uniqueId: `practical_${item.id}`, section: 'practical' })),
];

const StatusMark = ({ status }) => {
    if (status === 'updated') {
        return <Badge style={styles.newBadge}>NEW</Badge>;
    }

    if (status === 'read') {
        return (
            <View style={styles.readTickWrap}>
                <MaterialCommunityIcons name="check" size={14} color={theme.colors.primaryDark} />
            </View>
        );
    }

    return null;
};

const buildReadingParams = (item, status) => ({
    id: item.id,
    title: item.title,
    content: item.content || '# No Content\n\nThis topic has no content yet.',
    quizzes: item.quizzes,
    section: item.section,
    contentKey: getContentKey(item.section, item.id),
    contentSignature: getContentSignature(item),
    updatedSegments: getUpdatedSegmentsForItem(item),
    showUpdateHighlights: status === 'updated',
});

const SearchScreen = ({ navigation }) => {
    const { readItemVersions } = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text.trim() === '') {
            setSearchResults([]);
        } else {
            const lowercasedText = text.toLowerCase();
            const filteredData = allData.filter((item) =>
                (item.title || '').toLowerCase().includes(lowercasedText)
                || (item.content || '').toLowerCase().includes(lowercasedText)
            );
            setSearchResults(filteredData);
        }
    };

    const renderItem = ({ item }) => {
        const cleanContent = (item.content || '').replace(/[#*]/g, '').trim();
        const itemStatus = getItemStatus(item, item.section, readItemVersions);

        return (
            <Card
                style={styles.card}
                onPress={() => {
                    const readingParams = buildReadingParams(item, itemStatus);
                    const isFree = item.id === '1' || item.title === 'Man and Medicine';

                    if (isFree) {
                        navigation.navigate('Reading', readingParams);
                    } else {
                        navigation.navigate('PremiumGuard', { destination: 'Reading', readingParams });
                    }
                }}
            >
                <Card.Content>
                    <View style={styles.titleRow}>
                        <Text variant="titleMedium" style={styles.cardTitle}>{item.title}</Text>
                        <StatusMark status={itemStatus} />
                    </View>
                    <Text variant="bodyMedium" numberOfLines={2} style={styles.snippet}>
                        {cleanContent}
                    </Text>
                </Card.Content>
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Searchbar
                    placeholder="Search topics..."
                    onChangeText={handleSearch}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchBarInput}
                    iconColor={theme.colors.textPlaceholder}
                    elevation={0}
                />
                {searchResults.length > 0 ? (
                    <FlatList
                        data={searchResults}
                        keyExtractor={(item) => item.uniqueId}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                    />
                ) : (
                    <View style={styles.content}>
                        <Text variant="bodyLarge">
                            {searchQuery.trim() === '' ? 'Start typing to search...' : 'No results found.'}
                        </Text>
                    </View>
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
    searchBar: {
        backgroundColor: theme.colors.surfaceSecondary,
        borderRadius: 12,
        elevation: 0,
        height: 48,
        marginBottom: 16,
    },
    searchBarInput: {
        fontSize: 16,
        color: theme.colors.textTitle,
        minHeight: 48,
        alignSelf: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingBottom: 16,
    },
    card: {
        marginBottom: 12,
        backgroundColor: theme.colors.surfaceTertiary,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    cardTitle: {
        fontWeight: 'bold',
        marginBottom: 4,
        flexShrink: 1,
    },
    snippet: {
        color: theme.colors.textTertiary,
    },
    readTickWrap: {
        width: 22,
        height: 22,
        borderRadius: 11,
        marginLeft: 8,
        marginBottom: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primaryLight,
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    newBadge: {
        marginLeft: 8,
        marginBottom: 4,
        backgroundColor: theme.colors.warning,
        color: '#FFFFFF',
        fontWeight: '700',
    },
});

export default SearchScreen;
