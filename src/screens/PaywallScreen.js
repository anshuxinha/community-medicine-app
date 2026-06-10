import React, { useState, useEffect, useContext } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
  Image,
  ScrollView,
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
import {
  validateCoupon,
  applyDiscount,
  incrementCouponUsage,
  processReferralReward,
} from "../services/couponService";
import { TextInput } from "react-native-paper";
import { logEvent } from "firebase/analytics";
import { analytics } from "../config/firebase";

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
    basePrice: "₹299/mo", // Fixed fallback to match RC default
  },
  {
    id: "yearly",
    name: "Yearly",
    duration: "Yearly Plan",
    desc: "Billed annually",
    badge: "Best Value",
    saveText: "SAVE 20%",
    packageType: "$rc_annual",
    basePrice: "₹1,200/yr", // Fixed fallback to match RC default
  },
  {
    id: "lifetime",
    name: "Lifetime",
    duration: "Lifetime",
    desc: "One-time payment",
    badge: null,
    saveText: null,
    packageType: "$rc_lifetime",
    basePrice: "₹11,000", // Fixed fallback to match RC default
  },
];

const PaywallScreen = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Helper for consistent analytics logging
  const logCouponEvent = (eventName, params = {}) => {
    if (analytics) {
      logEvent(analytics, eventName, {
        ...params,
        selected_plan: selectedPlan,
        coupon_applied: !!appliedCoupon,
        platform: Platform.OS,
      });
    }
  };

  useEffect(() => {
    enableScreenCaptureProtection();
    return () => {
      disableScreenCaptureProtection();
    };
  }, []);
  const [offerings, setOfferings] = useState(null);
  const [packages, setPackages] = useState({});
  const [loadError, setLoadError] = useState(null);
  const { upgradeToPremium, isPremium, user } = useContext(AppContext);

  // Reset coupon when plan changes if it's not applicable
  useEffect(() => {
    if (
      appliedCoupon &&
      appliedCoupon.targetPlans &&
      !appliedCoupon.targetPlans.includes(selectedPlan)
    ) {
      setAppliedCoupon(null);
      Alert.alert(
        "Coupon Removed",
        "This coupon is not applicable to the newly selected plan.",
      );
    }
  }, [selectedPlan]);

  // Fetch offerings from RevenueCat on mount
  const fetchOfferings = async (forcedOfferingId = undefined) => {
    if (Constants.appOwnership === "expo" || !Purchases) {
      setLoadError("Purchases are not supported in Expo Go.");
      return;
    }

    try {
      console.log("[RevenueCat] Fetching offerings for platform:", Platform.OS);
      const result = await Purchases.getOfferings();
      console.log(
        "[RevenueCat] Offerings fetched successfully:",
        Object.keys(result.all).join(", "),
      );

      // Support immediate offering switching via coupon IDs
      let targetId = (
        forcedOfferingId !== undefined ? forcedOfferingId : (appliedCoupon?.isReferral ? "yearly999" : appliedCoupon?.code)
      )?.toLowerCase();

      // If targetId is matching the raw referral coupon code (case-insensitively), override it to the yearly999 offering
      if (targetId && appliedCoupon?.isReferral && targetId === appliedCoupon.code.toLowerCase()) {
        targetId = "yearly999";
      }

      let current = result.current;

      console.log("[RevenueCat] Current offering ID:", current?.identifier);

      if (targetId) {
        // Find matching offering ID case-insensitively
        const matchingId = Object.keys(result.all).find(
          (id) => id.toLowerCase() === targetId,
        );
        if (matchingId) {
          console.log(
            "[RevenueCat] Switching to targeted offering:",
            matchingId,
          );
          current = result.all[matchingId];
        } else if (!current) {
          current = Object.values(result.all)[0];
        }
      } else if (!current) {
        current = Object.values(result.all)[0];
      }

      if (!current || !current.availablePackages) {
        const errorMsg = !current
          ? "No offering found."
          : "No available packages in current offering.";
        console.warn(
          "[RevenueCat]",
          errorMsg,
          "All offerings:",
          Object.keys(result.all),
        );
        setLoadError(
          `No subscription packages available (${errorMsg}). Please try again later.`,
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
        `Failed to load subscription plans: ${err.message}. Check your connection.`,
      );
    }
  };

  useEffect(() => {
    const init = async () => {
      if (Purchases) {
        try {
          // Clear any previous coupon targeting on mount to reset to default offering
          // This fixes the issue where YEARLY999 users see the discounted price by default even after reinstall
          await Purchases.setAttributes({ coupon_code: "" });
          console.log("[RevenueCat] Attributes cleared on mount");
        } catch (err) {
          console.warn("[RevenueCat] Failed to clear attributes:", err);
        }
      }
      fetchOfferings();
    };
    init();
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

    logCouponEvent("coupon_apply_attempt", { code: couponCode });

    // Check network status to prevent stale validation
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert(
        "Offline",
        "Please check your internet connection to apply a coupon.",
      );
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const coupon = await validateCoupon(couponCode, selectedPlan, user?.uid);
      setAppliedCoupon(coupon);
      setCouponCode("");
      setShowCouponInput(false);

      logCouponEvent("coupon_apply_success", {
        code: coupon.code,
        discount_type: coupon.discountType,
        discount_value: coupon.discountValue,
      });

      // Sync with RevenueCat for Targeting Rules
      if (Purchases) {
        await Purchases.setAttributes({ coupon_code: coupon.code });
        // Re-fetch offerings so the native modal gets the discounted product
        // Pass code explicitly (mapping referral coupons to the static "yearly999" offering)
        const offeringIdToFetch = coupon.isReferral ? "yearly999" : coupon.code;
        await fetchOfferings(offeringIdToFetch);
      }

      Alert.alert("Success", "Coupon applied successfully!");
    } catch (error) {
      logCouponEvent("coupon_apply_failure", {
        code: couponCode,
        reason: error.message,
      });
      Alert.alert("Invalid Coupon", error.message);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setAppliedCoupon(null);
    if (Purchases) {
      // Clear the attribute
      await Purchases.setAttributes({ coupon_code: "" });
      // Re-fetch to restore original prices - pass null explicitly to clear the targeted offering
      await fetchOfferings(null);
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
      let pkg = packages[metadata?.packageType] || packages[selectedPlan];

      // Fallback: If only one package exists in the current offering, use it.
      if (!pkg && Object.keys(packages).length === 1) {
        pkg = Object.values(packages)[0];
      }

      if (!pkg) {
        const availablePkgIds = Object.keys(packages).join(", ");
        Alert.alert(
          "Not Found",
          `The ${selectedPlan} plan is not configured in RevenueCat yet. (Available: ${availablePkgIds})`,
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

      // If a custom app coupon was applied, increment its usage or process referral
      if (appliedCoupon) {
        if (appliedCoupon.isReferral === true) {
          await processReferralReward(appliedCoupon.code, appliedCoupon.referrerUid, user?.uid);
        } else {
          await incrementCouponUsage(appliedCoupon.code);
        }
      }

      await upgradeToPremium({
        premiumSource: "purchase",
        premiumPlan: selectedPlan,
        appliedCoupon: appliedCoupon?.code || null,
      });

      logCouponEvent("purchase_success", {
        plan: selectedPlan,
        coupon: appliedCoupon?.code || null,
        entitlement: "Premium",
      });

      Alert.alert(
        "🎉 Welcome to Premium!",
        "Your subscription is now active. Enjoy full access to STROMA.",
        [{ text: "Start Learning", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      if (
        Purchases &&
        error.code === Purchases.PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR
      ) {
        Alert.alert(
          "Purchase Pending",
          "Your transaction is pending approval or verification (such as Ask to Buy or bank authentication). Your access will be automatically unlocked once the transaction is completed.",
          [{ text: "OK" }],
        );
      } else if (!error.userCancelled) {
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
      if (customerInfo?.entitlements?.active?.["Premium"] !== undefined) {
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
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
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
                const finalPriceDisplay =
                  isSelected && appliedCoupon
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
                        <View style={{ alignItems: "center" }}>
                          <Text
                            style={[
                              styles.priceText,
                              styles.strikethroughPrice,
                            ]}
                          >
                            {showPrice}
                          </Text>
                          <Text
                            style={[styles.priceText, styles.discountedPrice]}
                          >
                            {finalPriceDisplay}
                          </Text>
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
                    <Text style={styles.couponTriggerText}>
                      Have a coupon code?{" "}
                      <Text style={styles.applyNowText}>Apply now</Text>
                    </Text>
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
                    <TouchableOpacity
                      onPress={() => setShowCouponInput(false)}
                      style={styles.cancelCoupon}
                    >
                      <MaterialIcons
                        name="close"
                        size={20}
                        color={theme.colors.textPlaceholder}
                      />
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                <View style={styles.appliedCouponWrapper}>
                  <View style={styles.appliedCouponTag}>
                    <MaterialIcons
                      name="local-offer"
                      size={14}
                      color="#A855F7"
                    />
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
              {appliedCoupon ? "Get Discounted Price" : "Subscribe Now"}
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
                <Text style={styles.footerLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/",
                  )
                }
              >
                <Text style={styles.footerLinkText}>Terms of Use (EULA)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.legalDisclaimer}>
              <Text style={styles.legalText}>
                Subscription Title: STROMA Premium. Length of subscription:
                Monthly, Yearly, or Lifetime as selected. Payment will be
                charged to your Apple ID account at the confirmation of
                purchase. Subscription automatically renews unless it is
                canceled at least 24 hours before the end of the current period.
                Your account will be charged for renewal within 24 hours prior
                to the end of the current period. You can manage and cancel your
                subscriptions by going to your account settings on the App Store
                after purchase.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 60, // Increased to avoid overlap with system nav bar
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
    marginBottom: 8, // Reduced for better fit
  },
  iconWrapper: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8, // Reduced
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
    fontSize: 28, // Reduced from 32
    textAlign: "center",
  },
  featuresList: {
    marginBottom: 12, // Reduced from 16
    paddingHorizontal: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8, // Reduced from 12
  },
  featureIcon: {
    marginRight: 12,
    backgroundColor: theme.colors.primaryLight,
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
    marginBottom: 16, // Reduced from 24
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
    borderColor: "#A855F7",
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
    overflow: "hidden",
  },
  subscribeButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: 16, // Reduced from 24
    elevation: 4,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.buttonText,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  footerLinkText: {
    color: theme.colors.textTertiary,
    fontSize: 11,
  },
  legalDisclaimer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  legalText: {
    color: theme.colors.textPlaceholder,
    fontSize: 9,
    textAlign: "center",
    lineHeight: 12,
  },
  strikethroughPrice: {
    textDecorationLine: "line-through",
    color: theme.colors.textPlaceholder,
    fontSize: 10,
    marginBottom: 0,
  },
  discountedPrice: {
    color: "#10B981",
    fontSize: 14,
  },
  couponContainer: {
    marginBottom: 16, // Reduced from 20
    paddingHorizontal: 8,
  },
  couponTrigger: {
    alignItems: "center",
    paddingVertical: 8,
  },
  couponTriggerText: {
    color: theme.colors.textTertiary,
    fontSize: 14,
  },
  applyNowText: {
    color: "#A855F7",
    fontWeight: "bold",
  },
  couponInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "center",
  },
  cancelCoupon: {
    marginLeft: 8,
    padding: 4,
  },
  appliedCouponWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceTertiary,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A855F7",
    borderStyle: "dashed",
  },
  appliedCouponTag: {
    flexDirection: "row",
    alignItems: "center",
  },
  appliedCouponText: {
    marginLeft: 6,
    color: theme.colors.textTitle,
    fontWeight: "600",
    fontSize: 14,
  },
  removeCouponText: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default PaywallScreen;
