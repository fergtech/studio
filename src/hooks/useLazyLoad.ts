import { useEffect, useState } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

interface UseLazyLoadReturn<T> {
  ref: React.RefObject<HTMLDivElement>;
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLazyLoad<T>(
  fetchFunction: () => Promise<T>,
  options: UseLazyLoadOptions = {}
): UseLazyLoadReturn<T> {
  const { threshold = 0.1, rootMargin = '50px', enabled = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { ref, hasBeenVisible } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  const fetchData = async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasBeenVisible && enabled) {
      fetchData();
    }
  }, [hasBeenVisible, enabled]);

  return {
    ref,
    data,
    loading,
    error,
    refetch: fetchData,
  };
}