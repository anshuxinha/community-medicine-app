import React, { useContext } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Button, List, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';

const BookmarksScreen = ({ navigation }) => {
    const { bookmarks } = useContext(AppContext);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text variant="headlineMedium" style={styles.header}>Bookmarks</Text>
                {bookmarks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text variant="bodyLarge" style={{ color: '#374151' }}>No bookmarks yet.</Text>
                        <Button mode="text" onPress={() => navigation.navigate('Library')}>
                            Browse Library
                        </Button>
                    </View>
                ) : (
                    <FlatList
                        data={bookmarks}
                        keyExtractor={(item) => item.title}
                        renderItem={({ item }) => (
                            <List.Item
                                title={item.title}
                                titleStyle={{ color: '#111827', fontWeight: '600', fontSize: 16 }}
                                left={props => <List.Icon {...props} icon={({ color }) => <MaterialIcons name="bookmark" size={24} color="#8A2BE2" />} />}
                                right={props => <List.Icon {...props} icon={({ color }) => <MaterialIcons name="chevron-right" size={24} color="#6B7280" />} />}
                                onPress={() => {
                                    navigation.navigate('Reading', {
                                        id: item.id,
                                        title: item.title,
                                        content: item.content,
                                        quizzes: item.quizzes
                                    });
                                }}
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
        backgroundColor: '#ffffff',
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default BookmarksScreen;
