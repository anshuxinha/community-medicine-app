import React, { useContext, useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Linking, Platform, TouchableOpacity } from 'react-native';
import { Text, Card, ProgressBar, Button, Dialog, Portal, Paragraph } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import recentUpdates from '../data/updates.json';
import { AppContext } from '../context/AppContext';
import { MaterialIcons } from '@expo/vector-icons';
import DrawerMenu from '../components/DrawerMenu';
import { scheduleAllNotifications } from '../services/notificationService';
import { auth } from '../config/firebase';

const DashboardScreen = ({ navigation }) => {
    const { readingProgress, currentStreak, studyScore } = useContext(AppContext);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [visible, setVisible] = React.useState(false);
    const [selectedUpdate, setSelectedUpdate] = React.useState(null);

    const showDialog = (update) => {
        setSelectedUpdate(update);
        setVisible(true);
    };

    const hideDialog = () => setVisible(false);

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
                user={auth.currentUser}
            />

            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                {/* ── Top header bar ── */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.iconBtn}>
                        <MaterialIcons name="menu" size={26} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.appName}>STROMA</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconBtn}>
                        <MaterialIcons name="notifications-none" size={26} color="#111827" />
                    </TouchableOpacity>
                </View>

                {/* Greeting */}
                <View style={styles.headerSection}>
                    <Text style={styles.welcomeText}>{getGreeting()},{'\n'}Dr. User</Text>
                    <Text variant="bodyLarge" style={styles.subText}>{getFormattedDate()}</Text>
                </View>

                <Card style={styles.progressCard}>
                    <Card.Title title="Learning Progress" titleStyle={styles.cardTitle} subtitleStyle={{ color: '#111827' }} />
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
                    <Card style={[styles.statCard, { marginLeft: 8 }]}>
                        <Card.Content style={styles.statContent}>
                            <Text variant="displaySmall">⭐</Text>
                            <Text variant="titleLarge" style={styles.statValue}>{studyScore}</Text>
                            <Text variant="labelMedium" style={styles.statLabel}>Study Score</Text>
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
                            <MaterialIcons name="build" size={32} color="#8A2BE2" />
                            <Text variant="labelMedium" style={styles.quickText}>Toolbox</Text>
                        </Card.Content>
                    </Card>
                    <Card style={[styles.quickCard, { marginHorizontal: 8 }]} onPress={() => navigation.navigate('VirtualMuseum')}>
                        <Card.Content style={styles.quickCardContent}>
                            <MaterialIcons name="museum" size={32} color="#8A2BE2" />
                            <Text variant="labelMedium" style={styles.quickText}>Museum</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.quickCard} onPress={() => navigation.navigate('BiostatsAssistant')}>
                        <Card.Content style={styles.quickCardContent}>
                            <MaterialIcons name="insert-chart" size={32} color="#8A2BE2" />
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
                            <Button onPress={() => showDialog(update)} mode="text" compact>
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
                        <Text variant="labelSmall" style={{ marginBottom: 16, color: '#6750a4', fontWeight: 'bold' }}>
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
            </Portal>

        </SafeAreaView>
    );
};

// Step 5: Styling
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FBFCFE',
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
        color: '#111827',
        letterSpacing: 2,
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    headerSection: {
        marginBottom: 24,
        marginTop: 16,
    },
    welcomeText: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 36,
        color: '#111827',
        lineHeight: 40,
    },
    subText: {
        color: '#6B7280',
        marginTop: 8,
    },
    progressCard: {
        marginBottom: 24,
        backgroundColor: '#FFFFFF',
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
    },
    progressBar: {
        height: 12,
        borderRadius: 6,
        marginVertical: 12,
        backgroundColor: '#F3F4F6',
    },
    progressText: {
        textAlign: 'right',
        color: '#4B5563',
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
        color: '#111827',
        marginVertical: 4,
    },
    sectionTitle: {
        fontWeight: 'bold',
        fontSize: 20,
        marginBottom: 16,
        color: '#111827',
    },
    quickAccessRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    quickCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
        color: '#4B5563',
    },
    updateCard: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    dateText: {
        color: '#8A2BE2',
        marginBottom: 6,
        fontWeight: 'bold',
        fontSize: 12,
    },
    updateTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 8,
        color: '#111827',
    },
    updateSummary: {
        color: '#6B7280',
        lineHeight: 22,
    },
});

export default DashboardScreen;
