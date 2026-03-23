import React, { useContext, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, List, Divider, Searchbar, SegmentedButtons, Badge, Menu } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theoryTopics from '../data/mockData.json';
import practicalTopics from '../data/practical.json';
import { AppContext } from '../context/AppContext';
import {
    getContentKey,
    getContentSignature,
    getItemStatus,
    getLeafContentRefsForItem,
    getUpdatedSegmentsForItem,
} from '../utils/contentRegistry';
import { theme } from '../styles/theme';

const SECTION_ID_ICON_MAP = {
    'theory:27': 'clipboard-text-search-outline',
    'practical:29': 'clipboard-text-search-outline',
    'practical:30': 'map-marker-path',
    'practical:31': 'calendar-heart',
};

const StatusMark = ({ status }) => {
    if (status === 'updated') {
        return <Badge style={styles.newBadge}>NEW</Badge>;
    }

    if (status === 'read') {
        return (
            <View style={styles.readTickWrap}>
                <MaterialCommunityIcons name="check" size={14} color={theme.colors.primaryDark} />
            </View>
        );
    }

    return <MaterialCommunityIcons name="chevron-right" size={24} color="#D1D5DB" />;
};

const buildReadingParams = (item, section, status) => ({
    id: item.id,
    title: item.title,
    content: item.content || '# No Content\n\nThis topic has no content yet.',
    quizzes: item.quizzes,
    section,
    contentKey: getContentKey(section, item.id),
    contentSignature: getContentSignature(item),
    updatedSegments: getUpdatedSegmentsForItem(item),
    showUpdateHighlights: status === 'updated',
});

const LibraryScreen = (props) => {
    const { navigation } = props;
    const { readItemVersions, markAsUnread } = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('theory');
    const [openMenuKey, setOpenMenuKey] = useState(null);
    const insets = useSafeAreaInsets();

    const currentTopics = activeSection === 'theory' ? theoryTopics : practicalTopics;
    const filteredTopics = currentTopics.filter((topic) =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase())
        || (topic.content && topic.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getMenuKey = (item) => `${activeSection}:${item.id}`;

    const closeMenu = () => setOpenMenuKey(null);

    const openItem = (item, itemStatus) => {
        const isFree = item.id === '1' || item.title === 'Man and Medicine';

        if (item.subsections) {
            const subTopicsParams = {
                title: item.title,
                items: item.subsections,
                section: activeSection,
            };

            if (isFree) {
                navigation.navigate('SubTopics', subTopicsParams);
            } else {
                navigation.navigate('PremiumGuard', { destination: 'SubTopics', subTopicsParams });
            }
            return;
        }

        const readingParams = buildReadingParams(item, activeSection, itemStatus);
        if (isFree) {
            navigation.navigate('Reading', readingParams);
        } else {
            navigation.navigate('PremiumGuard', { destination: 'Reading', readingParams });
        }
    };

    const handleMarkUnread = (item) => {
        markAsUnread(getLeafContentRefsForItem(item, activeSection));
        closeMenu();
    };

    const getIconForTopic = (section, id, title) => {
        const idMapped = SECTION_ID_ICON_MAP[`${section}:${id}`];
        if (idMapped) return idMapped;

        const loweredTitle = title.toLowerCase();
        if (loweredTitle.includes('concept of health')) return 'leaf';
        if (loweredTitle.includes('epidemiology')) return 'chart-line-variant';
        if (loweredTitle.includes('screening')) return 'magnify-scan';
        if (loweredTitle.includes('respiratory')) return 'lungs';
        if (loweredTitle.includes('intestinal')) return 'stomach';
        if (loweredTitle.includes('arthropod') || loweredTitle.includes('entomology') || loweredTitle.includes('insecticide')) return 'bug-outline';
        if (loweredTitle.includes('zoonoses')) return 'paw';
        if (loweredTitle.includes('demography')) return 'account-group-outline';
        if (loweredTitle.includes('environment')) return 'tree-outline';
        if (loweredTitle.includes('nutrition')) return 'food-apple-outline';
        if (loweredTitle.includes('social')) return 'handshake-outline';
        if (loweredTitle.includes('occupational')) return 'briefcase-outline';
        if (loweredTitle.includes('genetics')) return 'dna';
        if (loweredTitle.includes('mental')) return 'brain';
        if (loweredTitle.includes('health information') || loweredTitle.includes('statistics')) return 'chart-bar';
        if (loweredTitle.includes('communication') || loweredTitle.includes('pedagogy')) return 'bullhorn-outline';
        if (loweredTitle.includes('planning')) return 'clipboard-list-outline';
        if (loweredTitle.includes('international') || loweredTitle.includes('sustainable development')) return 'earth';
        if (loweredTitle.includes('biostatistics')) return 'chart-bar';
        if (loweredTitle.includes('health program') || loweredTitle.includes('programmes') || loweredTitle.includes('programme') || loweredTitle.includes('mission')) return 'flag-outline';
        if (loweredTitle.includes('ayushman') || loweredTitle.includes('health care delivery') || loweredTitle.includes('delivery system')) return 'shield-cross';
        if (loweredTitle.includes('specialized target')) return 'target';
        if (loweredTitle.includes('targeted care') || loweredTitle.includes('present health status')) return 'heart-pulse';
        if (loweredTitle.includes('administration') || loweredTitle.includes('organization') || loweredTitle.includes('community')) return 'hospital-building';
        if (loweredTitle.includes('man and medicine') || loweredTitle.includes('history')) return 'history';
        if (loweredTitle.includes('obstetrics') || loweredTitle.includes('paediatrics') || loweredTitle.includes('geriatrics') || loweredTitle.includes('maternity') || loweredTitle.includes('child health')) return 'human-male-female-child';
        if (loweredTitle.includes('tribal')) return 'tent';
        if (loweredTitle.includes('waste management') || loweredTitle.includes('sanitation')) return 'trash-can-outline';
        if (loweredTitle.includes('disaster')) return 'alert-octagon-outline';
        if (loweredTitle.includes('essential medicines') || loweredTitle.includes('counterfeit')) return 'pill';
        if (loweredTitle.includes('management')) return 'briefcase-check-outline';
        if (loweredTitle.includes('family') || loweredTitle.includes('rmncah')) return 'home-heart';
        if (loweredTitle.includes('economics')) return 'currency-inr';
        if (loweredTitle.includes('non-communicable') || loweredTitle.includes('non communicable') || loweredTitle.includes('ncd')) return 'heart-broken';
        if (loweredTitle.includes('communicable')) return 'virus-outline';
        if (loweredTitle.includes('immunization') || loweredTitle.includes('vaccin')) return 'needle';
        if (loweredTitle.includes('disinfection')) return 'spray-bottle';
        if (loweredTitle.includes('water')) return 'water-outline';
        if (loweredTitle.includes('bacteriology') || loweredTitle.includes('staining') || loweredTitle.includes('microscopy')) return 'microscope';
        if (loweredTitle.includes('ayush')) return 'leaf';
        if (loweredTitle.includes('adolescent')) return 'human-child';
        if (loweredTitle.includes('idsp') || loweredTitle.includes('surveillance') || loweredTitle.includes('ncvbdc')) return 'radar';
        if (loweredTitle.includes('imnci') || loweredTitle.includes('neonatal')) return 'baby-bottle-outline';
        if (loweredTitle.includes('rehabilitation')) return 'wheelchair-accessibility';
        if (loweredTitle.includes('swine flu') || loweredTitle.includes('influenza')) return 'pig';
        if (loweredTitle.includes('aids') || loweredTitle.includes('std') || loweredTitle.includes('nacp')) return 'ribbon';
        if (loweredTitle.includes('leprosy') || loweredTitle.includes('nlep')) return 'human-handsup';
        if (loweredTitle.includes('tuberculosis') || loweredTitle.includes('ntep')) return 'lungs';
        if (loweredTitle.includes('blindness') || loweredTitle.includes('npcbvi')) return 'eye-off-outline';
        if (loweredTitle.includes('mental health') || loweredTitle.includes('nmhp')) return 'brain';
        if (loweredTitle.includes('exercises') || loweredTitle.includes('problems')) return 'clipboard-text-outline';
        if (loweredTitle.includes('field visits')) return 'map-marker-radius-outline';
        if (loweredTitle.includes('appendix') || loweredTitle.includes('legislation') || loweredTitle.includes('days')) return 'scale-balance';
        return 'book-open-outline';
    };

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
                    style={styles.list}
                    renderItem={({ item }) => {
                        const itemStatus = getItemStatus(item, activeSection, readItemVersions);
                        const iconName = getIconForTopic(activeSection, item.id, item.title);
                        const menuKey = getMenuKey(item);
                        return (
                            <List.Item
                                title={item.title}
                                titleNumberOfLines={3}
                                titleStyle={styles.listItemTitle}
                                left={(leftProps) => (
                                    <List.Icon
                                        {...leftProps}
                                        icon={() => (
                                            <MaterialCommunityIcons name={iconName} size={24} color="#6B7280" />
                                        )}
                                    />
                                )}
                                right={() => (
                                    <Menu
                                        visible={openMenuKey === menuKey}
                                        onDismiss={closeMenu}
                                        anchor={(
                                            <TouchableOpacity
                                                style={styles.rightSlot}
                                                activeOpacity={0.7}
                                                onPress={() => setOpenMenuKey(menuKey)}
                                            >
                                                <StatusMark status={itemStatus} />
                                            </TouchableOpacity>
                                        )}
                                    >
                                        <Menu.Item
                                            title={itemStatus === 'updated' ? 'Open updated topic' : 'Open topic'}
                                            onPress={() => {
                                                closeMenu();
                                                openItem(item, itemStatus);
                                            }}
                                        />
                                        {itemStatus === 'read' ? (
                                            <Menu.Item
                                                title="Mark as unread"
                                                onPress={() => handleMarkUnread(item)}
                                            />
                                        ) : null}
                                    </Menu>
                                )}
                                onPress={() => openItem(item, itemStatus)}
                                style={styles.listItem}
                            />
                        );
                    }}
                    ItemSeparatorComponent={() => <Divider style={styles.divider} />}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 88 }]}
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
    list: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 24,
    },
    listItem: {
        paddingVertical: 8,
    },
    listItemTitle: {
        fontSize: 16,
        lineHeight: 24,
        color: '#111827',
        fontWeight: '500',
        paddingRight: 12,
    },
    rightSlot: {
        minWidth: 56,
        alignItems: 'flex-end',
        justifyContent: 'center',
        alignSelf: 'center',
        marginRight: 8,
        paddingVertical: 6,
    },
    readTickWrap: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primaryLight,
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    newBadge: {
        backgroundColor: theme.colors.warning,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    divider: {
        backgroundColor: '#E5E7EB',
        height: 1,
        marginLeft: 64,
    },
});

export default LibraryScreen;
