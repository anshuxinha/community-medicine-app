import React from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { Text, List, Divider, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';

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

    const t = (item?.title || '').toLowerCase();
    if (t.includes('tuberculosis') || t.includes('ntep')) return 'lungs';
    if (t.includes('mental')) return 'brain';
    if (t.includes('blindness') || t.includes('eye')) return 'eye-outline';
    if (t.includes('immunization') || t.includes('vaccin')) return 'needle';
    if (t.includes('family planning') || t.includes('contraceptive')) return 'home-heart';
    if (t.includes('demography') || t.includes('fertility')) return 'account-group-outline';
    if (t.includes('biostatistics') || t.includes('chi-square') || t.includes('sampling')) return 'chart-bell-curve-cumulative';
    if (t.includes('epidemiology') || t.includes('surveillance')) return 'chart-timeline-variant';
    if (t.includes('disaster')) return 'alert-outline';
    if (t.includes('waste')) return 'delete-outline';
    return 'file-document-outline';
};

const SubTopicsScreen = ({ route, navigation }) => {
    const { items } = route.params;
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 28 }]}
                renderItem={({ item }) => (
                    <List.Item
                        title={item.title}
                        titleStyle={styles.itemTitle}
                        description={item.description}
                        descriptionStyle={styles.itemDescription}
                        left={props => (
                            <List.Icon
                                {...props}
                                icon={({ color }) => (
                                    <MaterialCommunityIcons
                                        name={getIconForSubtopic(item)}
                                        size={24}
                                        color={theme.colors.secondary}
                                    />
                                )}
                            />
                        )}
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
