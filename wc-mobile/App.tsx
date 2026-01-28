import React, { useCallback, useEffect, useState, useRef } from "react";
import { StyleSheet, View, AppState, AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

import { AppNavigator } from "@/core/navigation/AppNavigator";
import { RootStackParamList } from "@/core/navigation/types";
import { useAppStore } from "@/core/store/appStore";
import { useAuthStore } from "@/core/store/authStore";
import {
  configureNotifications,
  registerForPushNotifications,
  setupNotificationListeners,
  getLastNotificationResponse,
  clearBadge,
  initializeWebSocket,
  cleanupWebSocket,
} from "@/core/services";
import "@/i18n";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Configure notifications early (before component mounts)
configureNotifications();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const appState = useRef(AppState.currentState);
  const {
    loadPersistedState,
    hasSeenIntro,
    hasCompletedOnboarding,
    hasCompletedAuth,
  } = useAppStore();
  const {
    initialize: initializeAuth,
    isAuthenticated,
    isInitialized: authInitialized,
  } = useAuthStore();

  // Handle notification received while app is foregrounded or tapped
  const handleNotification = useCallback((data: Record<string, unknown>) => {
    console.log("[App] Notification data:", data);
    // TODO: Navigate based on notification type
    // e.g., if (data.type === 'message') navigate to Messages screen
  }, []);

  // Handle app state changes (for badge clearing)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // App came to foreground - clear badge
          clearBadge();
        }
        appState.current = nextAppState;
      },
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        // Load persisted state (language, onboarding status, etc.)
        await loadPersistedState();

        // Initialize auth store (check for existing tokens)
        await initializeAuth();

        // Check if app was opened from a notification
        const lastResponse = await getLastNotificationResponse();
        if (lastResponse) {
          const data = lastResponse.notification.request.content.data;
          if (data) {
            handleNotification(data as Record<string, unknown>);
          }
        }
      } catch (e) {
        console.warn("Error loading app state:", e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, [loadPersistedState, initializeAuth, handleNotification]);

  // Set up notification listeners after auth is initialized
  useEffect(() => {
    if (!authInitialized) return;

    // Set up notification listeners
    const cleanup = setupNotificationListeners(
      (data) => {
        // Notification received while app is in foreground
        console.log("[App] Foreground notification data:", data);
      },
      (data) => {
        // User tapped on notification
        handleNotification(data);
      },
    );

    return cleanup;
  }, [authInitialized, handleNotification]);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (!authInitialized || !isAuthenticated) return;

    async function registerPush() {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          console.log("[App] Push notifications registered successfully");
          // Token is automatically sent to backend in registerForPushNotifications
        }
      } catch (error) {
        console.warn("[App] Failed to register push notifications:", error);
      }
    }

    registerPush();
  }, [authInitialized, isAuthenticated]);

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (!authInitialized) return;

    if (isAuthenticated) {
      // Connect WebSocket when authenticated
      initializeWebSocket().then((connected) => {
        if (connected) {
          console.log("[App] WebSocket connected successfully");
        } else {
          console.warn("[App] WebSocket connection failed");
        }
      });
    } else {
      // Disconnect WebSocket when logged out
      cleanupWebSocket();
    }

    return () => {
      // Cleanup on unmount
      cleanupWebSocket();
    };
  }, [authInitialized, isAuthenticated]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide splash screen once app is ready
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  // Determine initial route based on app state
  // Check both the legacy hasCompletedAuth flag and the new isAuthenticated state
  let initialRoute: keyof RootStackParamList = "BrandIntro";

  if (hasSeenIntro) {
    if (hasCompletedOnboarding) {
      // Use auth store's isAuthenticated as source of truth when initialized
      const isLoggedIn = authInitialized ? isAuthenticated : hasCompletedAuth;
      initialRoute = isLoggedIn ? "Main" : "Auth";
    } else {
      initialRoute = "Onboarding";
    }
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <View style={styles.container} onLayout={onLayoutRootView}>
          <AppNavigator initialRoute={initialRoute} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
