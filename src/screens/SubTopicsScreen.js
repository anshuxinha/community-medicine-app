import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, List, Divider, Badge } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const SubTopicsScreen = ({ route, navigation }) => {
    const { title, items } = route.params;

    return (
        <View style={styles.container}>
            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <List.Item
                        title={item.title}
                        titleStyle={styles.itemTitle}
                        description={item.description}
                        descriptionStyle={styles.itemDescription}
                        left={props => <List.Icon {...props} icon={({ color }) => <MaterialIcons name="description" size={24} color={theme.colors.secondary} />} />}
                        right={props => item.recentlyUpdated ? <Badge {...props} style={[styles.badge, props.style]}>NEW</Badge> : null}
                        onPress={() => {
                            if (item.subsections) {
                                navigation.push('PremiumGuard', { destination: 'SubTopics', subTopicsParams: { title: item.title, items: item.subsections } });
                            } else {
                                navigation.navigate('PremiumGuard', {
                                    destination: 'Reading',
                                    readingParams: {
                                        id: item.id,
                                        title: item.title,
                                        content: item.content || "# No Content\n\nThis topic has no content yet.",
                                        quizzes: item.quizzes
                                    }
                                });
                            }
                        }}
                    />
                )}
                ItemSeparatorComponent={Divider}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surfacePrimary,
    },
    itemTitle: {
        color: theme.colors.textTitle,
        fontWeight: '600',
        fontSize: 15,
    },
    itemDescription: {
        color: theme.colors.textSecondary,
        fontSize: 13,
    },
    badge: {
        alignSelf: 'center',
        marginRight: 8,
        backgroundColor: theme.colors.success,
        color: 'white',
        fontWeight: 'bold'
    }
});

export default SubTopicsScreen;
