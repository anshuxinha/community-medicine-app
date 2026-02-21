import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, List, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import mockTopics from '../data/mockData.json';

const LibraryScreen = (props) => {
    const { navigation } = props;
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text variant="headlineMedium" style={styles.header}>Library</Text>
                <FlatList
                    data={mockTopics}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <List.Item
                            title={item.title}
                            description={item.description}
                            left={props => <List.Icon {...props} icon={({ color }) => <MaterialIcons name="book" size={24} color={color} />} />}
                            onPress={() => {
                                if (item.subsections) {
                                    navigation.navigate('SubTopics', { title: item.title, items: item.subsections });
                                } else {
                                    navigation.navigate('Reading', {
                                        id: item.id,
                                        title: item.title,
                                        content: item.content || "# No Content\n\nThis topic has no content yet.",
                                        quizzes: item.quizzes
                                    });
                                }
                            }}
                        />
                    )}
                    ItemSeparatorComponent={Divider}
                />
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
    },
});

export default LibraryScreen;
