import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Paragraph } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const FieldToolboxScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text variant="headlineMedium" style={styles.title}>Field Toolbox</Text>

                <Card style={styles.card} onPress={() => navigation.navigate('SESCalculator')}>
                    <Card.Content style={styles.cardContent}>
                        <MaterialIcons name="calculate" size={40} color="#8A2BE2" />
                        <View style={styles.textContainer}>
                            <Title style={styles.cardTitle}>SES Calculator</Title>
                            <Paragraph>Compute Socio-Economic Status (Modified Kuppuswamy & BG Prasad)</Paragraph>
                        </View>
                    </Card.Content>
                </Card>

                <Card style={styles.card} onPress={() => navigation.navigate('DietarySurvey')}>
                    <Card.Content style={styles.cardContent}>
                        <MaterialIcons name="restaurant-menu" size={40} color="#8A2BE2" />
                        <View style={styles.textContainer}>
                            <Title style={styles.cardTitle}>Dietary Survey</Title>
                            <Paragraph>Calculate Calories, Protein, and Fat intake vs Reference</Paragraph>
                        </View>
                    </Card.Content>
                </Card>

                <Card style={styles.card} onPress={() => navigation.navigate('Anthropometry')}>
                    <Card.Content style={styles.cardContent}>
                        <MaterialIcons name="accessibility-new" size={40} color="#8A2BE2" />
                        <View style={styles.textContainer}>
                            <Title style={styles.cardTitle}>Anthropometry & EDD</Title>
                            <Paragraph>Calculate BMI and Expected Date of Delivery</Paragraph>
                        </View>
                    </Card.Content>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FBFCFE',
    },
    container: {
        padding: 16,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 24,
        color: '#111827',
    },
    card: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: 16,
        flex: 1,
    },
    cardTitle: {
        fontWeight: 'bold',
        fontSize: 18,
    }
});

export default FieldToolboxScreen;
