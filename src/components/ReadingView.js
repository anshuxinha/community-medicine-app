import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';

const ReadingView = ({ content }) => {
    // Simple markdown-like rendering for demo purposes
    // In a real app, use a library like react-native-markdown-display

    const renderContent = (text) => {
        return text.split('\n').map((line, index) => {
            if (line.startsWith('# ')) {
                return <Text key={index} variant="headlineLarge" style={styles.h1}>{line.replace('# ', '')}</Text>;
            } else if (line.startsWith('## ')) {
                return <Text key={index} variant="headlineMedium" style={styles.h2}>{line.replace('## ', '')}</Text>;
            } else if (line.startsWith('* ') || line.startsWith('- ')) {
                return <Text key={index} style={styles.listItem}>• {line.replace(/^[\*\-] /, '')}</Text>;
            } else if (line.trim() === '') {
                return <Text key={index} style={styles.spacing}> </Text>;
            } else {
                return <Text key={index} variant="bodyMedium" style={styles.body}>{line}</Text>;
            }
        });
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    {renderContent(content)}
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        margin: 16,
        padding: 8,
    },
    h1: {
        marginVertical: 12,
        fontWeight: 'bold',
        color: '#6200ee',
    },
    h2: {
        marginVertical: 10,
        fontWeight: 'bold',
        color: '#333',
    },
    body: {
        marginVertical: 4,
        lineHeight: 22,
    },
    listItem: {
        marginLeft: 16,
        marginVertical: 2,
    },
    spacing: {
        height: 10,
    },
});

export default ReadingView;
