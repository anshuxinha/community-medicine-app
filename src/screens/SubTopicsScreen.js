import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, List, Divider } from 'react-native-paper';

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
                        description={item.description}
                        left={props => <List.Icon {...props} icon="file-document-outline" />}
                        onPress={() => {
                            if (item.subsections) {
                                navigation.push('SubTopics', { title: item.title, items: item.subsections });
                            } else {
                                navigation.navigate('Reading', {
                                    title: item.title,
                                    content: item.content || "# No Content\n\nThis topic has no content yet."
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
        backgroundColor: '#ffffff',
    },
});

export default SubTopicsScreen;
