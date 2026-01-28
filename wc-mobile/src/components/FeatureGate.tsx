/**
 * Feature Gate Wrapper
 *
 * Provides components and hooks for feature-flagged functionality.
 * Shows appropriate UI when features are disabled.
 *
 * WHY: Some backend endpoints don't exist yet (password reset, email verification).
 * HOW: Check feature flags before rendering feature, show disabled state if off.
 * VERIFY: Test with flag on/off, verify disabled state shows contact support.
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { config } from "@/config";

// ============================================================================
// TYPES
// ============================================================================

type FeatureFlag = keyof typeof config.features;

interface FeatureGateProps {
  feature: FeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface DisabledFeatureProps {
  title: string;
  message: string;
  icon?: string;
  showContactSupport?: boolean;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Check if a feature is enabled
 */
export function useFeatureFlag(feature: FeatureFlag): boolean {
  return config.features[feature] ?? false;
}

/**
 * Get all feature flags
 */
export function useFeatureFlags(): typeof config.features {
  return config.features;
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Conditionally render content based on feature flag
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
}) => {
  const isEnabled = useFeatureFlag(feature);

  if (isEnabled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return null;
};

/**
 * Default disabled feature UI
 */
export const DisabledFeature: React.FC<DisabledFeatureProps> = ({
  title,
  message,
  icon = "wrench-outline",
  showContactSupport = true,
}) => {
  const handleContactSupport = async () => {
    const email = "support@wontanconnect.com";
    const subject = encodeURIComponent(`Feature Request: ${title}`);
    const body = encodeURIComponent(
      "Hello,\n\nI would like to use this feature. Please let me know when it becomes available.\n\nThank you.",
    );

    const url = `mailto:${email}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Error opening email:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={icon as any} size={64} color="#9E9E9E" />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {showContactSupport && (
        <TouchableOpacity
          style={styles.supportButton}
          onPress={handleContactSupport}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="email-outline"
            size={20}
            color="#2196F3"
          />
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================================
// SPECIFIC DISABLED FEATURE SCREENS
// ============================================================================

/**
 * Disabled password reset screen
 */
export const DisabledPasswordReset: React.FC = () => (
  <DisabledFeature
    title="Password Reset Unavailable"
    message="This feature is currently under development. Please contact support if you need help accessing your account."
    icon="lock-reset"
  />
);

/**
 * Disabled email verification screen
 */
export const DisabledEmailVerification: React.FC = () => (
  <DisabledFeature
    title="Email Verification Unavailable"
    message="Email verification is currently under development. Your account is active and you can continue using the app."
    icon="email-check-outline"
  />
);

/**
 * Generic coming soon component
 */
export const ComingSoon: React.FC<{ featureName: string }> = ({
  featureName,
}) => (
  <DisabledFeature
    title="Coming Soon"
    message={`${featureName} is currently in development and will be available in a future update.`}
    icon="clock-outline"
    showContactSupport={false}
  />
);

// ============================================================================
// HIGHER-ORDER COMPONENT
// ============================================================================

/**
 * HOC to wrap a component with feature gating
 */
export function withFeatureGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: FeatureFlag,
  FallbackComponent?: React.ComponentType,
): React.FC<P> {
  return function FeatureGatedComponent(props: P) {
    const isEnabled = useFeatureFlag(feature);

    if (isEnabled) {
      return <WrappedComponent {...props} />;
    }

    if (FallbackComponent) {
      return <FallbackComponent />;
    }

    return (
      <DisabledFeature
        title="Feature Unavailable"
        message="This feature is not currently available."
      />
    );
  };
}

// ============================================================================
// FEATURE-SPECIFIC WRAPPERS
// ============================================================================

/**
 * Wrapper for password reset screen
 */
export function withPasswordResetGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
): React.FC<P> {
  return withFeatureGate(
    WrappedComponent,
    "enablePasswordReset",
    DisabledPasswordReset,
  );
}

/**
 * Wrapper for email verification screen
 */
export function withEmailVerificationGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
): React.FC<P> {
  return withFeatureGate(
    WrappedComponent,
    "enableEmailVerification",
    DisabledEmailVerification,
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FAFAFA",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#212121",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 300,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2196F3",
    marginLeft: 8,
  },
});
