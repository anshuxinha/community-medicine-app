import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAppColors,
  getNavigationTheme,
  getPaperTheme,
} from "./theme";

const STORAGE_KEY = "@stroma/themePreference";

/** @typedef {'light' | 'dark' | 'system'} ThemePreference */
/** @typedef {'light' | 'dark'} ColorScheme */

const ThemeContext = createContext(null);

function resolveScheme(preference, systemScheme) {
  if (preference === "light" || preference === "dark") return preference;
  return systemScheme === "dark" ? "dark" : "light";
}

function safeSystemScheme() {
  try {
    return Appearance.getColorScheme() === "dark" ? "dark" : "light";
  } catch (_) {
    return "light";
  }
}

export function ThemeProvider({ children }) {
  // First paint always light until storage hydrates — avoids dark-first flashes
  // and reduces risk during OTA first-launch.
  const [preference, setPreferenceState] = useState(
    /** @type {ThemePreference} */ ("light"),
  );
  const [systemScheme, setSystemScheme] = useState(
    /** @type {ColorScheme} */ ("light"),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!cancelled) setSystemScheme(safeSystemScheme());

        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (stored === "light" || stored === "dark" || stored === "system") {
          setPreferenceState(stored);
        } else {
          // Product default: follow system once ready.
          setPreferenceState("system");
        }
      } catch (e) {
        console.warn("Failed to load theme preference:", e?.message);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let sub;
    try {
      sub = Appearance.addChangeListener(({ colorScheme }) => {
        setSystemScheme(colorScheme === "dark" ? "dark" : "light");
      });
    } catch (e) {
      console.warn("Appearance listener failed:", e?.message);
    }
    return () => {
      try {
        sub?.remove?.();
      } catch (_) {
        /* ignore */
      }
    };
  }, []);

  const setPreference = useCallback(async (next) => {
    if (next !== "light" && next !== "dark" && next !== "system") return;
    setPreferenceState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      console.warn("Failed to save theme preference:", e?.message);
    }
  }, []);

  const scheme = resolveScheme(preference, systemScheme);
  const colors = useMemo(() => getAppColors(scheme), [scheme]);
  const paperTheme = useMemo(() => getPaperTheme(scheme), [scheme]);
  const navigationTheme = useMemo(() => getNavigationTheme(scheme), [scheme]);

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      scheme,
      isDark: scheme === "dark",
      colors,
      paperTheme,
      navigationTheme,
      hydrated,
    }),
    [
      preference,
      setPreference,
      scheme,
      colors,
      paperTheme,
      navigationTheme,
      hydrated,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    const scheme = "light";
    return {
      preference: /** @type {ThemePreference} */ ("light"),
      setPreference: async () => {},
      scheme,
      isDark: false,
      colors: getAppColors(scheme),
      paperTheme: getPaperTheme(scheme),
      navigationTheme: getNavigationTheme(scheme),
      hydrated: true,
    };
  }
  return ctx;
}
