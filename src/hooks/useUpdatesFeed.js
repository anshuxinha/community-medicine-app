import { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  loadUpdatesMonths,
  monthsFromBundled,
  readCachedUpdatesMonths,
  subscribeUpdatesFeed,
} from "../services/updatesService";

/**
 * Load Updates feed (remote, then device cache, then bundled).
 * The startup scan can outlive the first paint. Subscribe so a late
 * Firestore result replaces the list without a second app open.
 */
export default function useUpdatesFeed() {
  const [months, setMonths] = useState(() => monthsFromBundled());
  const [source, setSource] = useState("bundled");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const didLoadRef = useRef(false);
  const requestRef = useRef(0);

  const applyResult = useCallback((result) => {
    if (!result?.months) return;
    setMonths(result.months);
    setSource(result.source);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => subscribeUpdatesFeed(applyResult), [applyResult]);

  const refresh = useCallback(async ({ silent = false, force = false } = {}) => {
    const requestId = ++requestRef.current;
    if (!silent) setLoading(true);
    setError(null);
    try {
      if (silent) {
        const cached = await readCachedUpdatesMonths();
        if (cached && requestId === requestRef.current) {
          setMonths(cached);
          setSource("cache");
        }
      }

      const result = await loadUpdatesMonths({ force });
      if (requestId !== requestRef.current) return;
      applyResult(result);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setError(err?.message || "Failed to load updates");
      setMonths(monthsFromBundled());
      setSource("bundled");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [applyResult]);

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
        refresh({ silent: true, force: true });
      });
      return () => handle.cancel();
    }, [refresh]),
  );

  return { months, source, loading, error, refresh };
}
