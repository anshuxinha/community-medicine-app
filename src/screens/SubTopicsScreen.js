import React, { useContext, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, List, Divider, Badge, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { AppContext } from '../context/AppContext';
import { useFocusedScreenCaptureProtection } from './useFocusedScreenCaptureProtection';
import {
    getContentKey,
    getContentSignature,
    getItemStatus,
    getLeafContentRefsForItem,
    getUpdatedSegmentsForItem,
} from '../utils/contentRegistry';

const TOPIC_ID_ICON_MAP = {
    '27-1': 'chart-line-variant',
    '27-2': 'file-document-edit-outline',
    '27-3': 'hospital-building',
    '27-4': 'clipboard-check-outline',
    '27-5': 'calendar-check-outline',
    '27-6': 'monitor-dashboard',
    '27-7': 'hospital-box-outline',
    '27-8': 'radar',
    '27-9': 'alert-outline',
    '27-10': 'biohazard',
    '27-11': 'scale-balance',
    '27-12': 'earth',
};

const getIconForSubtopic = (item) => {
    const mapped = TOPIC_ID_ICON_MAP[item?.id];
    if (mapped) return mapped;

    const loweredTitle = (item?.title || '').toLowerCase();
    if (loweredTitle.includes('tuberculosis') || loweredTitle.includes('ntep')) return 'lungs';
    if (loweredTitle.includes('mental')) return 'brain';
    if (loweredTitle.includes('blindness') || loweredTitle.includes('eye')) return 'eye-outline';
    if (loweredTitle.includes('immunization') || loweredTitle.includes('vaccin')) return 'needle';
    if (loweredTitle.includes('family planning') || loweredTitle.includes('contraceptive')) return 'home-heart';
    if (loweredTitle.includes('demography') || loweredTitle.includes('fertility')) return 'account-group-outline';
    if (loweredTitle.includes('biostatistics') || loweredTitle.includes('chi-square') || loweredTitle.includes('sampling')) return 'chart-bell-curve-cumulative';
    if (loweredTitle.includes('epidemiology') || loweredTitle.includes('surveillance')) return 'chart-timeline-variant';
    if (loweredTitle.includes('disaster')) return 'alert-outline';
    if (loweredTitle.includes('waste')) return 'delete-outline';
    return 'file-document-outline';
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

    return <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textTertiary} />;
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

const SubTopicsScreen = ({ route, navigation }) => {
    const { items, section = 'theory' } = route.params;
    useFocusedScreenCaptureProtection('library-subtopics-screen');
    const { readItemVersions, markAsUnread } = useContext(AppContext);
    const [openMenuKey, setOpenMenuKey] = useState(null);
    const insets = useSafeAreaInsets();

    const getMenuKey = (item) => `${section}:${item.id}`;

    const closeMenu = () => setOpenMenuKey(null);

    const openItem = (item, itemStatus) => {
        if (item.subsections) {
            navigation.push('PremiumGuard', {
                destination: 'SubTopics',
                subTopicsParams: {
                    title: item.title,
                    items: item.subsections,
                    section,
                },
            });
            return;
        }

        navigation.navigate('PremiumGuard', {
            destination: 'Reading',
            readingParams: buildReadingParams(item, section, itemStatus),
        });
    };

    const handleMarkUnread = (item) => {
        markAsUnread(getLeafContentRefsForItem(item, section));
        closeMenu();
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 28 }]}
                renderItem={({ item }) => {
                    const itemStatus = getItemStatus(item, section, readItemVersions);
                    const menuKey = getMenuKey(item);
                    return (
                        <List.Item
                            title={item.title}
                            titleNumberOfLines={3}
                            titleStyle={styles.itemTitle}
                            description={item.description}
                            descriptionStyle={styles.itemDescription}
                            left={(leftProps) => (
                                <List.Icon
                                    {...leftProps}
                                    icon={() => (
                                        <MaterialCommunityIcons
                                            name={getIconForSubtopic(item)}
                                            size={24}
                                            color={theme.colors.secondary}
                                        />
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
                        />
                    );
                }}
                ItemSeparatorComponent={Divider}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surfacePrimary,
    },
    listContent: {
        paddingBottom: 16,
    },
    itemTitle: {
        color: theme.colors.textTitle,
        fontWeight: '600',
        fontSize: 15,
        lineHeight: 22,
        paddingRight: 12,
    },
    itemDescription: {
        color: theme.colors.textSecondary,
        fontSize: 13,
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
});

export default SubTopicsScreen;
