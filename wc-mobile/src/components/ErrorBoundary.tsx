/**
 * Error Boundary Components
 *
 * Production-grade error boundaries for:
 * - App-level error catching
 * - Screen-level error isolation
 * - Feature-level error containment
 *
 * Features:
 * - Custom fallback UIs
 * - Error logging/reporting
 * - Recovery actions
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { config, errorLog, isProduction } from "@/config";

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  level?: "app" | "screen" | "component";
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// ============================================================================

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error
    errorLog("ErrorBoundary", error, {
      componentStack: errorInfo.componentStack,
      level: this.props.level || "component",
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Report to crash reporting service in production
    if (config.features.enableCrashReporting && config.sentryDsn) {
      // Sentry.captureException(error, {
      //   extra: { componentStack: errorInfo.componentStack }
      // });
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback based on level
      const level = this.props.level || "component";

      switch (level) {
        case "app":
          return (
            <AppLevelError
              error={this.state.error}
              errorInfo={this.state.errorInfo}
              onReset={this.handleReset}
              showDetails={this.props.showDetails ?? !isProduction}
            />
          );

        case "screen":
          return (
            <ScreenLevelError
              error={this.state.error}
              onReset={this.handleReset}
              showDetails={this.props.showDetails ?? !isProduction}
            />
          );

        default:
          return (
            <ComponentLevelError
              error={this.state.error}
              onReset={this.handleReset}
            />
          );
      }
    }

    return this.props.children;
  }
}

// ============================================================================
// FALLBACK UI COMPONENTS
// ============================================================================

interface ErrorUIProps {
  error: Error | null;
  errorInfo?: ErrorInfo | null;
  onReset: () => void;
  showDetails?: boolean;
}

/**
 * App-level error UI - full screen, serious
 */
function AppLevelError({
  error,
  errorInfo,
  onReset,
  showDetails,
}: ErrorUIProps): ReactNode {
  return (
    <View style={styles.appContainer}>
      <View style={styles.appContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.appIcon}>⚠️</Text>
        </View>

        <Text style={styles.appTitle}>Something went wrong</Text>
        <Text style={styles.appMessage}>
          We're sorry, but something unexpected happened. Please try restarting
          the app.
        </Text>

        <TouchableOpacity style={styles.appButton} onPress={onReset}>
          <Text style={styles.appButtonText}>Try Again</Text>
        </TouchableOpacity>

        {showDetails && error && (
          <ScrollView style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Error Details</Text>
            <Text style={styles.detailsText}>
              {error.name}: {error.message}
            </Text>
            {errorInfo && (
              <Text style={styles.detailsStack}>
                {errorInfo.componentStack}
              </Text>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

/**
 * Screen-level error UI - contained to screen
 */
function ScreenLevelError({
  error,
  onReset,
  showDetails,
}: ErrorUIProps): ReactNode {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.screenContent}>
        <Text style={styles.screenIcon}>😕</Text>
        <Text style={styles.screenTitle}>Oops!</Text>
        <Text style={styles.screenMessage}>
          This screen encountered an error. Please try again.
        </Text>

        <TouchableOpacity style={styles.screenButton} onPress={onReset}>
          <Text style={styles.screenButtonText}>Retry</Text>
        </TouchableOpacity>

        {showDetails && error && (
          <View style={styles.screenDetails}>
            <Text style={styles.screenDetailsText}>
              {error.name}: {error.message}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * Component-level error UI - minimal, inline
 */
function ComponentLevelError({ error, onReset }: ErrorUIProps): ReactNode {
  return (
    <View style={styles.componentContainer}>
      <Text style={styles.componentIcon}>⚠️</Text>
      <Text style={styles.componentMessage}>Something went wrong</Text>
      <TouchableOpacity onPress={onReset}>
        <Text style={styles.componentRetry}>Tap to retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// HIGHER-ORDER COMPONENT
// ============================================================================

/**
 * HOC to wrap a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, "children">,
): React.FC<P> {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";

  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...options}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

// ============================================================================
// SPECIALIZED BOUNDARIES
// ============================================================================

/**
 * App-level error boundary
 */
export function AppErrorBoundary({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <ErrorBoundary
      level="app"
      onError={(error, errorInfo) => {
        errorLog("AppErrorBoundary", error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Screen-level error boundary
 */
export function ScreenErrorBoundary({
  children,
  screenName,
}: {
  children: ReactNode;
  screenName?: string;
}): JSX.Element {
  return (
    <ErrorBoundary
      level="screen"
      onError={(error, errorInfo) => {
        errorLog("ScreenErrorBoundary", error, { screenName, ...errorInfo });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Feature/component-level error boundary
 */
export function FeatureErrorBoundary({
  children,
  featureName,
  fallback,
}: {
  children: ReactNode;
  featureName?: string;
  fallback?: ReactNode;
}): JSX.Element {
  return (
    <ErrorBoundary
      level="component"
      fallback={fallback}
      onError={(error, errorInfo) => {
        errorLog("FeatureErrorBoundary", error, { featureName, ...errorInfo });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // App-level styles
  appContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  appContent: {
    alignItems: "center",
    maxWidth: 300,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  appIcon: {
    fontSize: 40,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  appMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  appButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  appButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  detailsContainer: {
    marginTop: 32,
    maxHeight: 200,
    width: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 12,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 12,
    color: "#EF4444",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  detailsStack: {
    fontSize: 10,
    color: "#6B7280",
    fontFamily: "monospace",
  },

  // Screen-level styles
  screenContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  screenContent: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  screenIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  screenMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  screenButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  screenButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  screenDetails: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },
  screenDetailsText: {
    fontSize: 11,
    color: "#B91C1C",
    fontFamily: "monospace",
  },

  // Component-level styles
  componentContainer: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    margin: 8,
  },
  componentIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  componentMessage: {
    fontSize: 12,
    color: "#92400E",
    marginBottom: 4,
  },
  componentRetry: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export default ErrorBoundary;
