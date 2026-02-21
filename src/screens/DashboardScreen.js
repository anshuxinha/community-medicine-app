import React, { useContext } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Card, ProgressBar, Button, Dialog, Portal, Paragraph } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import recentUpdates from '../data/updates.json';
import { AppContext } from '../context/AppContext';

const DashboardScreen = () => {
    const { readingProgress, currentStreak, studyScore } = useContext(AppContext);

    const [visible, setVisible] = React.useState(false);
    const [selectedUpdate, setSelectedUpdate] = React.useState(null);

    const showDialog = (update) => {
        setSelectedUpdate(update);
        setVisible(true);
    };

    const hideDialog = () => setVisible(false);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                {/* Step 3: UI Layout - Progress Section */}
                <View style={styles.headerSection}>
                    <Text variant="headlineMedium" style={styles.welcomeText}>Welcome back, Dr. User!</Text>
                    <Text variant="bodyLarge" style={styles.subText}>Here is your learning overview.</Text>
                </View>

                <Card style={styles.progressCard}>
                    <Card.Title title="Reading Progress" titleStyle={styles.cardTitle} />
                    <Card.Content>
                        <ProgressBar
                            progress={readingProgress}
                            color="#6200ee"
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
                            <Text variant="labelMedium">Day Streak</Text>
                        </Card.Content>
                    </Card>
                    <Card style={[styles.statCard, { marginLeft: 8 }]}>
                        <Card.Content style={styles.statContent}>
                            <Text variant="displaySmall">⭐</Text>
                            <Text variant="titleLarge" style={styles.statValue}>{studyScore}</Text>
                            <Text variant="labelMedium">Study Score</Text>
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
                        <Paragraph>{selectedUpdate?.summary}</Paragraph>
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
        backgroundColor: '#f5f7fa',
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    headerSection: {
        marginBottom: 20,
        marginTop: 8,
    },
    welcomeText: {
        fontWeight: 'bold',
        color: '#1c1b1f',
    },
    subText: {
        color: '#49454f',
        marginTop: 4,
    },
    progressCard: {
        marginBottom: 24,
        backgroundColor: '#ffffff',
        elevation: 2,
    },
    cardTitle: {
        fontWeight: 'bold',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        marginVertical: 12,
        backgroundColor: '#e6e0e9',
    },
    progressText: {
        textAlign: 'right',
        color: '#49454f',
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        elevation: 2,
    },
    statContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    statValue: {
        fontWeight: 'bold',
        color: '#1c1b1f',
        marginVertical: 4,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1c1b1f',
    },
    updateCard: {
        marginBottom: 16,
        backgroundColor: '#ffffff',
        elevation: 1,
    },
    dateText: {
        color: '#6750a4',
        marginBottom: 6,
        fontWeight: 'bold',
    },
    updateTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1c1b1f',
    },
    updateSummary: {
        color: '#49454f',
        lineHeight: 20,
    },
});

export default DashboardScreen;
