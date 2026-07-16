import { useMemo } from "react";
import { useAppTheme } from "./ThemeContext";

/**
 * @param {(colors: Record<string, string>) => object} createStyles
 */
export function useThemedStyles(createStyles) {
  const { colors, isDark, scheme } = useAppTheme();
  const styles = useMemo(
    () => createStyles(colors),
    // createStyles is a stable module-level function
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colors],
  );
  return { styles, colors, isDark, scheme };
}
