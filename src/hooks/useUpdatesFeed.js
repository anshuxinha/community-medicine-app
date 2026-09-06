import { useCallback, useState } from "react";
import { InteractionManager } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  loadUpdatesMonths,
  monthsFromBundled,
  readCachedUpdatesMonths,
} from "../services/updatesService";

/**
 * Load Updates feed (remote → cache → bundled). Refreshes on focus
 * after interactions so Dashboard first paint stays on bundled/cache.
 */
export default function useUpdatesFeed() {
  const [months, setMonths] = useState(() => monthsFromBundled());
  const [source, setSource] = useState("bundled");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Paint cache immediately if available
      const cached = await readCachedUpdatesMonths();
      if (cached) {
        setMonths(cached);
        setSource("cache");
      }

      const result = await loadUpdatesMonths();
      setMonths(result.months);
      setSource(result.source);
    } catch (err) {
      setError(err?.message || "Failed to load updates");
      setMonths(monthsFromBundled());
      setSource("bundled");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const handle = InteractionManager.runAfterInteractions(() => {
        refresh();
      });
      return () => handle.cancel();
    }, [refresh]),
  );

  return { months, source, loading, error, refresh };
}
