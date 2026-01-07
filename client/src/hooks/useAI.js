import { useState, useCallback, useRef } from "react";
import { api } from "../api/client";

// Timeout threshold for "taking longer than usual" message
const SLOW_THRESHOLD_MS = 5000;
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Custom hook for AI requests with loading states, error handling, retry, and timeout indicators
 */
export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSlow, setIsSlow] = useState(false);
  const abortControllerRef = useRef(null);
  const slowTimerRef = useRef(null);

  const clearTimers = () => {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
  };

  const request = useCallback(async (path, payload = {}) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);
    setIsSlow(false);
    clearTimers();

    // Start slow timer
    slowTimerRef.current = setTimeout(() => {
      setIsSlow(true);
    }, SLOW_THRESHOLD_MS);

    try {
      const response = await api.post(
        "/ai/proxy",
        {
          path,
          payload,
        },
        {
          signal: abortControllerRef.current.signal,
          timeout: REQUEST_TIMEOUT_MS,
        }
      );

      clearTimers();
      setLoading(false);
      setIsSlow(false);

      // Check for parse errors in response
      if (response.data?.parsed?.parse_error) {
        // Parse error detected
      }

      return {
        success: true,
        data: response.data,
        parsed: response.data?.parsed || response.data,
      };
    } catch (err) {
      clearTimers();
      setLoading(false);
      setIsSlow(false);

      // Handle different error types
      const errorInfo = parseError(err);
      setError(errorInfo);

      return {
        success: false,
        error: errorInfo,
      };
    }
  }, []);

  const retry = useCallback(
    (path, payload) => {
      setError(null);
      return request(path, payload);
    },
    [request]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearTimers();
    setLoading(false);
    setIsSlow(false);
  }, []);

  return {
    loading,
    error,
    isSlow,
    request,
    retry,
    cancel,
    clearError: () => setError(null),
  };
}

/**
 * Parse error response into user-friendly format
 */
function parseError(err) {
  // Network error / no response
  if (!err.response) {
    if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
      return {
        type: "TIMEOUT",
        message:
          "Request timed out. The AI service is taking too long to respond.",
        retry: true,
      };
    }
    if (err.name === "AbortError" || err.code === "ERR_CANCELED") {
      return {
        type: "CANCELLED",
        message: "Request was cancelled.",
        retry: false,
      };
    }
    return {
      type: "NETWORK_ERROR",
      message: "Unable to connect to AI service. Please check your connection.",
      retry: true,
    };
  }

  // Server responded with error
  const data = err.response?.data;

  if (data?.error_type) {
    return {
      type: data.error_type,
      message: data.error || "An error occurred with the AI service.",
      retry: data.retry !== false,
      retryAfter: data.retry_after,
    };
  }

  // Generic server error
  const status = err.response?.status;
  if (status === 503) {
    return {
      type: "SERVICE_UNAVAILABLE",
      message: "AI service is temporarily unavailable. Please try again later.",
      retry: true,
    };
  }
  if (status === 500) {
    return {
      type: "SERVER_ERROR",
      message: "An internal error occurred. Please try again.",
      retry: true,
    };
  }

  return {
    type: "UNKNOWN",
    message: data?.error || err.message || "An unexpected error occurred.",
    retry: true,
  };
}

/**
 * Error type to user-friendly message mapping
 */
export const ERROR_MESSAGES = {
  INVALID_API_KEY: "AI service configuration error. Please contact support.",
  QUOTA_EXCEEDED: "AI usage limit reached. Please try again later.",
  RATE_LIMITED: "Too many requests. Please wait a moment.",
  SERVICE_UNAVAILABLE: "AI service is temporarily unavailable.",
  CIRCUIT_OPEN: "AI service is recovering from errors. Please wait.",
  TIMEOUT: "Request timed out. Please try again.",
  NETWORK_ERROR: "Connection error. Check your internet.",
  UNKNOWN: "Something went wrong. Please try again.",
};

export default useAI;
