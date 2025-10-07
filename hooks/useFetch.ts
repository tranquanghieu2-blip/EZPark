import { useCallback, useEffect, useState } from "react";

const useFetch = <T,>(
  fetchFunction: (() => Promise<T>) | null,
  autoFetch = true,
  deps: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // fetchData memoized theo fetchFunction
  const fetchData = useCallback(async () => {
    if (!fetchFunction) return;
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  // Khi autoFetch=true thì chạy fetchData khi fetchData hoặc deps thay đổi
  useEffect(() => {
    if (autoFetch && fetchFunction) {
      fetchData();
    }
  }, [autoFetch, fetchFunction, fetchData, ...deps]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    reset,
  };
};

export default useFetch;
