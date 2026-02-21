import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Searchbar, Text, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import mockData from '../data/mockData.json';

const SearchScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text.trim() === '') {
            setSearchResults([]);
        } else {
            const lowercasedText = text.toLowerCase();
            const filteredData = mockData.filter(item =>
                item.title.toLowerCase().includes(lowercasedText) ||
                item.content.toLowerCase().includes(lowercasedText)
            );
            setSearchResults(filteredData);
        }
    };

    const renderItem = ({ item }) => {
        // Create a brief snippet by removing markdown hash and taking the first few characters
        const cleanContent = item.content.replace(/[#*]/g, '').trim();
        return (
            <TouchableOpacity onPress={() => navigation.navigate('Reading', {
                id: item.id,
                title: item.title,
                content: item.content,
                quizzes: item.quizzes
            })}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>{item.title}</Text>
                        <Text variant="bodyMedium" numberOfLines={2} style={styles.snippet}>
                            {cleanContent}
                        </Text>
                    </Card.Content>
                </Card>
            </TouchableOpacity>
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
                />
                {searchResults.length > 0 ? (
                    <FlatList
                        data={searchResults}
                        keyExtractor={item => item.id}
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
        backgroundColor: '#ffffff',
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#ffffff',
    },
    searchBar: {
        marginBottom: 16,
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
        backgroundColor: '#f8f9fa',
    },
    cardTitle: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    snippet: {
        color: '#666',
    },
});

export default SearchScreen;
