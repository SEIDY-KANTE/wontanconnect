/**
 * Auth API
 *
 * Authentication API endpoints for login, register, logout, and token refresh.
 */

import { apiClient, ApiClientError } from "./client";
import { AUTH_ENDPOINTS } from "./endpoints";
import {
  saveTokens,
  saveUserData,
  clearAllAuthData,
  getRefreshToken,
} from "./storage";
import type {
  ApiResponse,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  GuestRequest,
  GuestResponse,
  RefreshResponse,
  MeResponse,
} from "./types";

// ============================================================================
// AUTH API FUNCTIONS
// ============================================================================

/**
 * Register a new user account.
 */
export async function register(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  try {
    console.log("[AuthAPI] Registering user:", data.email);

    const response = await apiClient.post<ApiResponse<RegisterResponse>>(
      AUTH_ENDPOINTS.REGISTER,
      data,
    );

    const { user, tokens } = response.data.data;

    // Save tokens and user data
    await Promise.all([saveTokens(tokens), saveUserData(user)]);

    console.log("[AuthAPI] Registration successful:", user.id);
    return { user, tokens };
  } catch (error) {
    console.error("[AuthAPI] Registration failed:", error);
    throw error;
  }
}

/**
 * Login with email and password.
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  try {
    console.log("[AuthAPI] Logging in user:", data.email);

    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      AUTH_ENDPOINTS.LOGIN,
      data,
    );

    const { user, tokens } = response.data.data;

    // Save tokens and user data
    await Promise.all([saveTokens(tokens), saveUserData(user)]);

    console.log("[AuthAPI] Login successful:", user.id);
    return { user, tokens };
  } catch (error) {
    console.error("[AuthAPI] Login failed:", error);
    throw error;
  }
}

/**
 * Create a guest session.
 */
export async function loginAsGuest(deviceId: string): Promise<GuestResponse> {
  try {
    console.log("[AuthAPI] Creating guest session");

    const response = await apiClient.post<ApiResponse<GuestResponse>>(
      AUTH_ENDPOINTS.GUEST,
      { deviceId } as GuestRequest,
    );

    const { user, tokens } = response.data.data;

    // Save tokens and user data
    await Promise.all([saveTokens(tokens), saveUserData(user)]);

    console.log("[AuthAPI] Guest session created:", user.id);
    return { user, tokens };
  } catch (error) {
    console.error("[AuthAPI] Guest login failed:", error);
    throw error;
  }
}

/**
 * Refresh the access token.
 */
export async function refreshToken(): Promise<RefreshResponse> {
  try {
    console.log("[AuthAPI] Refreshing token");

    const currentRefreshToken = await getRefreshToken();
    if (!currentRefreshToken) {
      throw new ApiClientError(
        "No refresh token available",
        "NO_REFRESH_TOKEN",
        401,
      );
    }

    const response = await apiClient.post<ApiResponse<RefreshResponse>>(
      AUTH_ENDPOINTS.REFRESH,
      { refreshToken: currentRefreshToken },
    );

    const { tokens } = response.data.data;

    // Save new tokens
    await saveTokens(tokens);

    console.log("[AuthAPI] Token refreshed successfully");
    return { tokens };
  } catch (error) {
    console.error("[AuthAPI] Token refresh failed:", error);
    // Clear auth data on refresh failure
    await clearAllAuthData();
    throw error;
  }
}

/**
 * Logout the current user.
 */
export async function logout(): Promise<void> {
  try {
    console.log("[AuthAPI] Logging out");

    await apiClient.post(AUTH_ENDPOINTS.LOGOUT);

    console.log("[AuthAPI] Logout successful");
  } catch (error) {
    // Log but don't throw - we want to clear local data regardless
    console.warn("[AuthAPI] Logout API call failed:", error);
  } finally {
    // Always clear local auth data
    await clearAllAuthData();
  }
}

/**
 * Get the current authenticated user.
 */
export async function getMe(): Promise<MeResponse> {
  try {
    console.log("[AuthAPI] Fetching current user");

    const response = await apiClient.get<ApiResponse<MeResponse>>(
      AUTH_ENDPOINTS.ME,
    );

    const user = response.data.data;

    // Update cached user data
    await saveUserData(user);

    console.log("[AuthAPI] User fetched:", user.id);
    return user;
  } catch (error) {
    console.error("[AuthAPI] Failed to fetch user:", error);
    throw error;
  }
}

/**
 * Request password reset email.
 */
export async function forgotPassword(email: string): Promise<void> {
  try {
    console.log("[AuthAPI] Requesting password reset for:", email);

    await apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });

    console.log("[AuthAPI] Password reset email sent");
  } catch (error) {
    console.error("[AuthAPI] Forgot password failed:", error);
    throw error;
  }
}

/**
 * Reset password with token.
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  try {
    console.log("[AuthAPI] Resetting password");

    await apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, { token, newPassword });

    console.log("[AuthAPI] Password reset successful");
  } catch (error) {
    console.error("[AuthAPI] Reset password failed:", error);
    throw error;
  }
}

/**
 * Verify email with token.
 */
export async function verifyEmail(token: string): Promise<void> {
  try {
    console.log("[AuthAPI] Verifying email");

    await apiClient.post(AUTH_ENDPOINTS.VERIFY_EMAIL, { token });

    console.log("[AuthAPI] Email verified successfully");
  } catch (error) {
    console.error("[AuthAPI] Email verification failed:", error);
    throw error;
  }
}
