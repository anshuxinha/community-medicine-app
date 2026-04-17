import { MD3LightTheme } from "react-native-paper";
import { useWindowDimensions, Platform } from "react-native";
import { useMemo } from "react";

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const isTablet = width >= 600;
    const isLandscape = width > height;
    const contentMaxWidth = isTablet ? Math.min(width * 0.7, 680) : width;
    const horizontalPadding = isTablet ? Math.min(width * 0.08, 32) : 20;
    const cardColumns = isTablet ? (isLandscape ? 3 : 2) : 1;
    const scaleFactor = isTablet ? Math.min(width / 400, 1.25) : 1;
    return {
      isTablet,
      isLandscape,
      width,
      height,
      contentMaxWidth,
      horizontalPadding,
      cardColumns,
      scaleFactor,
      fontScale: Math.min(scaleFactor, 1.1),
    };
  }, [width, height]);
};

const appColors = {
  // Primary brand/accents
  primary: "#6B21A8",
  primaryLight: "#EDE9FE",
  primaryDark: "#581C87",
  secondary: "#8A2BE2",
  accent: "#D97706",
  buttonText: "#FFFFFF",

  // Backgrounds
  backgroundMain: "#FBFCFE",
  surfacePrimary: "#FFFFFF",
  surfaceSecondary: "#F3F4F6",
  surfaceTertiary: "#F9FAFB",

  // Status / Indicator
  success: "#4CAF50",
  warning: "#F59E0B",
  warningBackground: "#FFFBEB",
  warningText: "#92400E",
  error: "#EF4444",
  errorLight: "#FEE2E2",

  // Text & Typography
  textTitle: "#111827",
  textPrimary: "#1F2937",
  // Contrast compliant replacements:
  textSecondary: "#4B5563",
  textTertiary: "#6B7280",
  textPlaceholder: "#9CA3AF",

  // Specific charts/elements colors mapped
  chartBlue: "#3B82F6",
  chartGreen: "#10B981",
  chartPurple: "#8B5CF6",
};

export const theme = {
  colors: appColors,
};

// Global Paper theme so contained buttons default to white text app-wide.
export const paperTheme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: appColors.secondary,
    onPrimary: appColors.buttonText,
    secondary: appColors.secondary,
    onSecondary: appColors.buttonText,
    secondaryContainer: appColors.secondary,
    onSecondaryContainer: appColors.buttonText,
    background: appColors.backgroundMain,
    surface: appColors.surfacePrimary,
    onSurface: appColors.textTitle,
    outline: "#D1D5DB",
  },
};
