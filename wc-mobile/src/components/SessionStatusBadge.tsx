/**
 * SessionStatusBadge Component
 *
 * Displays session status with appropriate colors, icons, and labels.
 * Handles ALL backend statuses including new ones.
 *
 * WHY: Unified status display across the app.
 * HOW: Uses SESSION_STATUS_CONFIG for consistent styling.
 * VERIFY: Test with all status values, verify colors/icons match design system.
 */

import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ExtendedSessionStatus,
  getStatusConfig,
  normalizeStatus,
} from "@/api/contracts/sessionStateMachine";

// ============================================================================
// TYPES
// ============================================================================

interface SessionStatusBadgeProps {
  status: string;
  size?: "small" | "medium" | "large";
  showIcon?: boolean;
  showLabel?: boolean;
  variant?: "badge" | "chip" | "pill";
  style?: ViewStyle;
}

// ============================================================================
// SIZE CONFIGURATIONS
// ============================================================================

const SIZES = {
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    iconSize: 12,
    borderRadius: 4,
  },
  medium: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    iconSize: 16,
    borderRadius: 6,
  },
  large: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    fontSize: 14,
    iconSize: 20,
    borderRadius: 8,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const SessionStatusBadge: React.FC<SessionStatusBadgeProps> = ({
  status,
  size = "medium",
  showIcon = true,
  showLabel = true,
  variant = "badge",
  style,
}) => {
  // Normalize status to handle any variations
  const normalizedStatus = normalizeStatus(status);
  const config = getStatusConfig(normalizedStatus);
  const sizeConfig = SIZES[size];

  const containerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: config.backgroundColor,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    paddingVertical: sizeConfig.paddingVertical,
    borderRadius: variant === "pill" ? 100 : sizeConfig.borderRadius,
    ...(variant === "chip" && {
      borderWidth: 1,
      borderColor: config.color,
    }),
  };

  return (
    <View style={[containerStyle, style]}>
      {showIcon && (
        <MaterialCommunityIcons
          name={config.icon as any}
          size={sizeConfig.iconSize}
          color={config.color}
          style={showLabel ? styles.icon : undefined}
        />
      )}
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              color: config.color,
              fontSize: sizeConfig.fontSize,
            },
          ]}
          numberOfLines={1}
        >
          {size === "small" ? config.shortLabel : config.label}
        </Text>
      )}
    </View>
  );
};

// ============================================================================
// SIMPLE STATUS DOT
// ============================================================================

interface StatusDotProps {
  status: string;
  size?: number;
  animated?: boolean;
}

export const SessionStatusDot: React.FC<StatusDotProps> = ({
  status,
  size = 8,
  animated = false,
}) => {
  const normalizedStatus = normalizeStatus(status);
  const config = getStatusConfig(normalizedStatus);

  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          backgroundColor: config.color,
          borderRadius: size / 2,
        },
      ]}
    />
  );
};

// ============================================================================
// STATUS TEXT ONLY
// ============================================================================

interface StatusTextProps {
  status: string;
  showDescription?: boolean;
  size?: "small" | "medium" | "large";
}

export const SessionStatusText: React.FC<StatusTextProps> = ({
  status,
  showDescription = false,
  size = "medium",
}) => {
  const normalizedStatus = normalizeStatus(status);
  const config = getStatusConfig(normalizedStatus);
  const sizeConfig = SIZES[size];

  return (
    <View>
      <Text
        style={[
          styles.statusText,
          {
            color: config.color,
            fontSize: sizeConfig.fontSize,
          },
        ]}
      >
        {config.label}
      </Text>
      {showDescription && (
        <Text style={styles.description}>{config.description}</Text>
      )}
    </View>
  );
};

// ============================================================================
// STATUS PROGRESS BAR
// ============================================================================

interface StatusProgressProps {
  status: string;
  offerType: "fx" | "shipping";
  height?: number;
}

export const SessionStatusProgress: React.FC<StatusProgressProps> = ({
  status,
  offerType,
  height = 4,
}) => {
  const normalizedStatus = normalizeStatus(status);
  const config = getStatusConfig(normalizedStatus);

  // Import dynamically to avoid circular deps
  const { getStatusProgress } = require("@/api/contracts/sessionStateMachine");
  const progress = getStatusProgress(normalizedStatus, offerType);

  return (
    <View style={[styles.progressContainer, { height }]}>
      <View
        style={[
          styles.progressBar,
          {
            width: `${progress}%`,
            backgroundColor: config.color,
            height,
          },
        ]}
      />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: "600",
  },
  dot: {},
  statusText: {
    fontWeight: "600",
  },
  description: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  progressContainer: {
    width: "100%",
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    borderRadius: 2,
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export { ExtendedSessionStatus };
export {
  getStatusConfig,
  normalizeStatus,
} from "@/api/contracts/sessionStateMachine";
