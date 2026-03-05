import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Searchbar, Text, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import mockData from '../data/mockData.json';
import practicalData from '../data/practical.json';
import { theme } from '../styles/theme';

const allData = [
    ...mockData.map(item => ({ ...item, uniqueId: 'theory_' + item.id })),
    ...practicalData.map(item => ({ ...item, uniqueId: 'practical_' + item.id }))
];

const SearchScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text.trim() === '') {
            setSearchResults([]);
        } else {
            const lowercasedText = text.toLowerCase();
            const filteredData = allData.filter(item =>
                (item.title || '').toLowerCase().includes(lowercasedText) ||
                (item.content || '').toLowerCase().includes(lowercasedText)
            );
            setSearchResults(filteredData);
        }
    };

    const renderItem = ({ item }) => {
        // Create a brief snippet by removing markdown hash and taking the first few characters
        const cleanContent = (item.content || '').replace(/[#*]/g, '').trim();
        return (
            <Card style={styles.card} onPress={() => {
                const readingParams = {
                    id: item.id,
                    title: item.title,
                    content: item.content,
                    quizzes: item.quizzes
                };

                const isFree = item.id === '1' || item.title === 'Man and Medicine';

                if (isFree) {
                    navigation.navigate('Reading', readingParams);
                } else {
                    navigation.navigate('PremiumGuard', { destination: 'Reading', readingParams });
                }
            }}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.cardTitle}>{item.title}</Text>
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
                    iconColor=theme.colors.textPlaceholder
                    elevation={0}
                />
                {searchResults.length > 0 ? (
                    <FlatList
                        data={searchResults}
                        keyExtractor={item => item.uniqueId}
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
        backgroundColor: theme.colors.surfaceSecondary, // Very light gray from library
        borderRadius: 12, // More rounded corners
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
    cardTitle: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    snippet: {
        color: theme.colors.textTertiary,
    },
});

export default SearchScreen;
