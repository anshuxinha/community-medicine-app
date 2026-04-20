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
import { Text, Button, Card, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
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

// 30 unique coupon codes for ₹49 monthly subscription
const VALID_COUPON_CODES = [
  "STROMA49A1",
  "STROMA49B2",
  "STROMA49C3",
  "STROMA49D4",
  "STROMA49E5",
  "STROMA49F6",
  "STROMA49G7",
  "STROMA49H8",
  "STROMA49I9",
  "STROMA49J10",
  "STROMA49K11",
  "STROMA49L12",
  "STROMA49M13",
  "STROMA49N14",
  "STROMA49O15",
  "STROMA49P16",
  "STROMA49Q17",
  "STROMA49R18",
  "STROMA49S19",
  "STROMA49T20",
  "STROMA49U21",
  "STROMA49V22",
  "STROMA49W23",
  "STROMA49X24",
  "STROMA49Y25",
  "STROMA49Z26",
  "STROMA49A27",
  "STROMA49B28",
  "STROMA49C29",
  "STROMA49D30",
];

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
    couponPrice: "₹49/mo",
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
    couponPrice: null,
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
    couponPrice: null,
  },
];

const PaywallScreen = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    enableScreenCaptureProtection();
    return () => {
      disableScreenCaptureProtection();
    };
  }, []);
  const [offerings, setOfferings] = useState(null);
  const [packages, setPackages] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState(false);
  const { upgradeToPremium, isPremium } = useContext(AppContext);

  // Fetch offerings from RevenueCat on mount
  useEffect(() => {
    if (Constants.appOwnership === "expo" || !Purchases) {
      setLoadError("Purchases are not supported in Expo Go.");
      return;
    }

    Purchases.getOfferings()
      .then((result) => {
        const current = result.current || Object.values(result.all)[0];
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
      })
      .catch((err) => {
        console.warn("Failed to fetch offerings:", err.message);
        setLoadError(
          "Failed to load subscription plans. Check your connection.",
        );
      });
  }, []);

  // Redirect if already premium
  useEffect(() => {
    if (isPremium) {
      navigation.goBack();
    }
  }, [isPremium]);

  const validateCoupon = (code) => {
    const normalizedCode = code.trim().toUpperCase();
    return VALID_COUPON_CODES.includes(normalizedCode);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError(false);
      setCouponApplied(false);
      return;
    }
    if (validateCoupon(couponCode)) {
      setCouponApplied(true);
      setCouponError(false);
    } else {
      setCouponApplied(false);
      setCouponError(true);
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
      await upgradeToPremium({
        premiumSource: "purchase",
        premiumPlan: selectedPlan,
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
          <FeatureItem text="Live Webinars Access" />
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
                // Use coupon price for monthly plan when coupon is applied
                const isCouponMonthly = couponApplied && plan.id === "monthly";
                const showPrice = isCouponMonthly
                  ? plan.couponPrice
                  : rcPrice || plan.basePrice;

                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.pricingCard,
                      selectedPlan === plan.id && styles.pricingCardActive,
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
                      <Text style={styles.priceText}>{showPrice}</Text>
                      {isCouponMonthly && (
                        <Text style={styles.couponAppliedBadge}>
                          Coupon Applied
                        </Text>
                      )}
                      <Text style={styles.planDesc}>{plan.desc}</Text>
                    </Card.Content>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.couponSection}>
              <View style={styles.couponInputRow}>
                <TextInput
                  mode="outlined"
                  label="Coupon Code"
                  value={couponCode}
                  onChangeText={(text) => {
                    setCouponCode(text.toUpperCase());
                    setCouponApplied(false);
                    setCouponError(false);
                  }}
                  style={styles.couponInput}
                  outlineColor={theme.colors.surfaceSecondary}
                  activeOutlineColor={theme.colors.secondary}
                  textColor={theme.colors.textPrimary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  dense
                />
                <Button
                  mode="outlined"
                  onPress={handleApplyCoupon}
                  style={styles.applyButton}
                  labelStyle={styles.applyButtonLabel}
                  disabled={!couponCode.trim()}
                >
                  Apply
                </Button>
              </View>
              {couponError && (
                <Text style={styles.couponErrorText}>
                  Invalid coupon code. Please try again.
                </Text>
              )}
              {couponApplied && (
                <Text style={styles.couponSuccessText}>
                  Coupon applied! Monthly plan is now ₹49/month.
                </Text>
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
              Subscribe Now
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
  couponSection: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  couponInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  couponInput: {
    flex: 1,
    marginRight: 8,
    backgroundColor: theme.colors.surfacePrimary,
    height: 40,
  },
  applyButton: {
    borderColor: theme.colors.secondary,
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
  },
  applyButtonLabel: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: "600",
  },
  couponErrorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  couponSuccessText: {
    color: theme.colors.success,
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  couponAppliedBadge: {
    color: theme.colors.success,
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
  },
});

export default PaywallScreen;
