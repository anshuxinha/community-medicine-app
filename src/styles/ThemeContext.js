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

/** @typedef {'light' | 'dark'} ThemePreference */
/** @typedef {'light' | 'dark'} ColorScheme */

const ThemeContext = createContext(null);

/** One-shot OS scheme for migrating legacy "system" / unknown values only. */
function safeSystemScheme() {
  try {
    return Appearance.getColorScheme() === "dark" ? "dark" : "light";
  } catch (_) {
    return "light";
  }
}

/**
 * Normalize any stored value to light|dark so live users never crash or stick on "system".
 * - light/dark: keep
 * - "system" (legacy live preference): one-shot snapshot of current OS scheme, then pin
 * - null / missing / corrupt: default light (matches first paint)
 */
function normalizePreference(stored) {
  if (stored === "light" || stored === "dark") return stored;
  if (stored === "system") return safeSystemScheme();
  return "light";
}

export function ThemeProvider({ children }) {
  // First paint always light until storage hydrates — avoids dark-first flashes
  // and reduces risk during OTA first-launch.
  const [preference, setPreferenceState] = useState(
    /** @type {ThemePreference} */ ("light"),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;

        const next = normalizePreference(stored);
        setPreferenceState(next);

        // Rewrite storage when migrating off "system" / invalid values so future
        // loads never re-enter the legacy path.
        if (stored !== next) {
          try {
            await AsyncStorage.setItem(STORAGE_KEY, next);
          } catch (e) {
            console.warn("Failed to migrate theme preference:", e?.message);
          }
        }
      } catch (e) {
        console.warn("Failed to load theme preference:", e?.message);
        // Load failed — stay on light (initial state); do not throw.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback(async (next) => {
    if (next !== "light" && next !== "dark") return;
    setPreferenceState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      console.warn("Failed to save theme preference:", e?.message);
    }
  }, []);

  // Preference is always light|dark after hydration; scheme === preference.
  const scheme = preference;
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
