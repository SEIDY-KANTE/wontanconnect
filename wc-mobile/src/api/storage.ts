/**
 * Token Storage
 *
 * Secure storage for authentication tokens using expo-secure-store.
 * Falls back to AsyncStorage for web platform.
 */

import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { STORAGE_KEYS } from "./config";
import type { AuthTokens, AuthUser } from "./types";

// ============================================================================
// SECURE STORAGE HELPERS
// ============================================================================

/**
 * Check if secure storage is available (not on web).
 */
const isSecureStoreAvailable = Platform.OS !== "web";

/**
 * Save a value to secure storage.
 */
async function secureSet(key: string, value: string): Promise<void> {
  if (isSecureStoreAvailable) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

/**
 * Get a value from secure storage.
 */
async function secureGet(key: string): Promise<string | null> {
  if (isSecureStoreAvailable) {
    return await SecureStore.getItemAsync(key);
  }
  return await AsyncStorage.getItem(key);
}

/**
 * Delete a value from secure storage.
 */
async function secureDelete(key: string): Promise<void> {
  if (isSecureStoreAvailable) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

// ============================================================================
// TOKEN STORAGE API
// ============================================================================

/**
 * Save authentication tokens.
 */
export async function saveTokens(tokens: AuthTokens): Promise<void> {
  try {
    await Promise.all([
      secureSet(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
      secureSet(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
      secureSet(
        STORAGE_KEYS.TOKEN_EXPIRY,
        String(Date.now() + tokens.expiresIn * 1000),
      ),
    ]);
    console.log("[TokenStorage] Tokens saved successfully");
  } catch (error) {
    console.error("[TokenStorage] Failed to save tokens:", error);
    throw error;
  }
}

/**
 * Get the access token.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    return await secureGet(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error("[TokenStorage] Failed to get access token:", error);
    return null;
  }
}

/**
 * Get the refresh token.
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    return await secureGet(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error("[TokenStorage] Failed to get refresh token:", error);
    return null;
  }
}

/**
 * Get token expiry timestamp.
 */
export async function getTokenExpiry(): Promise<number | null> {
  try {
    const expiry = await secureGet(STORAGE_KEYS.TOKEN_EXPIRY);
    return expiry ? parseInt(expiry, 10) : null;
  } catch (error) {
    console.error("[TokenStorage] Failed to get token expiry:", error);
    return null;
  }
}

/**
 * Check if the access token is expired or about to expire.
 * @param thresholdMs - Consider expired if within this many ms of expiry
 */
export async function isTokenExpired(thresholdMs = 60000): Promise<boolean> {
  const expiry = await getTokenExpiry();
  if (!expiry) return true;
  return Date.now() >= expiry - thresholdMs;
}

/**
 * Clear all authentication tokens.
 */
export async function clearTokens(): Promise<void> {
  try {
    await Promise.all([
      secureDelete(STORAGE_KEYS.ACCESS_TOKEN),
      secureDelete(STORAGE_KEYS.REFRESH_TOKEN),
      secureDelete(STORAGE_KEYS.TOKEN_EXPIRY),
    ]);
    console.log("[TokenStorage] Tokens cleared successfully");
  } catch (error) {
    console.error("[TokenStorage] Failed to clear tokens:", error);
    throw error;
  }
}

// ============================================================================
// USER DATA STORAGE
// ============================================================================

/**
 * Save user data to storage.
 */
export async function saveUserData(user: AuthUser): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    console.log("[TokenStorage] User data saved successfully");
  } catch (error) {
    console.error("[TokenStorage] Failed to save user data:", error);
    throw error;
  }
}

/**
 * Get user data from storage.
 */
export async function getUserData(): Promise<AuthUser | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("[TokenStorage] Failed to get user data:", error);
    return null;
  }
}

/**
 * Clear user data from storage.
 */
export async function clearUserData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    console.log("[TokenStorage] User data cleared");
  } catch (error) {
    console.error("[TokenStorage] Failed to clear user data:", error);
    throw error;
  }
}

/**
 * Clear all auth-related data (tokens + user).
 */
export async function clearAllAuthData(): Promise<void> {
  await Promise.all([clearTokens(), clearUserData()]);
}
