import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

const BookmarksScreen = () => {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.header}>Bookmarks</Text>
            <View style={styles.emptyState}>
                <Text variant="bodyLarge">No bookmarks yet.</Text>
                <Button mode="text" onPress={() => console.log('Go to library')}>
                    Browse Library
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default BookmarksScreen;
