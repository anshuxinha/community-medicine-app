import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Alert, Linking } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import { AppContext } from '../context/AppContext';

const plans = [
    { id: 'monthly', name: 'Monthly', duration: 'Monthly Plan', price: '₹399 / month', desc: 'Cancel anytime', badge: null, saveText: null },
    { id: 'yearly', name: 'Yearly', duration: 'Yearly Plan', price: '₹999 / year', desc: 'Billed annually', badge: 'Best Value', saveText: 'SAVE 20%' },
    { id: 'lifetime', name: 'Lifetime', duration: 'Lifetime', price: '₹25000 once', desc: 'One-time payment', badge: null, saveText: null },
];

const PaywallScreen = ({ navigation }) => {
    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const [isPurchasing, setIsPurchasing] = useState(false);
    const { upgradeToPremium } = useContext(AppContext);

    const handlePurchase = async () => {
        if (!selectedPlan) return;
        setIsPurchasing(true);
        try {
            const offerings = await Purchases.getOfferings();
            const current = offerings.current;
            if (!current) {
                Alert.alert('Not Available', 'No subscription packages are available right now. Please try again later.');
                return;
            }

            // Map selectedPlan to a RevenueCat package type
            const packageTypeMap = {
                monthly: '$rc_monthly',
                yearly: '$rc_annual',
                lifetime: '$rc_lifetime',
            };
            const targetPackageId = packageTypeMap[selectedPlan];
            const pkg = current.availablePackages.find(
                p => p.packageType === targetPackageId || p.identifier === targetPackageId
            );

            if (!pkg) {
                Alert.alert('Not Found', `The ${selectedPlan} plan is not configured in RevenueCat yet. Please set up the product in your RevenueCat dashboard.`);
                return;
            }

            await Purchases.purchasePackage(pkg);
            upgradeToPremium(); // Grant immediate access
            Alert.alert('🎉 Welcome to Premium!', 'Your subscription is now active. Enjoy full access to STROMA.', [
                { text: 'Start Learning', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            if (!error.userCancelled) {
                Alert.alert('Purchase Failed', error.message);
            }
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleRestore = async () => {
        try {
            const customerInfo = await Purchases.restorePurchases();
            if (customerInfo.entitlements.active['Premium'] !== undefined) {
                Alert.alert("Success", "Your purchases were restored!");
            } else {
                Alert.alert("Notice", "No active premium subscriptions found.");
            }
        } catch (e) {
            Alert.alert("Error restoring purchases", e.message);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <MaterialIcons name="close" size={28} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.heroSection}>
                    <View style={styles.iconWrapper}>
                        <MaterialIcons name="menu-book" size={60} color="#3B82F6" style={styles.iconBg} />
                        <MaterialIcons name="add" size={30} color="#FFFFFF" style={styles.iconFg} />
                    </View>
                    <Text variant="displaySmall" style={styles.title}>Go Pro</Text>
                </View>

                <View style={styles.featuresList}>
                    <FeatureItem text="Unlimited Library Access" />
                    <FeatureItem text="Advanced AI Tutor Assistance" />
                    <FeatureItem text="Offline Content Downloads" />
                    <FeatureItem text="Exclusive Study Resources" />
                    <FeatureItem text="Ad-Free Experience" />
                    <FeatureItem text="Priority Support" />
                </View>

                <View style={styles.pricingSection}>
                    <View style={styles.pricingCardsContainer}>
                        {plans.map((plan) => (
                            <TouchableOpacity
                                key={plan.id}
                                style={[styles.pricingCard, selectedPlan === plan.id && styles.pricingCardActive]}
                                onPress={() => setSelectedPlan(plan.id)}
                                activeOpacity={0.8}
                            >
                                {plan.badge && (
                                    <View style={styles.badgeContainer}><Text style={styles.badgeText}>{plan.badge}</Text></View>
                                )}
                                <Card.Content style={styles.pricingContent}>
                                    {plan.saveText && (
                                        <Text style={styles.saveBadge}>{plan.saveText}</Text>
                                    )}
                                    <Text style={styles.planName}>{plan.name}</Text>
                                    <Text style={styles.planDuration}>{plan.duration}</Text>
                                    <Text style={styles.priceText}>{plan.price}</Text>
                                    <Text style={styles.planDesc}>{plan.desc}</Text>
                                </Card.Content>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Button
                        mode="contained"
                        style={styles.subscribeButton}
                        labelStyle={styles.subscribeButtonText}
                        loading={isPurchasing}
                        disabled={isPurchasing}
                        onPress={handlePurchase}
                    >
                        Subscribe Now
                    </Button>

                    <View style={styles.footerLinks}>
                        <TouchableOpacity onPress={handleRestore}>
                            <Text style={styles.footerLinkText}>Restore Purchase</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => Linking.openURL('https://community-med-app.web.app/privacy')}>
                            <Text style={styles.footerLinkText}>Terms & Privacy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const FeatureItem = ({ text }) => (
    <View style={styles.featureItem}>
        <MaterialIcons name="check-circle" size={24} color="#A855F7" style={styles.featureIcon} />
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FBFCFE',
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'flex-end',
        marginTop: 0,
    },
    closeButton: {
        padding: 4,
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 0,
        marginBottom: 10,
    },
    iconWrapper: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconBg: {
        opacity: 0.8,
        elevation: 10,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    iconFg: {
        position: 'absolute',
        top: '30%',
    },
    title: {
        color: '#111827',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 32,
        textAlign: 'center',
    },
    featuresList: {
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureIcon: {
        marginRight: 12,
        backgroundColor: '#E0E7FF', // Soft circle background equivalent
        borderRadius: 12,
    },
    featureText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '500',
    },
    pricingSection: {
        marginTop: 'auto',
    },
    pricingCardsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    pricingCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginHorizontal: 4,
        paddingVertical: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    pricingCardActive: {
        borderWidth: 2,
        borderColor: '#A855F7', // Brand accent
        backgroundColor: '#FAFAFF',
        transform: [{ scale: 1.05 }],
        zIndex: 10,
    },
    pricingContent: {
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    planName: {
        color: '#111827',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    planDuration: {
        color: '#6B7280',
        fontSize: 10,
        marginBottom: 8,
    },
    priceText: {
        color: '#111827',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 8,
        textAlign: 'center',
    },
    planDesc: {
        color: '#6B7280',
        fontSize: 10,
        textAlign: 'center',
    },
    badgeContainer: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        backgroundColor: '#C4B5FD',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    badgeText: {
        color: '#000000',
        fontSize: 10,
        fontWeight: 'bold',
    },
    saveBadge: {
        color: '#581C87',
        backgroundColor: '#E9D5FF',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 4,
        overflow: 'hidden', // iOS rounding fix
    },
    subscribeButton: {
        backgroundColor: '#60A5FA', // nice light blue gradient replacement
        paddingVertical: 10,
        borderRadius: 30,
        marginBottom: 24,
        elevation: 4,
        shadowColor: '#60A5FA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    subscribeButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000', // Dark text per mockup
    },
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    footerLinkText: {
        color: '#6B7280',
        fontSize: 12,
    },
});

export default PaywallScreen;
