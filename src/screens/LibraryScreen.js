import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, List, Divider, Searchbar, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theoryTopics from '../data/mockData.json';
import practicalTopics from '../data/practical.json';

const LibraryScreen = (props) => {
    const { navigation } = props;
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('theory');

    const currentTopics = activeSection === 'theory' ? theoryTopics : practicalTopics;
    const filteredTopics = currentTopics.filter(topic =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (topic.content && topic.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.searchBarContainer}>
                    <Searchbar
                        placeholder="Search topics..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchBar}
                        inputStyle={styles.searchBarInput}
                        iconColor="#9CA3AF"
                    />
                </View>

                {searchQuery.length === 0 && (
                    <Text style={styles.header}>Library</Text>
                )}

                <View style={styles.segmentedButtonsContainer}>
                    <SegmentedButtons
                        value={activeSection}
                        onValueChange={setActiveSection}
                        buttons={[
                            {
                                value: 'theory',
                                label: 'Theory',
                                icon: 'book-open-page-variant',
                            },
                            {
                                value: 'practical',
                                label: 'Practical',
                                icon: 'stethoscope',
                            },
                        ]}
                    />
                </View>

                <FlatList
                    data={filteredTopics}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => {
                        // Map specific icons to specific topics for better relevance
                        const getIconForTopic = (title) => {
                            const t = title.toLowerCase();
                            if (t.includes('concept of health')) return 'leaf';
                            if (t.includes('epidemiology')) return 'chart-line-variant';
                            if (t.includes('screening')) return 'magnify-scan';
                            if (t.includes('respiratory')) return 'lungs';
                            if (t.includes('intestinal')) return 'stomach';
                            if (t.includes('arthropod')) return 'bug-outline';
                            if (t.includes('zoonoses')) return 'paw';
                            if (t.includes('demography')) return 'account-group-outline';
                            if (t.includes('environment')) return 'tree-outline';
                            if (t.includes('nutrition')) return 'food-apple-outline';
                            if (t.includes('social')) return 'handshake-outline';
                            if (t.includes('occupational')) return 'briefcase-outline';
                            if (t.includes('genetics')) return 'dna';
                            if (t.includes('mental')) return 'brain';
                            if (t.includes('health information')) return 'poll';
                            if (t.includes('communication')) return 'bullhorn-outline';
                            if (t.includes('planning')) return 'clipboard-list-outline';
                            if (t.includes('international')) return 'earth';
                            if (t.includes('biostatistics')) return 'chart-bar';
                            if (t.includes('program') || t.includes('programme')) return 'flag-outline';
                            if (t.includes('ayushman')) return 'shield-cross';
                            if (t.includes('specialized target')) return 'target';
                            if (t.includes('targeted care')) return 'heart-pulse';
                            if (t.includes('administration') || t.includes('organization')) return 'hospital-building';
                            if (t.includes('man and medicine')) return 'history';
                            return 'book-open-outline'; // Default fallback
                        };

                        const iconName = getIconForTopic(item.title);
                        return (
                            <List.Item
                                title={item.title}
                                titleStyle={styles.listItemTitle}
                                left={props => <List.Icon {...props} icon={({ color }) => <MaterialCommunityIcons name={iconName} size={24} color="#6B7280" />} />}
                                right={props => <MaterialCommunityIcons name="chevron-right" size={24} color="#D1D5DB" style={{ alignSelf: 'center', marginRight: 8 }} />}
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
                                style={styles.listItem}
                            />
                        );
                    }}
                    ItemSeparatorComponent={() => <Divider style={styles.divider} />}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    searchBarContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    searchBar: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        elevation: 0,
        height: 48,
        marginBottom: 8,
    },
    searchBarInput: {
        fontSize: 16,
        color: '#111827',
        minHeight: 48,
        alignSelf: 'center',
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000000',
        paddingHorizontal: 16,
        marginVertical: 12,
    },
    segmentedButtonsContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    listItem: {
        paddingVertical: 8,
    },
    listItemTitle: {
        fontSize: 16,
        color: '#111827',
        alignSelf: 'flex-start',
    },
    divider: {
        backgroundColor: '#E5E7EB',
        height: 1,
        marginLeft: 64, // To align with the text, leaving icon area blank
    }
});

export default LibraryScreen;
