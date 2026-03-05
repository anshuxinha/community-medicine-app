import React, { useContext } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Button, List, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { theme } from '../styles/theme';

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
                                titleStyle={{ color: theme.colors.textTitle, fontWeight: '600', fontSize: 16 }}
                                left={props => <List.Icon {...props} icon={({ color }) => <MaterialIcons name="bookmark" size={24} color={theme.colors.secondary} />} />}
                                right={props => <List.Icon {...props} icon={({ color }) => <MaterialIcons name="chevron-right" size={24} color={theme.colors.textTertiary} />} />}
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default BookmarksScreen;
