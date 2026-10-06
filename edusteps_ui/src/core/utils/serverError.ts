// Server error handling utilities
export interface ServerErrorInfo {
  isServerError: boolean;
  isRetryable: boolean;
  userMessage: string;
  shouldRefresh: boolean;
  retryAfter?: number;
}

export const analyzeServerError = (error: any): ServerErrorInfo => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  
  // Default error info
  const errorInfo: ServerErrorInfo = {
    isServerError: false,
    isRetryable: false,
    userMessage: 'An unexpected error occurred',
    shouldRefresh: false,
  };

  // Handle different error types
  if (status >= 500) {
    errorInfo.isServerError = true;
    errorInfo.shouldRefresh = true;
    errorInfo.retryAfter = 3000; // 3 seconds
    
    // Check if it's a persistent server error (after retries)
    if (error?.attemptCount >= 2) {
      errorInfo.isRetryable = false;
      errorInfo.userMessage = 'Server is experiencing issues. The item may still exist. Please refresh the page to check the current status.';
      errorInfo.retryAfter = 5000; // 5 seconds for refresh
    } else {
      errorInfo.isRetryable = true;
      if (status === 500) {
        errorInfo.userMessage = 'Server error occurred. Retrying...';
      } else if (status === 502 || status === 503) {
        errorInfo.userMessage = 'Service temporarily unavailable. Retrying...';
        errorInfo.retryAfter = 5000; // 5 seconds
      } else if (status === 504) {
        errorInfo.userMessage = 'Request timed out. Retrying...';
      }
    }
  } else if (status === 404) {
    errorInfo.userMessage = 'Item not found. It may have already been deleted.';
    errorInfo.shouldRefresh = true;
  } else if (status === 403) {
    errorInfo.userMessage = 'You do not have permission to perform this action.';
  } else if (status === 401) {
    errorInfo.userMessage = 'Authentication required. Please log in again.';
  } else if (status >= 400 && status < 500) {
    errorInfo.userMessage = data?.message || data?.error || 'Invalid request. Please check your input.';
  } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    errorInfo.userMessage = 'Network error. Please check your connection and try again.';
    errorInfo.isRetryable = true;
    errorInfo.retryAfter = 3000;
  }

  return errorInfo;
};

export const createRetryableOperation = <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
) => {
  return async (retryCount: number = 0): Promise<T> => {
    try {
      return await operation();
    } catch (error: any) {
      // Add attempt count to error for better analysis
      error.attemptCount = retryCount + 1;
      
      const errorInfo = analyzeServerError(error);
      
      if (errorInfo.isRetryable && retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
        if (import.meta.env?.DEV) {
          console.log(`Retrying operation in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return createRetryableOperation(operation, maxRetries, baseDelay)(retryCount + 1);
      }
      
      throw { ...error, errorInfo };
    }
  };
};