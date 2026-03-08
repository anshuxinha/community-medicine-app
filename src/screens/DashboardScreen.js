import React, { useContext, useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Linking, Platform, TouchableOpacity } from 'react-native';
import { Text, Card, ProgressBar, Button, Dialog, Portal, Paragraph } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import recentUpdates from '../data/updates.json';
import publicHealthDays from '../data/publicHealthDays.json';
import { AppContext } from '../context/AppContext';
import { MaterialIcons } from '@expo/vector-icons';
import DrawerMenu from '../components/DrawerMenu';
import { scheduleAllNotifications } from '../services/notificationService';
import { auth } from '../config/firebase';
import { theme } from '../styles/theme';

const DashboardScreen = ({ navigation }) => {
    const { readingProgress, currentStreak, studyScore, user } = useContext(AppContext);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [visible, setVisible] = React.useState(false);
    const [healthDaysVisible, setHealthDaysVisible] = useState(false);

    const getNextHealthDay = () => {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();

        const sortedDays = [...publicHealthDays].sort((a, b) => {
            if (a.month === b.month) return a.day - b.day;
            return a.month - b.month;
        });

        const nextDay = sortedDays.find(
            day => day.month > currentMonth || (day.month === currentMonth && day.day >= currentDay)
        );

        return nextDay || sortedDays[0];
    };
    const nextHealthDay = getNextHealthDay();
    const [selectedUpdate, setSelectedUpdate] = React.useState(null);

    const showDialog = (update) => {
        setSelectedUpdate(update);
        setVisible(true);
    };

    const hideDialog = () => setVisible(false);

    const normalizeHealthDayDescription = (text) => (text || '').replace(/\s+/g, ' ').trim();

    useEffect(() => {
        scheduleAllNotifications();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const getFormattedDate = () => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date().toLocaleDateString(undefined, options);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Animated side drawer */}
            <DrawerMenu
                visible={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                user={user}
            />

            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                {/* ── Top header bar ── */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.iconBtn}>
                        <MaterialIcons name="menu" size={26} color={theme.colors.textTitle} />
                    </TouchableOpacity>
                    <Text style={styles.appName}>STROMA</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconBtn}>
                        <MaterialIcons name="notifications-none" size={26} color={theme.colors.textTitle} />
                    </TouchableOpacity>
                </View>

                {/* Greeting */}
                <View style={styles.headerSection}>
                    <Text style={styles.welcomeText}>{getGreeting()},{`\n`}{user?.username || auth.currentUser?.displayName || 'Dr. User'}</Text>
                    <Text variant="bodyLarge" style={styles.subText}>{getFormattedDate()}</Text>
                </View>

                <Card style={styles.progressCard}>
                    <Card.Title title="Learning Progress" titleStyle={styles.cardTitle} subtitleStyle={{ color: theme.colors.textTitle }} />
                    <Card.Content>
                        <ProgressBar
                            progress={readingProgress}
                            color="#A855F7" // Soft purple
                            style={styles.progressBar}
                        />
                        <Text variant="bodyMedium" style={styles.progressText}>
                            {`${Math.round(readingProgress * 100)}% Completed`}
                        </Text>
                    </Card.Content>
                </Card>

                <View style={styles.statsRow}>
                    <Card style={[styles.statCard, { marginRight: 8 }]}>
                        <Card.Content style={styles.statContent}>
                            <Text variant="displaySmall">🔥</Text>
                            <Text variant="titleLarge" style={styles.statValue}>{currentStreak}</Text>
                            <Text variant="labelMedium" style={styles.statLabel}>Day Streak</Text>
                        </Card.Content>
                    </Card>
                    <Card style={[styles.statCard, { marginLeft: 8 }]} onPress={() => setHealthDaysVisible(true)}>
                        <Card.Content style={[styles.statContent, { paddingHorizontal: 4 }]}>
                            <Text variant="displaySmall" style={{ marginBottom: 4 }}>📅</Text>
                            <Text variant="titleMedium" style={[styles.statValue, { fontSize: 15, textAlign: 'center', lineHeight: 18 }]} numberOfLines={2}>{nextHealthDay.name}</Text>
                            <Text variant="labelSmall" style={[styles.statLabel, { marginTop: 4, color: theme.colors.secondary }]}>{nextHealthDay.dateLabel}</Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Step 3.5: UI Layout - Quick Access Modules */}
                <Text variant="titleLarge" style={styles.sectionTitle}>
                    Quick Access
                </Text>
                <View style={styles.quickAccessRow}>
                    <Card style={styles.quickCard} onPress={() => navigation.navigate('FieldToolbox')}>
                        <Card.Content style={styles.quickCardContent}>
                            <MaterialIcons name="build" size={32} color={theme.colors.secondary} />
                            <Text variant="labelMedium" style={styles.quickText}>Toolbox</Text>
                        </Card.Content>
                    </Card>
                    <Card style={[styles.quickCard, { marginHorizontal: 8 }]} onPress={() => navigation.navigate('VirtualMuseum')}>
                        <Card.Content style={styles.quickCardContent}>
                            <MaterialIcons name="museum" size={32} color={theme.colors.secondary} />
                            <Text variant="labelMedium" style={styles.quickText}>Museum</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.quickCard} onPress={() => navigation.navigate('BiostatsAssistant')}>
                        <Card.Content style={styles.quickCardContent}>
                            <MaterialIcons name="insert-chart" size={32} color={theme.colors.secondary} />
                            <Text variant="labelMedium" style={styles.quickText}>Biostats</Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Step 4: UI Layout - Updates Feed */}
                <Text variant="titleLarge" style={styles.sectionTitle}>
                    Latest Guidelines and Updates
                </Text>

                {recentUpdates.map((update) => (
                    <Card key={update.id} style={styles.updateCard}>
                        <Card.Content>
                            <Text variant="labelSmall" style={styles.dateText}>{update.date}</Text>
                            <Text variant="titleMedium" style={styles.updateTitle}>{update.title}</Text>
                            <Text variant="bodyMedium" style={styles.updateSummary}>
                                {update.summary.length > 100 ? `${update.summary.substring(0, 100)}...` : update.summary}
                            </Text>
                        </Card.Content>
                        <Card.Actions>
                            <Button textColor={theme.colors.secondary} onPress={() => showDialog(update)} mode="text" compact>
                                Read More
                            </Button>
                        </Card.Actions>
                    </Card>
                ))}
            </ScrollView>

            <Portal>
                <Dialog visible={visible} onDismiss={hideDialog}>
                    <Dialog.Title>{selectedUpdate?.title}</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="labelSmall" style={{ marginBottom: 16, color: theme.colors.primary, fontWeight: 'bold' }}>
                            {selectedUpdate?.date}
                        </Text>
                        <Paragraph style={{ lineHeight: 22 }}>{selectedUpdate?.summary}</Paragraph>
                        {selectedUpdate?.link && (
                            <Button
                                mode="text"
                                onPress={() => Linking.openURL(selectedUpdate.link)}
                                style={{ marginTop: 16, alignSelf: 'flex-start', marginLeft: -8 }}
                                icon="open-in-new"
                            >
                                Source Article
                            </Button>
                        )}
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideDialog}>Close</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog
                    visible={healthDaysVisible}
                    onDismiss={() => setHealthDaysVisible(false)}
                    style={{ maxHeight: '82%', backgroundColor: theme.colors.surfacePrimary, borderRadius: 16 }}
                >
                    <Dialog.Title style={{ color: theme.colors.textTitle, fontWeight: 'bold' }}>Public Health Days</Dialog.Title>
                    <Dialog.ScrollArea style={{ paddingHorizontal: 0, borderColor: 'transparent' }}>
                        <ScrollView contentContainerStyle={styles.healthDaysListContent}>
                            {publicHealthDays.map((day, index) => (
                                <View key={index} style={styles.healthDayItem}>
                                    <View style={styles.healthDayRow}>
                                        <View style={styles.healthDayTextColumn}>
                                            <Text style={styles.healthDayName}>{day.name}</Text>
                                            <Text style={styles.healthDayDescription}>{normalizeHealthDayDescription(day.description)}</Text>
                                        </View>
                                        <Text style={styles.healthDayDate}>{day.dateLabel}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setHealthDaysVisible(false)}>Close</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

        </SafeAreaView>
    );
};

// Step 5: Styling
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.backgroundMain,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
        paddingBottom: 32,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingTop: 4,
    },
    appName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.textTitle,
        letterSpacing: 2,
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: theme.colors.surfaceSecondary,
    },
    headerSection: {
        marginBottom: 24,
        marginTop: 16,
    },
    welcomeText: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 36,
        color: theme.colors.textTitle,
        lineHeight: 40,
    },
    subText: {
        color: theme.colors.textTertiary,
        marginTop: 8,
    },
    progressCard: {
        marginBottom: 24,
        backgroundColor: theme.colors.surfacePrimary,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: theme.colors.textTitle,
    },
    progressBar: {
        height: 12,
        borderRadius: 6,
        marginVertical: 12,
        backgroundColor: theme.colors.surfaceSecondary,
    },
    progressText: {
        textAlign: 'right',
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.colors.surfacePrimary,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    statLabel: {
        color: '#374151',
        fontWeight: '600',
    },
    statContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    statValue: {
        fontWeight: 'bold',
        fontSize: 24,
        color: theme.colors.textTitle,
        marginVertical: 4,
    },
    sectionTitle: {
        fontWeight: 'bold',
        fontSize: 20,
        marginBottom: 16,
        color: theme.colors.textTitle,
    },
    quickAccessRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    quickCard: {
        flex: 1,
        backgroundColor: theme.colors.surfacePrimary,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    quickCardContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    quickText: {
        marginTop: 8,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
    },
    updateCard: {
        marginBottom: 16,
        backgroundColor: theme.colors.surfacePrimary,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    dateText: {
        color: theme.colors.secondary,
        marginBottom: 6,
        fontWeight: 'bold',
        fontSize: 12,
    },
    updateTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 8,
        color: theme.colors.textTitle,
    },
    updateSummary: {
        color: theme.colors.textTertiary,
        lineHeight: 22,
    },
    healthDaysListContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    healthDayItem: {
        marginBottom: 10,
    },
    healthDayRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    healthDayTextColumn: {
        flex: 1,
        marginRight: 12,
    },
    healthDayName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textTitle,
        lineHeight: 22,
        marginBottom: 0,
        includeFontPadding: false,
    },
    healthDayDate: {
        marginTop: 1,
        color: theme.colors.secondary,
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
        includeFontPadding: false,
    },
    healthDayDescription: {
        marginTop: 6,
        color: theme.colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        includeFontPadding: false,
    },
});

export default DashboardScreen;
