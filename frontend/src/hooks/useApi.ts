import { useState, useEffect } from 'react';

interface UseApiOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useApi<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList = [],
  options?: UseApiOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fn();
        if (!cancelled) {
          setData(result);
          options?.onSuccess?.();
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error('Unknown error');
          setError(error);
          options?.onError?.(error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error };
}

export function useMutation<T, P = void>(
  fn: (payload: P) => Promise<T>,
  options?: UseApiOptions
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async (payload: P) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fn(payload);
      options?.onSuccess?.();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}
