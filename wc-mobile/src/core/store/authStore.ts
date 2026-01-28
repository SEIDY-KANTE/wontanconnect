/**
 * Auth Store (Zustand)
 *
 * Centralized authentication state management with API integration.
 * Handles login, register, logout, and token refresh.
 */

import { create } from "zustand";
import { Platform } from "react-native";
import * as Application from "expo-application";
import {
  login as apiLogin,
  register as apiRegister,
  loginAsGuest as apiLoginAsGuest,
  logout as apiLogout,
  getMe as apiGetMe,
  refreshToken as apiRefreshToken,
  ApiClientError,
  getAccessToken,
  getRefreshToken,
  getUserData,
  clearAllAuthData,
  isTokenExpired,
  USE_API,
} from "@/api";
import type { AuthUser, LoginRequest, RegisterRequest } from "@/api";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Auth loading states for granular UI feedback.
 */
export type AuthLoadingState =
  | "idle"
  | "initializing"
  | "logging_in"
  | "registering"
  | "logging_out"
  | "refreshing";

/**
 * Auth error with user-friendly message.
 */
export interface AuthError {
  code: string;
  message: string;
}

/**
 * Auth store state and actions.
 */
export interface AuthState {
  // State
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  loadingState: AuthLoadingState;
  error: AuthError | null;

  // Computed
  isLoading: boolean;
  isGuest: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<boolean>;
  loginAsGuest: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshTokenIfNeeded: () => Promise<boolean>;
  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
}

// ============================================================================
// ERROR MAPPING
// ============================================================================

/**
 * Map API error codes to user-friendly messages.
 */
function mapErrorToMessage(error: unknown): AuthError {
  if (error instanceof ApiClientError) {
    const errorMap: Record<string, string> = {
      INVALID_CREDENTIALS: "Email or password is incorrect",
      USER_NOT_FOUND: "No account found with this email",
      EMAIL_ALREADY_EXISTS: "An account with this email already exists",
      VALIDATION_ERROR: "Please check your input and try again",
      NETWORK_ERROR: "Unable to connect. Please check your internet connection",
      SESSION_EXPIRED: "Your session has expired. Please log in again",
      RATE_LIMIT_EXCEEDED: "Too many attempts. Please try again later",
    };

    return {
      code: error.code,
      message: errorMap[error.code] || error.message,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred. Please try again.",
  };
}

// ============================================================================
// STORE
// ============================================================================

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  loadingState: "idle",
  error: null,

  // Computed properties - these are evaluated each time the store is accessed
  get isLoading() {
    return get().loadingState !== "idle";
  },
  get isGuest() {
    const user = get().user;
    return user?.isGuest === true;
  },

  // ---------------------------------------------------------------------------
  // INITIALIZE
  // ---------------------------------------------------------------------------

  /**
   * Initialize auth state from storage on app start.
   * Checks for existing tokens and validates them.
   */
  initialize: async () => {
    const { isInitialized } = get();
    if (isInitialized) return;

    set({ loadingState: "initializing" });
    console.log("[AuthStore] Initializing...");

    try {
      // Check for existing tokens
      const accessToken = await getAccessToken();
      const refreshTokenValue = await getRefreshToken();
      const cachedUser = await getUserData();

      if (!accessToken || !refreshTokenValue) {
        console.log("[AuthStore] No tokens found, user not authenticated");
        set({
          isInitialized: true,
          isAuthenticated: false,
          loadingState: "idle",
        });
        return;
      }

      // Check if token is expired
      const expired = await isTokenExpired();

      if (expired) {
        console.log("[AuthStore] Token expired, attempting refresh");

        if (!USE_API) {
          // In mock mode, just use cached user
          if (cachedUser) {
            set({
              user: cachedUser,
              isAuthenticated: true,
              isInitialized: true,
              loadingState: "idle",
            });
            return;
          }
        }

        try {
          await apiRefreshToken();
          // Fetch fresh user data
          const user = await apiGetMe();
          set({
            user,
            isAuthenticated: true,
            isInitialized: true,
            loadingState: "idle",
          });
          console.log("[AuthStore] Token refreshed, user authenticated");
        } catch (refreshError) {
          console.log("[AuthStore] Token refresh failed, clearing auth");
          await clearAllAuthData();
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            loadingState: "idle",
          });
        }
      } else {
        // Token is valid, use cached user or fetch fresh
        if (cachedUser) {
          set({
            user: cachedUser,
            isAuthenticated: true,
            isInitialized: true,
            loadingState: "idle",
          });
          console.log("[AuthStore] Using cached user:", cachedUser.id);

          // Fetch fresh user data in background
          if (USE_API) {
            apiGetMe()
              .then((user) => set({ user }))
              .catch((err) =>
                console.warn("[AuthStore] Background user fetch failed:", err),
              );
          }
        } else if (USE_API) {
          // No cached user, fetch from API
          try {
            const user = await apiGetMe();
            set({
              user,
              isAuthenticated: true,
              isInitialized: true,
              loadingState: "idle",
            });
          } catch {
            await clearAllAuthData();
            set({
              user: null,
              isAuthenticated: false,
              isInitialized: true,
              loadingState: "idle",
            });
          }
        }
      }
    } catch (error) {
      console.error("[AuthStore] Initialization error:", error);
      set({
        isInitialized: true,
        isAuthenticated: false,
        loadingState: "idle",
        error: mapErrorToMessage(error),
      });
    }
  },

  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------

  /**
   * Login with email and password.
   */
  login: async (email: string, password: string): Promise<boolean> => {
    set({ loadingState: "logging_in", error: null });
    console.log("[AuthStore] Logging in:", email);

    try {
      if (!USE_API) {
        // Mock mode - simulate successful login
        await new Promise((resolve) => setTimeout(resolve, 500));
        const mockUser: AuthUser = {
          id: "mock-user-1",
          email,
          isGuest: false,
          emailVerified: true,
          role: "user",
          profile: {
            displayName: "Mock User",
            avatarUrl: null,
            bio: null,
            preferredCurrency: "EUR",
            language: "en",
            locationCity: "Istanbul",
            locationCountry: "TR",
          },
          trust: {
            score: 85,
            level: "VERIFIED",
            totalExchanges: 10,
            averageRating: 4.5,
          },
          createdAt: new Date().toISOString(),
        };
        set({
          user: mockUser,
          isAuthenticated: true,
          loadingState: "idle",
        });
        console.log("[AuthStore] Mock login successful");
        return true;
      }

      const { user } = await apiLogin({ email, password } as LoginRequest);

      set({
        user,
        isAuthenticated: true,
        loadingState: "idle",
      });

      console.log("[AuthStore] Login successful:", user.id);
      return true;
    } catch (error) {
      console.error("[AuthStore] Login failed:", error);
      set({
        loadingState: "idle",
        error: mapErrorToMessage(error),
      });
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // REGISTER
  // ---------------------------------------------------------------------------

  /**
   * Register a new account.
   */
  register: async (
    email: string,
    password: string,
    displayName: string,
  ): Promise<boolean> => {
    set({ loadingState: "registering", error: null });
    console.log("[AuthStore] Registering:", email);

    try {
      if (!USE_API) {
        // Mock mode - simulate successful registration
        await new Promise((resolve) => setTimeout(resolve, 500));
        const mockUser: AuthUser = {
          id: "mock-user-" + Date.now(),
          email,
          isGuest: false,
          emailVerified: false,
          role: "user",
          profile: {
            displayName,
            avatarUrl: null,
            bio: null,
            preferredCurrency: "EUR",
            language: "en",
            locationCity: null,
            locationCountry: null,
          },
          trust: {
            score: 0,
            level: "NEW",
            totalExchanges: 0,
            averageRating: 0,
          },
          createdAt: new Date().toISOString(),
        };
        set({
          user: mockUser,
          isAuthenticated: true,
          loadingState: "idle",
        });
        console.log("[AuthStore] Mock registration successful");
        return true;
      }

      const { user } = await apiRegister({
        email,
        password,
        displayName,
      } as RegisterRequest);

      set({
        user,
        isAuthenticated: true,
        loadingState: "idle",
      });

      console.log("[AuthStore] Registration successful:", user.id);
      return true;
    } catch (error) {
      console.error("[AuthStore] Registration failed:", error);
      set({
        loadingState: "idle",
        error: mapErrorToMessage(error),
      });
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // GUEST LOGIN
  // ---------------------------------------------------------------------------

  /**
   * Login as a guest user.
   */
  loginAsGuest: async (): Promise<boolean> => {
    set({ loadingState: "logging_in", error: null });
    console.log("[AuthStore] Creating guest session");

    try {
      // Generate a unique device ID
      let deviceId: string;
      if (Platform.OS === "ios") {
        deviceId =
          (await Application.getIosIdForVendorAsync()) || `ios-${Date.now()}`;
      } else if (Platform.OS === "android") {
        deviceId = Application.getAndroidId() || `android-${Date.now()}`;
      } else {
        deviceId = `web-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      }

      if (!USE_API) {
        // Mock mode - simulate successful guest login
        await new Promise((resolve) => setTimeout(resolve, 500));
        const mockUser: AuthUser = {
          id: "mock-guest-" + Date.now(),
          email: null,
          isGuest: true,
          emailVerified: false,
          role: "user",
          profile: {
            displayName: "Guest User",
            avatarUrl: null,
            bio: null,
            preferredCurrency: "EUR",
            language: "en",
            locationCity: null,
            locationCountry: null,
          },
          trust: null,
          createdAt: new Date().toISOString(),
        };
        set({
          user: mockUser,
          isAuthenticated: true,
          loadingState: "idle",
        });
        console.log("[AuthStore] Mock guest login successful");
        return true;
      }

      const { user } = await apiLoginAsGuest(deviceId);

      set({
        user,
        isAuthenticated: true,
        loadingState: "idle",
      });

      console.log("[AuthStore] Guest login successful:", user.id);
      return true;
    } catch (error) {
      console.error("[AuthStore] Guest login failed:", error);
      set({
        loadingState: "idle",
        error: mapErrorToMessage(error),
      });
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------------------------

  /**
   * Logout the current user.
   */
  logout: async () => {
    set({ loadingState: "logging_out", error: null });
    console.log("[AuthStore] Logging out");

    try {
      if (USE_API) {
        await apiLogout();
      } else {
        await clearAllAuthData();
      }

      set({
        user: null,
        isAuthenticated: false,
        loadingState: "idle",
      });

      console.log("[AuthStore] Logout successful");
    } catch (error) {
      console.error("[AuthStore] Logout error:", error);
      // Still clear local state even if API call fails
      set({
        user: null,
        isAuthenticated: false,
        loadingState: "idle",
      });
    }
  },

  // ---------------------------------------------------------------------------
  // REFRESH USER
  // ---------------------------------------------------------------------------

  /**
   * Refresh user data from API.
   */
  refreshUser: async () => {
    const { isAuthenticated } = get();
    if (!isAuthenticated) return;

    console.log("[AuthStore] Refreshing user data");

    try {
      if (!USE_API) return;

      const user = await apiGetMe();
      set({ user });
      console.log("[AuthStore] User data refreshed");
    } catch (error) {
      console.error("[AuthStore] Failed to refresh user:", error);
    }
  },

  // ---------------------------------------------------------------------------
  // REFRESH TOKEN
  // ---------------------------------------------------------------------------

  /**
   * Refresh token if needed.
   * Returns true if token is valid or was successfully refreshed.
   */
  refreshTokenIfNeeded: async (): Promise<boolean> => {
    const { isAuthenticated } = get();
    if (!isAuthenticated) return false;

    try {
      const expired = await isTokenExpired();
      if (!expired) return true;

      console.log("[AuthStore] Token expired, refreshing...");
      set({ loadingState: "refreshing" });

      if (!USE_API) {
        set({ loadingState: "idle" });
        return true;
      }

      await apiRefreshToken();
      set({ loadingState: "idle" });
      console.log("[AuthStore] Token refresh successful");
      return true;
    } catch (error) {
      console.error("[AuthStore] Token refresh failed:", error);
      set({
        user: null,
        isAuthenticated: false,
        loadingState: "idle",
        error: mapErrorToMessage(error),
      });
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // UTILITIES
  // ---------------------------------------------------------------------------

  /**
   * Clear any auth error.
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Manually set user (useful for profile updates).
   */
  setUser: (user: AuthUser | null) => {
    set({ user });
  },
}));

// ============================================================================
// SELECTORS (for convenience)
// ============================================================================

/**
 * Get current user from auth store.
 */
export const selectUser = () => useAuthStore.getState().user;

/**
 * Check if user is authenticated.
 */
export const selectIsAuthenticated = () =>
  useAuthStore.getState().isAuthenticated;

/**
 * Check if auth is initialized.
 */
export const selectIsInitialized = () => useAuthStore.getState().isInitialized;

/**
 * Check if current user is a guest.
 * Use this selector for reactive updates.
 */
export const useIsGuest = () =>
  useAuthStore((state) => state.user?.isGuest === true);

/**
 * Check if current user is authenticated (not a guest).
 */
export const useIsAuthenticated = () =>
  useAuthStore(
    (state) => state.isAuthenticated && state.user?.isGuest !== true,
  );
