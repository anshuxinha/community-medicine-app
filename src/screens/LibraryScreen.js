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
                            if (t.includes('arthropod') || t.includes('entomology') || t.includes('insecticide')) return 'bug-outline';
                            if (t.includes('zoonoses')) return 'paw';
                            if (t.includes('demography')) return 'account-group-outline';
                            if (t.includes('environment')) return 'tree-outline';
                            if (t.includes('nutrition')) return 'food-apple-outline';
                            if (t.includes('social')) return 'handshake-outline';
                            if (t.includes('occupational')) return 'briefcase-outline';
                            if (t.includes('genetics')) return 'dna';
                            if (t.includes('mental')) return 'brain';
                            if (t.includes('health information') || t.includes('statistics')) return 'chart-bar';
                            if (t.includes('communication') || t.includes('pedagogy')) return 'bullhorn-outline';
                            if (t.includes('planning')) return 'clipboard-list-outline';
                            if (t.includes('international') || t.includes('sustainable development')) return 'earth';
                            if (t.includes('biostatistics')) return 'chart-bar';
                            if (t.includes('program') || t.includes('programme') || t.includes('mission')) return 'flag-outline';
                            if (t.includes('ayushman')) return 'shield-cross';
                            if (t.includes('specialized target')) return 'target';
                            if (t.includes('targeted care') || t.includes('present health status')) return 'heart-pulse';
                            if (t.includes('administration') || t.includes('organization') || t.includes('community')) return 'hospital-building';
                            if (t.includes('man and medicine') || t.includes('history')) return 'history';
                            if (t.includes('obstetrics') || t.includes('paediatrics') || t.includes('geriatrics') || t.includes('maternity') || t.includes('child health')) return 'human-male-female-child';
                            if (t.includes('tribal')) return 'tent';
                            if (t.includes('waste management') || t.includes('sanitation')) return 'trash-can-outline';
                            if (t.includes('disaster')) return 'alert-octagon-outline';
                            if (t.includes('essential medicines') || t.includes('counterfeit')) return 'pill';
                            if (t.includes('management')) return 'briefcase-check-outline';
                            if (t.includes('family')) return 'home-heart';
                            if (t.includes('economics')) return 'currency-inr';
                            if (t.includes('communicable')) return 'virus-outline';
                            if (t.includes('non-communicable')) return 'heart-broken';
                            if (t.includes('immunization')) return 'needle';
                            if (t.includes('disinfection')) return 'spray-bottle';
                            if (t.includes('water')) return 'water-outline';
                            if (t.includes('bacteriology') || t.includes('staining') || t.includes('microscopy')) return 'microscope';
                            if (t.includes('ayush')) return 'leaf';
                            if (t.includes('adolescent')) return 'human-child';
                            if (t.includes('idsp') || t.includes('surveillance')) return 'radar';
                            if (t.includes('imnci') || t.includes('neonatal')) return 'baby-bottle-outline';
                            if (t.includes('rehabilitation')) return 'wheelchair-accessibility';
                            if (t.includes('swine flu') || t.includes('influenza')) return 'pig';
                            if (t.includes('exercises') || t.includes('problems')) return 'clipboard-text-outline';
                            if (t.includes('field visits')) return 'map-marker-radius-outline';
                            if (t.includes('appendix') || t.includes('legislation') || t.includes('days')) return 'scale-balance';
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
