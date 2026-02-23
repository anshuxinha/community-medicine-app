import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, List, Divider, Badge } from 'react-native-paper';
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
                            right={props => item.recentlyUpdated ? <Badge {...props} style={[styles.badge, props.style]}>NEW</Badge> : null}
                            onPress={() => {
                                const isFree = item.id === '1' || item.title === 'Man and Medicine';

                                if (item.subsections) {
                                    if (isFree) {
                                        navigation.navigate('SubTopics', { title: item.title, items: item.subsections });
                                    } else {
                                        navigation.navigate('PremiumGuard', { destination: 'SubTopics', subTopicsParams: { title: item.title, items: item.subsections } });
                                    }
                                } else {
                                    const readingParams = {
                                        id: item.id,
                                        title: item.title,
                                        content: item.content || "# No Content\n\nThis topic has no content yet.",
                                        quizzes: item.quizzes
                                    };
                                    if (isFree) {
                                        navigation.navigate('Reading', readingParams);
                                    } else {
                                        navigation.navigate('PremiumGuard', { destination: 'Reading', readingParams });
                                    }
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
    badge: {
        alignSelf: 'center',
        marginRight: 8,
        backgroundColor: '#4CAF50', // Green badge for positive 'updated' reinforcement
        color: 'white',
        fontWeight: 'bold'
    }
});

export default LibraryScreen;
