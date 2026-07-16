import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
} from "react-native";
import {
  Text,
  Button,
  Dialog,
  Portal,
  Divider,
} from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';

/**
 * Branded premium dialog to introduce the new Refer & Earn system.
 * Shows only once upon app startup.
 *
 * Props:
 *  - visible: boolean
 *  - onDismiss: () => void
 *  - onAction: () => void
 */
const ReferralAnnouncementDialog = ({ visible, onDismiss, onAction }) => {
  const { styles, colors } = useThemedStyles(createStyles);

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={styles.dialog}
      >
        {/* Accent bar */}
        <View style={styles.accentBar} />

        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Branded Gift Header Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.giftIconCircle}>
                <MaterialIcons
                  name="card-giftcard"
                  size={40}
                  color={theme.colors.secondary}
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>🎁 Introducing Refer & Earn!</Text>
            
            <Text style={styles.subtitle}>
              Share STROMA with your friends and unlock Premium benefits together.
            </Text>

            <Divider style={styles.divider} />

            {/* Benefit Box */}
            <View style={styles.benefitBox}>
              <View style={styles.benefitRow}>
                <MaterialIcons name="local-offer" size={22} color={theme.colors.secondary} style={styles.benefitIcon} />
                <View style={styles.benefitTextCol}>
                  <Text style={styles.benefitTitle}>Friends Get 15% Off</Text>
                  <Text style={styles.benefitDescription}>
                    Your friends get the Yearly Premium plan for just <Text style={styles.boldText}>₹999</Text> (instead of ₹1,200) when they sign up with your code.
                  </Text>
                </View>
              </View>

              <View style={styles.benefitRow}>
                <MaterialIcons name="stars" size={22} color="#4CAF50" style={styles.benefitIcon} />
                <View style={styles.benefitTextCol}>
                  <Text style={styles.benefitTitle}>You Get 30 Days Free</Text>
                  <Text style={styles.benefitDescription}>
                    Receive <Text style={styles.boldText}>30 days of Premium free</Text> for every single friend who subscribes using your referral code.
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.helperText}>
              Find your unique referral code under the "Refer & Earn" section of your Profile.
            </Text>
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions style={styles.actions}>
          <Button
            onPress={onDismiss}
            textColor={theme.colors.textSecondary}
            style={styles.btnSecondary}
            labelStyle={styles.btnLabelSecondary}
          >
            Maybe Later
          </Button>
          <Button
            mode="contained"
            onPress={onAction}
            icon="arrow-forward"
            contentStyle={{ flexDirection: "row-reverse" }}
            style={styles.btnPrimary}
            labelStyle={styles.btnLabelPrimary}
          >
            Go to Profile
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const createStyles = (colors) => StyleSheet.create({
  dialog: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 24,
    maxHeight: "80%",
    overflow: "hidden",
    elevation: 8,
    shadowColor: colors.textTitle,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  accentBar: {
    height: 6,
    backgroundColor: colors.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollArea: {
    paddingHorizontal: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderColor: "transparent",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  giftIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(138, 43, 226, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textTitle,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  divider: {
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  benefitBox: {
    backgroundColor: "#FAF5FF",
    borderWidth: 1.5,
    borderColor: "rgba(138, 43, 226, 0.3)",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  benefitIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  benefitTextCol: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.textTitle,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: "bold",
    color: colors.secondary,
  },
  helperText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    justifyContent: "flex-end",
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    paddingHorizontal: 8,
  },
  btnSecondary: {
    borderRadius: 14,
  },
  btnLabelPrimary: {
    color: colors.surfacePrimary,
    fontWeight: "bold",
    fontSize: 14,
  },
  btnLabelSecondary: {
    fontWeight: "600",
    fontSize: 14,
  },
});

export default ReferralAnnouncementDialog;
