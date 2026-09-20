import React, { Component, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemedStyles } from "../styles/useThemedStyles";
import { onSplashHidden } from "../utils/appSplash";
import {
  markAppUpdatedToastShown,
  peekAppliedOtaToast,
} from "../utils/otaUpdates";

const AFTER_SPLASH_MS = 800;
const VISIBLE_MS = 4200;

class ToastGuard extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    markAppUpdatedToastShown();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/**
 * Compact top toast after an OTA is applied on the next app open.
 */
const AppUpdatedToast = () => {
  const { styles, colors } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;
  const markedRef = useRef(false);

  useEffect(() => {
    if (__DEV__) return undefined;

    let cancelled = false;
    let showTimer = null;
    let hideTimer = null;

    const unsubscribe = onSplashHidden(() => {
      showTimer = setTimeout(() => {
        (async () => {
          try {
            const shouldShow = await peekAppliedOtaToast();
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
          } catch (e) {
            console.warn("AppUpdatedToast error:", e?.message);
          }
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

  const onShown = () => {
    if (markedRef.current) return;
    markedRef.current = true;
    markAppUpdatedToastShown();
  };

  if (!visible) return null;

  return (
    <ToastGuard>
      <View
        pointerEvents="none"
        style={[styles.wrap, { top: Math.max(insets.top, 12) + 8 }]}
      >
        <Animated.View
          accessibilityRole="status"
          accessibilityLabel="App updated"
          onLayout={onShown}
          style={[styles.toast, { opacity, transform: [{ translateY }] }]}
        >
          <MaterialIcons
            name="system-update-alt"
            size={20}
            color={colors.primary}
            style={styles.logo}
          />
          <Text style={styles.label}>App updated</Text>
        </Animated.View>
      </View>
    </ToastGuard>
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
      marginRight: 10,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textTitle,
    },
  });

export default AppUpdatedToast;
