/**
 * useApi Hook
 * Centralized data fetching with loading, error, and retry logic
 * 
 * Usage:
 * const { data, loading, error, retry } = useApi(
 *   () => fetchCustomers(),
 *   [customerId]
 * );
 * 
 * or with options:
 * const { data } = useApi(
 *   () => fetchCustomer(id),
 *   [id],
 *   { skipLoading: false, timeout: 5000 }
 * );
 */

import { useState, useEffect, useCallback } from 'react';

export interface ApiError {
  code: number;
  message: string;
  details?: any;
}

export interface UseApiOptions {
  skipOnMount?: boolean; // Don't fetch on mount
  timeout?: number; // Request timeout in ms (default: 10000)
  onSuccess?: (data: any) => void; // Callback on success
  onError?: (error: ApiError) => void; // Callback on error
}

export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  retry: () => void;
  refetch: () => void;
}

/**
 * Convert any error to ApiError format
 */
const normalizeError = (err: any): ApiError => {
  // Axios error
  if (err.response) {
    return {
      code: err.response.status,
      message: err.response.data?.message || err.message || 'An error occurred',
      details: err.response.data,
    };
  }

  // Network error
  if (err.message === 'Network Error' || !navigator.onLine) {
    return {
      code: 0,
      message: 'No internet connection',
    };
  }

  // Timeout
  if (err.code === 'ECONNABORTED') {
    return {
      code: 408,
      message: 'Request timeout',
    };
  }

  // Unknown error
  return {
    code: 500,
    message: err.message || 'Something went wrong',
    details: err,
  };
};

/**
 * Custom hook for API calls with loading and error states
 */
export const useApi = <T,>(
  apiCall?: (() => Promise<T>) | null,
  dependencies: any[] = [],
  options: UseApiOptions = {}
): UseApiReturn<T> & { executeApiCall: (fn: () => Promise<T>) => Promise<T> } => {
  const { skipOnMount = false, timeout = 10000, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skipOnMount);
  const [error, setError] = useState<ApiError | null>(null);

  /**
   * Execute API call with timeout
   */
  const executeApiCall = useCallback(async (fn?: () => Promise<T>): Promise<T> => {
    const callFn = fn || apiCall;
    if (!callFn) throw new Error('No API call provided');
    
    setLoading(true);
    setError(null);

    try {
      // Set up timeout
      const timeoutPromise = new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error('Request timeout')),
          timeout
        )
      );

      // Race between API call and timeout
      const result = await Promise.race([callFn(), timeoutPromise]);

      setData(result);
      setError(null);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const apiError = normalizeError(err);
      setError(apiError);
      onError?.(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [apiCall, timeout, onSuccess, onError]);

  /**
   * Fetch on mount or when dependencies change
   */
  useEffect(() => {
    if (!skipOnMount) {
      executeApiCall();
    }
  }, [...dependencies, executeApiCall]);

  /**
   * Retry function
   */
  const retry = useCallback(() => {
    executeApiCall();
  }, [executeApiCall]);

  /**
   * Refetch (reset and fetch again)
   */
  const refetch = useCallback(() => {
    setData(null);
    setError(null);
    executeApiCall();
  }, [executeApiCall]);

  return {
    data,
    loading,
    error,
    retry,
    refetch,
    executeApiCall,
  };
};

export default useApi;
