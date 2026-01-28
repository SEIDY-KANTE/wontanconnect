/**
 * API Client
 *
 * Axios-based HTTP client with:
 * - Automatic token attachment
 * - Token refresh on 401
 * - Request/response logging
 * - Centralized error handling
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { REQUEST_TIMEOUT, API_URLS } from "./config";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearAllAuthData,
} from "./storage";
import { AUTH_ENDPOINTS } from "./endpoints";
import type { ApiResponse, ApiError, RefreshResponse } from "./types";

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Custom API error with structured information.
 */
export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;
  isNetworkError: boolean;
  isAuthError: boolean;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.isNetworkError = code === "NETWORK_ERROR";
    this.isAuthError = status === 401 || status === 403;
  }
}

// ============================================================================
// CLIENT CONFIGURATION
// ============================================================================

/**
 * Determine the best base URL for the current platform.
 * For Expo Go on physical devices, always use localNetwork URL.
 */
function getBaseUrl(): string {
  if (!__DEV__) {
    return API_URLS.production;
  }

  // In development, always use localNetwork for physical devices (Expo Go)
  // This requires setting LOCAL_IP in config.ts to your computer's IP
  return API_URLS.localNetwork;
}

/**
 * Flag to prevent multiple simultaneous refresh attempts.
 */
let isRefreshing = false;

/**
 * Queue of requests waiting for token refresh.
 */
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Subscribe to token refresh completion.
 */
function subscribeToRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers that refresh is complete.
 */
function onRefreshComplete(token: string): void {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

/**
 * Create and configure the Axios instance.
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getBaseUrl(),
    timeout: REQUEST_TIMEOUT,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // ---------------------------------------------------------------------------
  // REQUEST INTERCEPTOR
  // ---------------------------------------------------------------------------

  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const url = config.url || "";

      // Log outgoing requests in dev
      if (__DEV__) {
        console.log(`[API] → ${config.method?.toUpperCase()} ${url}`);
      }

      // Skip auth header for public endpoints
      const publicEndpoints = [
        AUTH_ENDPOINTS.LOGIN,
        AUTH_ENDPOINTS.REGISTER,
        AUTH_ENDPOINTS.GUEST,
        AUTH_ENDPOINTS.REFRESH,
        AUTH_ENDPOINTS.FORGOT_PASSWORD,
        AUTH_ENDPOINTS.RESET_PASSWORD,
        AUTH_ENDPOINTS.VERIFY_EMAIL,
      ];

      if (publicEndpoints.some((endpoint) => url.includes(endpoint))) {
        return config;
      }

      // Attach access token if available
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      console.error("[API] Request interceptor error:", error);
      return Promise.reject(error);
    },
  );

  // ---------------------------------------------------------------------------
  // RESPONSE INTERCEPTOR
  // ---------------------------------------------------------------------------

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful responses in dev
      if (__DEV__) {
        console.log(
          `[API] ← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
        );
      }
      return response;
    },
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Network error handling
      if (!error.response) {
        console.error("[API] Network error:", error.message);
        throw new ApiClientError(
          "Unable to connect to server. Please check your internet connection.",
          "NETWORK_ERROR",
          0,
        );
      }

      const { status, data } = error.response;

      // Log error responses in dev
      if (__DEV__) {
        console.error(
          `[API] ← ${status} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`,
          data,
        );
      }

      // Handle 401 Unauthorized - attempt token refresh
      if (status === 401 && !originalRequest._retry) {
        // Don't retry refresh endpoint
        if (originalRequest.url?.includes(AUTH_ENDPOINTS.REFRESH)) {
          await clearAllAuthData();
          throw new ApiClientError(
            "Session expired. Please log in again.",
            "SESSION_EXPIRED",
            401,
          );
        }

        originalRequest._retry = true;

        // If already refreshing, wait for it to complete
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeToRefresh((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(client(originalRequest));
            });
          });
        }

        isRefreshing = true;

        try {
          const refreshToken = await getRefreshToken();

          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          // Call refresh endpoint
          const refreshResponse = await axios.post<
            ApiResponse<RefreshResponse>
          >(
            `${getBaseUrl()}${AUTH_ENDPOINTS.REFRESH}`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" } },
          );

          const newTokens = refreshResponse.data.data.tokens;
          await saveTokens(newTokens);

          console.log("[API] Token refreshed successfully");

          // Notify subscribers and retry original request
          onRefreshComplete(newTokens.accessToken);
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;

          return client(originalRequest);
        } catch (refreshError) {
          console.error("[API] Token refresh failed:", refreshError);
          await clearAllAuthData();
          // Clear subscribers on failure
          refreshSubscribers = [];
          throw new ApiClientError(
            "Session expired. Please log in again.",
            "SESSION_EXPIRED",
            401,
          );
        } finally {
          isRefreshing = false;
        }
      }

      // Format other errors
      const errorCode = data?.error?.code || "UNKNOWN_ERROR";
      const errorMessage =
        data?.error?.message || "An unexpected error occurred";
      const errorDetails = data?.error?.details;

      throw new ApiClientError(errorMessage, errorCode, status, errorDetails);
    },
  );

  return client;
}

// ============================================================================
// EXPORTED CLIENT
// ============================================================================

/**
 * The configured API client instance.
 */
export const apiClient = createApiClient();

/**
 * Update the base URL (useful for switching environments).
 */
export function setBaseUrl(url: string): void {
  apiClient.defaults.baseURL = url;
  console.log("[API] Base URL updated to:", url);
}

/**
 * Get the current base URL.
 */
export function getCurrentBaseUrl(): string {
  return apiClient.defaults.baseURL || getBaseUrl();
}
