import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppTheme } from "../styles/ThemeContext";
import { useThemedStyles } from "../styles/useThemedStyles";

const TRACK_W = 52;
const TRACK_H = 28;
const THUMB = 22;
const PAD = 3;
const TRAVEL = TRACK_W - THUMB - PAD * 2;

/**
 * Compact pill toggle for light/dark theme (header-safe).
 * Uses the same ThemeContext store as Profile — stays in sync app-wide.
 */
export default function ThemeModePill() {
  const { isDark, setPreference } = useAppTheme();
  const { styles, colors } = useThemedStyles(createStyles);
  const anim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isDark ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isDark, anim]);

  const thumbLeft = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [PAD, PAD + TRAVEL],
  });

  const onToggle = () => {
    setPreference(isDark ? "light" : "dark");
  };

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.85}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel="Dark mode"
      style={styles.hit}
    >
      <View
        style={[
          styles.track,
          {
            backgroundColor: isDark ? colors.primarySoft : colors.surfaceSecondary,
            borderColor: isDark ? colors.primaryMuted : colors.border,
          },
        ]}
      >
        <View style={styles.iconRow} pointerEvents="none">
          <MaterialIcons
            name="wb-sunny"
            size={13}
            color={isDark ? colors.textTertiary : colors.warningStrong || "#B45309"}
          />
          <MaterialIcons
            name="nights-stay"
            size={13}
            color={isDark ? colors.secondary : colors.textTertiary}
          />
        </View>
        <Animated.View
          style={[
            styles.thumb,
            {
              left: thumbLeft,
              backgroundColor: colors.surfacePrimary,
              ...Platform.select({
                ios: {
                  shadowColor: colors.shadow || "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.18,
                  shadowRadius: 1.5,
                },
                android: { elevation: 2 },
              }),
            },
          ]}
        >
          <MaterialIcons
            name={isDark ? "nights-stay" : "wb-sunny"}
            size={14}
            color={isDark ? colors.secondary : colors.warningStrong || "#B45309"}
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    hit: {
      height: 40,
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    track: {
      width: TRACK_W,
      height: TRACK_H,
      borderRadius: TRACK_H / 2,
      borderWidth: StyleSheet.hairlineWidth,
      justifyContent: "center",
      overflow: "hidden",
    },
    iconRow: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 7,
    },
    thumb: {
      position: "absolute",
      width: THUMB,
      height: THUMB,
      borderRadius: THUMB / 2,
      alignItems: "center",
      justifyContent: "center",
      top: (TRACK_H - THUMB) / 2,
    },
  });
}
