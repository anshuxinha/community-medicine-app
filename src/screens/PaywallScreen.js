import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { MaterialIcons } from '@expo/vector-icons';

const PaywallScreen = ({ navigation }) => {
    const { upgradeToPremium } = useContext(AppContext);

    const handleSubscribe = () => {
        // Because a native SDK would break Expo Go, we'll simulate a payment link behavior.
        // In a real environment, this opens a Stripe/Razorpay link.
        // For demonstration purposes, we will mock the "successful checkout".
        alert("Simulating successful Razorpay/Stripe checkout for ₹999...");
        upgradeToPremium();
        navigation.navigate('Main');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.header}>
                    <MaterialIcons name="workspace-premium" size={80} color="#FBBF24" />
                    <Text variant="headlineLarge" style={styles.title}>Unlock Premium</Text>
                    <Text variant="bodyLarge" style={styles.subtitle}>
                        Get unlimited access to the entire Community Medicine library and your personal AI Tutor.
                    </Text>
                </View>

                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleLarge" style={styles.planName}>Annual Subscription</Text>
                        <Text variant="displayMedium" style={styles.price}>₹999<Text style={styles.period}>/year</Text></Text>

                        <Divider style={styles.divider} />

                        <View style={styles.featureRow}>
                            <MaterialIcons name="check-circle" size={24} color="#10B981" />
                            <Text style={styles.featureText}>Full Library Access (All Chapters)</Text>
                        </View>
                        <View style={styles.featureRow}>
                            <MaterialIcons name="check-circle" size={24} color="#10B981" />
                            <Text style={styles.featureText}>Unlimited AI Medical Tutor</Text>
                        </View>
                        <View style={styles.featureRow}>
                            <MaterialIcons name="check-circle" size={24} color="#10B981" />
                            <Text style={styles.featureText}>Weekly Auto-Updated Guidelines</Text>
                        </View>
                    </Card.Content>
                </Card>

                <Button
                    mode="contained"
                    onPress={handleSubscribe}
                    style={styles.subscribeButton}
                    labelStyle={styles.subscribeButtonLabel}
                >
                    Subscribe Now
                </Button>

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelContainer}>
                    <Text style={styles.cancelText}>Maybe Later</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Light gray standard premium background
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 16,
    },
    subtitle: {
        color: '#4B5563',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 16,
    },
    card: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 16,
        marginBottom: 32,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    planName: {
        color: '#6B7280',
        fontWeight: '600',
        textAlign: 'center',
    },
    price: {
        color: '#111827',
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 8,
    },
    period: {
        fontSize: 18,
        color: '#6B7280',
        fontWeight: 'normal',
    },
    divider: {
        marginVertical: 16,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureText: {
        fontSize: 16,
        color: '#374151',
        marginLeft: 12,
    },
    subscribeButton: {
        backgroundColor: '#1D4ED8',
        width: '100%',
        paddingVertical: 8,
        borderRadius: 30, // Pill shaped main button
        marginBottom: 16,
    },
    subscribeButtonLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelContainer: {
        marginTop: 8,
    },
    cancelText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    }
});

export default PaywallScreen;
