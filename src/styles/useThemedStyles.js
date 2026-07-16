import { useMemo } from "react";
import { useAppTheme } from "./ThemeContext";

/**
 * Build StyleSheet from a factory that receives the active color tokens.
 * Also returns `colors` for inline style/icon props.
 *
 * @param {(colors: Record<string, string>) => object} createStyles
 */
export function useThemedStyles(createStyles) {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme.colors),
    [theme.colors, createStyles],
  );
  return { styles, colors: theme.colors, isDark: theme.isDark, scheme: theme.scheme };
}
