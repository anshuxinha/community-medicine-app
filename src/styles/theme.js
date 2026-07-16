import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
} from "@react-navigation/native";
import { useWindowDimensions } from "react-native";
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

/** @typedef {'light' | 'dark'} ColorScheme */

/** Light palette — matches pre-dark-mode product look + extra semantic tokens. */
export const lightColors = {
  primary: "#6B21A8",
  primaryLight: "#EDE9FE",
  primarySoft: "#F3E8FF",
  primaryMuted: "#DDD6FE",
  primaryDark: "#581C87",
  secondary: "#8A2BE2",
  accent: "#581C87",
  buttonText: "#FFFFFF",
  onPrimary: "#FFFFFF",

  backgroundMain: "#FBFCFE",
  surfacePrimary: "#FFFFFF",
  surfaceSecondary: "#F3F4F6",
  surfaceTertiary: "#F9FAFB",
  surfaceMuted: "#F8FAFC",

  border: "#E5E7EB",
  borderStrong: "#D1D5DB",
  divider: "#E5E7EB",
  overlay: "rgba(0,0,0,0.5)",
  shadow: "#000000",

  inverseSurface: "#1F2937",
  onInverseSurface: "#FFFFFF",

  success: "#4CAF50",
  successStrong: "#15803D",
  successSoft: "#DCFCE7",
  warning: "#F59E0B",
  warningBackground: "#FFFBEB",
  warningText: "#92400E",
  warningStrong: "#B45309",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  errorStrong: "#B91C1C",

  textTitle: "#111827",
  textPrimary: "#1F2937",
  textBody: "#374151",
  textSecondary: "#4B5563",
  textTertiary: "#6B7280",
  textPlaceholder: "#9CA3AF",

  chartBlue: "#3B82F6",
  chartGreen: "#10B981",
  chartPurple: "#8B5CF6",

  highlightBorder: "#D4A853",
  highlightBg: "#FDFAF3",
  userHighlightBg: "#FEF9C3",
  userHighlightSentence: "#FEF08A",
};

/** Dark palette — same keys as lightColors. */
export const darkColors = {
  primary: "#A855F7",
  primaryLight: "#2E1065",
  primarySoft: "#3B0764",
  primaryMuted: "#5B21B6",
  primaryDark: "#C084FC",
  secondary: "#A855F7",
  accent: "#C084FC",
  buttonText: "#FFFFFF",
  onPrimary: "#FFFFFF",

  backgroundMain: "#0F0F12",
  surfacePrimary: "#1A1A22",
  surfaceSecondary: "#24242E",
  surfaceTertiary: "#2A2A36",
  surfaceMuted: "#16161C",

  border: "#3F3F4A",
  borderStrong: "#52525B",
  divider: "#3F3F4A",
  overlay: "rgba(0,0,0,0.65)",
  shadow: "#000000",

  inverseSurface: "#111827",
  onInverseSurface: "#F9FAFB",

  success: "#4ADE80",
  successStrong: "#86EFAC",
  successSoft: "#14532D",
  warning: "#FBBF24",
  warningBackground: "#422006",
  warningText: "#FDE68A",
  warningStrong: "#FCD34D",
  error: "#F87171",
  errorLight: "#450A0A",
  errorStrong: "#FCA5A5",

  textTitle: "#F9FAFB",
  textPrimary: "#F3F4F6",
  textBody: "#E5E7EB",
  textSecondary: "#D1D5DB",
  textTertiary: "#9CA3AF",
  textPlaceholder: "#6B7280",

  chartBlue: "#60A5FA",
  chartGreen: "#34D399",
  chartPurple: "#A78BFA",

  highlightBorder: "#D4A853",
  highlightBg: "#2A2310",
  userHighlightBg: "#3F3A12",
  userHighlightSentence: "#4A4418",
};

/** @param {ColorScheme} [scheme] */
export function getAppColors(scheme = "light") {
  return scheme === "dark" ? darkColors : lightColors;
}

/** @param {ColorScheme} [scheme] */
export function getPaperTheme(scheme = "light") {
  const colors = getAppColors(scheme);
  const base = scheme === "dark" ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    dark: scheme === "dark",
    roundness: 12,
    colors: {
      ...base.colors,
      primary: colors.secondary,
      onPrimary: colors.onPrimary,
      secondary: colors.secondary,
      onSecondary: colors.onPrimary,
      secondaryContainer: colors.secondary,
      onSecondaryContainer: colors.onPrimary,
      background: colors.backgroundMain,
      surface: colors.surfacePrimary,
      onSurface: colors.textTitle,
      outline: colors.borderStrong,
      error: colors.error,
      onError: colors.onPrimary,
    },
  };
}

/** @param {ColorScheme} [scheme] */
export function getNavigationTheme(scheme = "light") {
  const colors = getAppColors(scheme);
  const base = scheme === "dark" ? NavDarkTheme : NavDefaultTheme;
  return {
    ...base,
    dark: scheme === "dark",
    colors: {
      ...base.colors,
      primary: colors.secondary,
      background: colors.backgroundMain,
      card: colors.surfacePrimary,
      text: colors.textTitle,
      border: colors.border,
      notification: colors.secondary,
    },
  };
}

// Legacy static export (always light) for module-level StyleSheets during migration.
export const theme = {
  colors: lightColors,
};

export const paperTheme = getPaperTheme("light");
