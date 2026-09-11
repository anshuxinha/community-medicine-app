import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import { Portal, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemedStyles } from "../styles/useThemedStyles";
import { onSplashHidden } from "../utils/appSplash";
import { consumeAppliedOtaToast } from "../utils/otaUpdates";

const appIcon = require("../../assets/icon.png");

const AFTER_SPLASH_MS = 800;
const VISIBLE_MS = 4200;

/**
 * Compact top toast after an OTA is applied on the next app open.
 * Matches Chrome on Windows: small logo + short "updated" line, then it fades.
 */
const AppUpdatedToast = () => {
  const { styles } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    let cancelled = false;
    let showTimer = null;
    let hideTimer = null;

    const unsubscribe = onSplashHidden(() => {
      showTimer = setTimeout(() => {
        (async () => {
          const shouldShow = await consumeAppliedOtaToast();
          if (cancelled || !shouldShow) return;
          setVisible(true);
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 0,
              duration: 220,
              useNativeDriver: true,
            }),
          ]).start();

          hideTimer = setTimeout(() => {
            Animated.parallel([
              Animated.timing(opacity, {
                toValue: 0,
                duration: 220,
                useNativeDriver: true,
              }),
              Animated.timing(translateY, {
                toValue: -8,
                duration: 220,
                useNativeDriver: true,
              }),
            ]).start(({ finished }) => {
              if (finished && !cancelled) setVisible(false);
            });
          }, VISIBLE_MS);
        })();
      }, AFTER_SPLASH_MS);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [opacity, translateY]);

  if (!visible) return null;

  return (
    <Portal>
      <View
        pointerEvents="none"
        style={[styles.wrap, { top: Math.max(insets.top, 12) + 8 }]}
      >
        <Animated.View
          accessibilityRole="status"
          accessibilityLiveRegion="polite"
          accessibilityLabel="App updated"
          style={[
            styles.toast,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          <Image source={appIcon} style={styles.logo} />
          <Text style={styles.label}>App updated</Text>
        </Animated.View>
      </View>
    </Portal>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    wrap: {
      position: "absolute",
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 10000,
      elevation: 10000,
    },
    toast: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfacePrimary,
      borderRadius: 24,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    logo: {
      width: 22,
      height: 22,
      borderRadius: 6,
      marginRight: 10,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textTitle,
    },
  });

export default AppUpdatedToast;
