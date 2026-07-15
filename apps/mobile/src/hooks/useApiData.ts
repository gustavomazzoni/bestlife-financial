import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches on mount and every time the screen regains focus (e.g. after
 * confirming a transaction in Chat and tabbing back to Home/Reports).
 */
export function useApiData<T>(fetcher: () => Promise<T>): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then(result => {
        if (!cancelled) setData(result);
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
    error,
    refetch: () => setRefetchKey(k => k + 1),
  };
}
