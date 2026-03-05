import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const FieldToolboxScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text variant="headlineMedium" style={styles.title}>Field Toolbox</Text>

                <Card style={styles.card} onPress={() => navigation.navigate('SESCalculator')}>
                    <Card.Content style={styles.cardContent}>
                        <MaterialIcons name="calculate" size={40} color={theme.colors.secondary} />
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>SES Calculator</Text>
                            <Text style={styles.cardDesc}>Compute Socio-Economic Status (Modified Kuppuswamy & BG Prasad)</Text>
                        </View>
                    </Card.Content>
                </Card>

                <Card style={styles.card} onPress={() => navigation.navigate('DietarySurvey')}>
                    <Card.Content style={styles.cardContent}>
                        <MaterialIcons name="restaurant-menu" size={40} color={theme.colors.secondary} />
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>Dietary Survey</Text>
                            <Text style={styles.cardDesc}>Calculate Calories, Protein, and Fat intake vs Reference</Text>
                        </View>
                    </Card.Content>
                </Card>

                <Card style={styles.card} onPress={() => navigation.navigate('Anthropometry')}>
                    <Card.Content style={styles.cardContent}>
                        <MaterialIcons name="accessibility-new" size={40} color={theme.colors.secondary} />
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>Anthropometry & EDD</Text>
                            <Text style={styles.cardDesc}>Calculate BMI and Expected Date of Delivery</Text>
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
        backgroundColor: theme.colors.backgroundMain,
    },
    container: {
        padding: 16,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 24,
        color: theme.colors.textTitle,
    },
    card: {
        marginBottom: 16,
        backgroundColor: theme.colors.surfacePrimary,
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
        color: theme.colors.textTitle,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
});

export default FieldToolboxScreen;
