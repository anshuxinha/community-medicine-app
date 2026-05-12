import React, { useState, useEffect, useContext } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
  Image,
} from "react-native";
import { Text, Button, Card } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import Constants from "expo-constants";
let Purchases;
if (Constants.appOwnership !== "expo") {
  Purchases = require("react-native-purchases").default;
}
import { AppContext } from "../context/AppContext";
import { theme } from "../styles/theme";
import {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
} from "../utils/screenCaptureProtection";
import { validateCoupon, applyDiscount, incrementCouponUsage } from "../services/couponService";
import { TextInput } from "react-native-paper";

// Default plan metadata (prices are fetched from RevenueCat)
const PLAN_METADATA = [
  {
    id: "monthly",
    name: "Monthly",
    duration: "Monthly Plan",
    desc: "Cancel anytime",
    badge: null,
    saveText: null,
    packageType: "$rc_monthly",
    basePrice: "₹9/mo",
  },
  {
    id: "yearly",
    name: "Yearly",
    duration: "Yearly Plan",
    desc: "Billed annually",
    badge: "Best Value",
    saveText: "SAVE 20%",
    packageType: "$rc_annual",
    basePrice: "₹999/yr",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    duration: "Lifetime",
    desc: "One-time payment",
    badge: null,
    saveText: null,
    packageType: "$rc_lifetime",
    basePrice: "₹25,000",
  },
];

const PaywallScreen = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  useEffect(() => {
    enableScreenCaptureProtection();
    return () => {
      disableScreenCaptureProtection();
    };
  }, []);
  const [offerings, setOfferings] = useState(null);
  const [packages, setPackages] = useState({});
  const [loadError, setLoadError] = useState(null);
  const { upgradeToPremium, isPremium } = useContext(AppContext);

  // Reset coupon when plan changes if it's not applicable
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.targetPlans && !appliedCoupon.targetPlans.includes(selectedPlan)) {
      setAppliedCoupon(null);
      Alert.alert("Coupon Removed", "This coupon is not applicable to the newly selected plan.");
    }
  }, [selectedPlan]);

  // Fetch offerings from RevenueCat on mount
  const fetchOfferings = async (forcedOfferingId = null) => {
    if (Constants.appOwnership === "expo" || !Purchases) {
      setLoadError("Purchases are not supported in Expo Go.");
      return;
    }

    try {
      const result = await Purchases.getOfferings();
      
      // Support immediate offering switching via coupon IDs
      // If forcedOfferingId is provided (just applied), or if we have an applied coupon,
      // look for a matching offering in result.all before falling back to current.
      const targetId = forcedOfferingId || appliedCoupon?.code;
      let current = result.current;
      
      // DEBUG: Log available offering IDs to help diagnose mismatch
      const allOfferingIds = Object.keys(result.all).join(", ");
      
      if (targetId && result.all[targetId]) {
        current = result.all[targetId];
        if (forcedOfferingId) {
          Alert.alert("Debug: Offering Found", `Switched to offering: ${targetId}. Available: ${allOfferingIds}`);
        }
      } else if (targetId) {
        if (forcedOfferingId) {
          Alert.alert("Debug: Offering NOT Found", `Looking for: ${targetId}. Available: ${allOfferingIds}`);
        }
        if (!current) current = Object.values(result.all)[0];
      } else if (!current) {
        current = Object.values(result.all)[0];
      }

      if (!current || !current.availablePackages) {
        setLoadError(
          "No subscription packages available. Please try again later.",
        );
        return;
      }

      setOfferings(current);

      // Map available packages by their type for easy lookup
      const pkgMap = {};
      current.availablePackages.forEach((pkg) => {
        pkgMap[pkg.packageType] = pkg;
        // Also map by identifier as fallback
        if (pkg.identifier) {
          pkgMap[pkg.identifier] = pkg;
        }
      });
      setPackages(pkgMap);
      setLoadError(null);
    } catch (err) {
      console.warn("Failed to fetch offerings:", err.message);
      setLoadError(
        "Failed to load subscription plans. Check your connection.",
      );
    }
  };

  useEffect(() => {
    fetchOfferings();
  }, []);

  // Redirect if already premium
  useEffect(() => {
    if (isPremium) {
      navigation.goBack();
    }
  }, [isPremium]);

  const handleApplyCoupon = async () => {
    if (!couponCode) {
      Alert.alert("Error", "Please enter a coupon code.");
      return;
    }

    // Check network status to prevent stale validation
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert("Offline", "Please check your internet connection to apply a coupon.");
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const coupon = await validateCoupon(couponCode, selectedPlan);
      setAppliedCoupon(coupon);
      setCouponCode("");
      setShowCouponInput(false);

      // Sync with RevenueCat for Targeting Rules
      if (Purchases) {
        await Purchases.setAttributes({ "coupon_code": coupon.code });
        // Re-fetch offerings so the native modal gets the discounted product
        // Pass code explicitly as state update might be async
        await fetchOfferings(coupon.code);
      }

      Alert.alert("Success", "Coupon applied successfully!");
    } catch (error) {
      Alert.alert("Invalid Coupon", error.message);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setAppliedCoupon(null);
    if (Purchases) {
      // Clear the attribute
      await Purchases.setAttributes({ "coupon_code": "" });
      // Re-fetch to restore original prices
      await fetchOfferings();
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    setIsPurchasing(true);
    try {
      if (!Purchases) {
        Alert.alert(
          "Not Supported",
          "Purchases are not supported in Expo Go. Please use a development build.",
        );
        setIsPurchasing(false);
        return;
      }

      // Find the package for the selected plan
      const metadata = PLAN_METADATA.find((p) => p.id === selectedPlan);
      const pkg = packages[metadata?.packageType] || packages[selectedPlan];

      if (!pkg) {
        Alert.alert(
          "Not Found",
          `The ${selectedPlan} plan is not configured in RevenueCat yet. Please set up the product in your RevenueCat dashboard.`,
        );
        setIsPurchasing(false);
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const hasPremium = customerInfo?.entitlements?.active?.Premium != null;
      if (!hasPremium) {
        throw new Error(
          "Purchase completed, but premium entitlement was not activated yet. Please tap Restore Purchases.",
        );
      }

      // If a custom app coupon was applied, increment its usage
      if (appliedCoupon) {
        await incrementCouponUsage(appliedCoupon.code);
      }

      await upgradeToPremium({
        premiumSource: "purchase",
        premiumPlan: selectedPlan,
        appliedCoupon: appliedCoupon?.code || null,
      });
      Alert.alert(
        "🎉 Welcome to Premium!",
        "Your subscription is now active. Enjoy full access to STROMA.",
        [{ text: "Start Learning", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      if (!error.userCancelled) {
        Alert.alert("Purchase Failed", error.message);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      if (!Purchases) {
        Alert.alert(
          "Not Supported",
          "Purchases are not supported in Expo Go. Please use a development build.",
        );
        return;
      }
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo?.entitlements?.active?.Premium != null) {
        await upgradeToPremium({ premiumSource: "restore" });
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          >
            <MaterialIcons
              name="close"
              size={28}
              color={theme.colors.textPlaceholder}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.heroSection}>
          <View style={styles.iconWrapper}>
            <Image
              source={require("../../assets/icon.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text variant="displaySmall" style={styles.title}>
            Unlock Pro
          </Text>
        </View>

        <View style={styles.featuresList}>
          <FeatureItem text="Unlimited Library Access" />
          <FeatureItem text="Premium Video Lessons" />
          <FeatureItem text="Offline Content Downloads" />
          <FeatureItem text="Exclusive Study Resources" />
          <FeatureItem text="Ad-Free Experience" />
          <FeatureItem text="Priority Support" />
        </View>

        {loadError ? (
          <View style={styles.errorContainer}>
            <MaterialIcons
              name="error-outline"
              size={48}
              color={theme.colors.error}
            />
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        ) : (
          <View style={styles.pricingSection}>
            <View style={styles.pricingCardsContainer}>
              {PLAN_METADATA.map((plan) => {
                // Get price from RevenueCat package if available
                const pkg = packages[plan.packageType] || packages[plan.id];
                const rcPrice = pkg?.product?.priceString;
                const showPrice = rcPrice || plan.basePrice;
                
                // Apply discount if this is the selected plan and a coupon is applied
                const isSelected = selectedPlan === plan.id;
                const finalPriceDisplay = (isSelected && appliedCoupon) 
                  ? applyDiscount(showPrice, appliedCoupon) 
                  : showPrice;

                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.pricingCard,
                      isSelected && styles.pricingCardActive,
                    ]}
                    onPress={() => setSelectedPlan(plan.id)}
                    activeOpacity={0.8}
                  >
                    {plan.badge && (
                      <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>{plan.badge}</Text>
                      </View>
                    )}
                    <Card.Content style={styles.pricingContent}>
                      {plan.saveText && (
                        <Text style={styles.saveBadge}>{plan.saveText}</Text>
                      )}
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planDuration}>{plan.duration}</Text>
                      
                      {isSelected && appliedCoupon ? (
                        <View style={{ alignItems: 'center' }}>
                          <Text style={[styles.priceText, styles.strikethroughPrice]}>{showPrice}</Text>
                          <Text style={[styles.priceText, styles.discountedPrice]}>{finalPriceDisplay}</Text>
                        </View>
                      ) : (
                        <Text style={styles.priceText}>{showPrice}</Text>
                      )}
                      
                      <Text style={styles.planDesc}>{plan.desc}</Text>
                    </Card.Content>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Coupon Section */}
            <View style={styles.couponContainer}>
              {!appliedCoupon ? (
                !showCouponInput ? (
                  <TouchableOpacity 
                    onPress={() => setShowCouponInput(true)}
                    style={styles.couponTrigger}
                  >
                    <Text style={styles.couponTriggerText}>Have a coupon code? <Text style={styles.applyNowText}>Apply now</Text></Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.couponInputWrapper}>
                    <TextInput
                      mode="outlined"
                      placeholder="Enter code"
                      value={couponCode}
                      onChangeText={setCouponCode}
                      autoCapitalize="characters"
                      style={styles.couponInput}
                      dense
                      outlineStyle={{ borderRadius: 8 }}
                    />
                    <Button 
                      mode="contained" 
                      onPress={handleApplyCoupon}
                      loading={isValidatingCoupon}
                      disabled={isValidatingCoupon}
                      style={styles.applyButton}
                    >
                      Apply
                    </Button>
                    <TouchableOpacity onPress={() => setShowCouponInput(false)} style={styles.cancelCoupon}>
                      <MaterialIcons name="close" size={20} color={theme.colors.textPlaceholder} />
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                <View style={styles.appliedCouponWrapper}>
                  <View style={styles.appliedCouponTag}>
                    <MaterialIcons name="local-offer" size={14} color="#A855F7" />
                    <Text style={styles.appliedCouponText}>
                      Code {appliedCoupon.code} applied!
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleRemoveCoupon}>
                    <Text style={styles.removeCouponText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Button
              mode="contained"
              style={styles.subscribeButton}
              labelStyle={styles.subscribeButtonText}
              loading={isPurchasing}
              disabled={isPurchasing}
              onPress={handlePurchase}
            >
              {appliedCoupon ? 'Get Discounted Price' : 'Subscribe Now'}
            </Button>

            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={handleRestore}>
                <Text style={styles.footerLinkText}>Restore Purchase</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL("https://community-med-app.web.app/privacy")
                }
              >
                <Text style={styles.footerLinkText}>Terms & Privacy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const FeatureItem = ({ text }) => (
  <View style={styles.featureItem}>
    <MaterialIcons
      name="check-circle"
      size={24}
      color="#A855F7"
      style={styles.featureIcon}
    />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundMain,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  errorText: {
    marginTop: 16,
    color: theme.colors.error,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "flex-end",
    marginTop: 0,
  },
  closeButton: {
    padding: 4,
  },
  heroSection: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 10,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconBg: {
    opacity: 0.8,
    elevation: 10,
    shadowColor: theme.colors.chartBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  iconFg: {
    position: "absolute",
    top: "30%",
  },
  title: {
    color: theme.colors.textTitle,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 32,
    textAlign: "center",
  },
  featuresList: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 12,
    backgroundColor: theme.colors.primaryLight, // Soft circle background equivalent
    borderRadius: 12,
  },
  featureText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "500",
  },
  pricingSection: {
    marginTop: "auto",
  },
  pricingCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceSecondary,
    marginHorizontal: 4,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  pricingCardActive: {
    borderWidth: 2,
    borderColor: "#A855F7", // Brand accent
    backgroundColor: theme.colors.surfaceTertiary,
    transform: [{ scale: 1.05 }],
    zIndex: 10,
  },
  pricingContent: {
    alignItems: "center",
    paddingHorizontal: 4,
  },
  planName: {
    color: theme.colors.textTitle,
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 2,
  },
  planDuration: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    marginBottom: 8,
  },
  priceText: {
    color: theme.colors.textTitle,
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  planDesc: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    textAlign: "center",
  },
  badgeContainer: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: "#000000",
    fontSize: 10,
    fontWeight: "bold",
  },
  saveBadge: {
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    overflow: "hidden", // iOS rounding fix
  },
  subscribeButton: {
    backgroundColor: theme.colors.secondary, // Match app theme color
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: 24,
    elevation: 4,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.buttonText, // Use theme for proper contrast
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  footerLinkText: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  strikethroughPrice: {
    textDecorationLine: 'line-through',
    color: theme.colors.textPlaceholder,
    fontSize: 10,
    marginBottom: 0,
  },
  discountedPrice: {
    color: '#10B981', // Green for discount
    fontSize: 14,
  },
  couponContainer: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  couponTrigger: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  couponTriggerText: {
    color: theme.colors.textTertiary,
    fontSize: 14,
  },
  applyNowText: {
    color: '#A855F7',
    fontWeight: 'bold',
  },
  couponInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    height: 40,
    backgroundColor: theme.colors.surfacePrimary,
  },
  applyButton: {
    marginLeft: 8,
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
  },
  cancelCoupon: {
    marginLeft: 8,
    padding: 4,
  },
  appliedCouponWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceTertiary,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A855F7',
    borderStyle: 'dashed',
  },
  appliedCouponTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedCouponText: {
    marginLeft: 6,
    color: theme.colors.textTitle,
    fontWeight: '600',
    fontSize: 14,
  },
  removeCouponText: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default PaywallScreen;
