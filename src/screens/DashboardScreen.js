import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Card, ProgressBar, Button } from 'react-native-paper';
import recentUpdates from '../data/updates.json';

const DashboardScreen = () => {
    // Step 2: Mock State
    const [readingProgress] = useState(0.45);

    return (
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

            {/* Step 4: UI Layout - Updates Feed */}
            <Text variant="titleLarge" style={styles.sectionTitle}>
                Latest Guidelines and Updates
            </Text>

            {recentUpdates.map((update) => (
                <Card key={update.id} style={styles.updateCard}>
                    <Card.Content>
                        <Text variant="labelSmall" style={styles.dateText}>{update.date}</Text>
                        <Text variant="titleMedium" style={styles.updateTitle}>{update.title}</Text>
                        <Text variant="bodyMedium" style={styles.updateSummary}>{update.summary}</Text>
                    </Card.Content>
                    <Card.Actions>
                        <Button onPress={() => { }} mode="text" compact>
                            Read More
                        </Button>
                    </Card.Actions>
                </Card>
            ))}
        </ScrollView>
    );
};

// Step 5: Styling
const styles = StyleSheet.create({
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
