import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

interface UseApiDataResult<T> {
  data: T | null;
  /** True only until the very first load (success or failure) completes. */
  loading: boolean;
  /** True while a subsequent reload (focus refetch or manual refetch) is in flight. */
  refreshing: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches on mount and every time the screen regains focus (e.g. after
 * confirming a transaction in Chat and tabbing back to Home/Reports). Only
 * the first load shows `loading` — later reloads surface as `refreshing`
 * instead, so screens can keep their existing content visible (optionally
 * behind a pull-to-refresh spinner) rather than tearing down into a
 * full-screen loading state on every tab focus.
 */
export function useApiData<T>(fetcher: () => Promise<T>): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);
  const hasLoadedOnce = useRef(false);

  // Callers pass a fresh `fetcher` closure every render (e.g. one that
  // captures a date range derived from component state), but `load` below
  // is only recreated when `refetchKey` changes — so it reads the fetcher
  // through this ref, kept current every render, instead of closing over
  // whatever `fetcher` happened to be at the last refetchKey change.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(() => {
    let cancelled = false;
    if (hasLoadedOnce.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    fetcherRef.current()
      .then(result => {
        if (!cancelled) setData(result);
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar');
        }
      })
      .finally(() => {
        if (!cancelled) {
          hasLoadedOnce.current = true;
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchKey]);

  useFocusEffect(
    useCallback(() => {
      return load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load])
  );

  return {
    data,
    loading,
    refreshing,
    error,
    refetch: () => setRefetchKey(k => k + 1),
  };
}
