import { useCallback, useRef, useState } from "react";
import { InteractionManager } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  loadUpdatesMonths,
  monthsFromBundled,
  readCachedUpdatesMonths,
} from "../services/updatesService";

/**
 * Load Updates feed (remote → cache → bundled).
 * First visit waits for the resolved feed so the Dashboard list does not
 * paint bundled items and then jump when the remote item arrives.
 */
export default function useUpdatesFeed() {
  const [months, setMonths] = useState(() => monthsFromBundled());
  const [source, setSource] = useState("bundled");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const didLoadRef = useRef(false);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      if (silent) {
        const cached = await readCachedUpdatesMonths();
        if (cached) {
          setMonths(cached);
          setSource("cache");
        }
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
      if (!didLoadRef.current) {
        let cancelled = false;
        refresh().then(() => {
          if (!cancelled) didLoadRef.current = true;
        });
        return () => {
          cancelled = true;
        };
      }

      const handle = InteractionManager.runAfterInteractions(() => {
        refresh({ silent: true });
      });
      return () => handle.cancel();
    }, [refresh]),
  );

  return { months, source, loading, error, refresh };
}
