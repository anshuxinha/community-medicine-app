import React, { useCallback, useContext, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { AppContext } from "../context/AppContext";
import { useThemedStyles } from "../styles/useThemedStyles";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const SUPPORT_EMAIL = "admin@bottlegramhealth.in";

const FAQ_ITEMS = [
  {
    id: "membership",
    icon: "payment",
    title: "Membership not activated after payment",
    solutionParts: [
      {
        type: "text",
        value:
          "This usually happens with the PhonePe app. No payment was deducted from your account (verify in your bank statement). Simply cancel the auto pay request in your app and try using a different UPI app (GPay preferred) to get the STROMA Membership. If the issue still isn't resolved, kindly mail us at ",
      },
      { type: "email" },
      { type: "text", value: "." },
    ],
    subject: "STROMA: Membership not activated after payment",
  },
  {
    id: "content",
    icon: "library-books",
    title: "Request for content addition or update",
    solutionParts: [
      {
        type: "text",
        value: "Sure, let's get in touch. Kindly mail us directly at ",
      },
      { type: "email" },
      { type: "text", value: "." },
    ],
    subject: "STROMA: Content addition or update request",
  },
  {
    id: "feature",
    icon: "lightbulb-outline",
    title: "Request for a new feature",
    solutionParts: [
      {
        type: "text",
        value:
          "We're constantly looking for ways to improve the app. If you have any suggestions, please mail us directly at ",
      },
      { type: "email" },
      { type: "text", value: "." },
    ],
    subject: "STROMA: Feature request",
  },
];

const getDeviceOsLabel = () => {
  if (Platform.OS === "ios") {
    return `iOS ${String(Platform.Version)}`;
  }
  if (Platform.OS === "android") {
    return `Android ${String(Platform.Version)}`;
  }
  return Platform.OS;
};

/**
 * Build a mailto URL with device/account context prefilled in the body.
 * @param {{ subject: string, userEmail?: string|null }} opts
 */
export const buildSupportMailto = ({ subject, userEmail }) => {
  const appVersion =
    Constants.expoConfig?.version ||
    Constants.nativeAppVersion ||
    "unknown";
  const body = [
    "Hi STROMA Support,",
    "",
    "",
    "",
    "---",
    `Account email: ${userEmail || "not signed in"}`,
    `Device OS: ${getDeviceOsLabel()}`,
    `App version: ${appVersion}`,
  ].join("\n");

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
};

const SupportScreen = () => {
  const { styles, colors } = useThemedStyles(createStyles);
  const { user } = useContext(AppContext);
  const [expandedId, setExpandedId] = useState(FAQ_ITEMS[0].id);

  const openSupportEmail = useCallback(
    async (subject) => {
      const url = buildSupportMailto({
        subject,
        userEmail: user?.email,
      });
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          Alert.alert(
            "Email not available",
            `Please email us at ${SUPPORT_EMAIL}`,
          );
          return;
        }
        await Linking.openURL(url);
      } catch (_) {
        Alert.alert(
          "Email not available",
          `Please email us at ${SUPPORT_EMAIL}`,
        );
      }
    },
    [user?.email],
  );

  const toggleItem = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <MaterialIcons
            name="support-agent"
            size={28}
            color={colors.secondary}
          />
        </View>
        <Text style={styles.heroTitle}>How can we help?</Text>
        <Text style={styles.heroSubtitle}>
          Browse common issues below. Tap an email address to write to us with
          your device details included automatically.
        </Text>
      </View>

      <View style={styles.list}>
        {FAQ_ITEMS.map((item, index) => {
          const expanded = expandedId === item.id;
          return (
            <View
              key={item.id}
              style={[
                styles.card,
                expanded && styles.cardExpanded,
                index === FAQ_ITEMS.length - 1 && styles.cardLast,
              ]}
            >
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={item.title}
              >
                <View
                  style={[
                    styles.itemIconBox,
                    expanded && styles.itemIconBoxActive,
                  ]}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={20}
                    color={expanded ? colors.onPrimary : colors.secondary}
                  />
                </View>
                <Text
                  style={[styles.cardTitle, expanded && styles.cardTitleActive]}
                >
                  {item.title}
                </Text>
                <MaterialIcons
                  name={expanded ? "expand-less" : "expand-more"}
                  size={24}
                  color={expanded ? colors.secondary : colors.textPlaceholder}
                />
              </TouchableOpacity>

              {expanded ? (
                <View style={styles.cardBody}>
                  <Text style={styles.solutionLabel}>Solution</Text>
                  <Text style={styles.solutionText}>
                    {item.solutionParts.map((part, partIndex) => {
                      if (part.type === "email") {
                        return (
                          <Text
                            key={`${item.id}-email-${partIndex}`}
                            style={styles.emailLink}
                            onPress={() => openSupportEmail(item.subject)}
                            accessibilityRole="link"
                            accessibilityLabel={`Email ${SUPPORT_EMAIL}`}
                          >
                            {SUPPORT_EMAIL}
                          </Text>
                        );
                      }
                      return (
                        <Text key={`${item.id}-text-${partIndex}`}>
                          {part.value}
                        </Text>
                      );
                    })}
                  </Text>

                  <TouchableOpacity
                    style={styles.emailCta}
                    onPress={() => openSupportEmail(item.subject)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Contact support about ${item.title}`}
                  >
                    <MaterialIcons
                      name="mail-outline"
                      size={18}
                      color={colors.onPrimary}
                    />
                    <Text style={styles.emailCtaText}>Email support</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.footerCard}>
        <MaterialIcons
          name="alternate-email"
          size={18}
          color={colors.textSecondary}
        />
        <Text style={styles.footerText}>
          Still stuck?{" "}
          <Text
            style={styles.emailLink}
            onPress={() =>
              openSupportEmail("STROMA: Support request")
            }
            accessibilityRole="link"
          >
            {SUPPORT_EMAIL}
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.backgroundMain,
    },
    container: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 40,
    },
    hero: {
      marginBottom: 20,
    },
    heroIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textTitle,
      marginBottom: 6,
    },
    heroSubtitle: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.textSecondary,
    },
    list: {
      gap: 12,
    },
    card: {
      backgroundColor: colors.surfacePrimary,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    cardExpanded: {
      borderColor: colors.primaryMuted,
      shadowOpacity: 0.1,
      elevation: 3,
    },
    cardLast: {},
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 14,
      minHeight: 64,
    },
    itemIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    itemIconBoxActive: {
      backgroundColor: colors.secondary,
    },
    cardTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: colors.textTitle,
      lineHeight: 21,
      paddingRight: 8,
    },
    cardTitleActive: {
      color: colors.primaryDark || colors.primary,
    },
    cardBody: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    solutionLabel: {
      marginTop: 12,
      marginBottom: 6,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: colors.secondary,
    },
    solutionText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    emailLink: {
      color: colors.secondary,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    emailCta: {
      marginTop: 14,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.secondary,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
    },
    emailCtaText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    footerCard: {
      marginTop: 20,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      padding: 14,
    },
    footerText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    },
  });

export default SupportScreen;
