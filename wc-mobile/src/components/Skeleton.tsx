/**
 * Skeleton Loader Component
 * 
 * Animated placeholder for loading states.
 */

import React, { useEffect } from 'react';
import { DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

import { colors } from '@/design/tokens/colors';
import { radius } from '@/design/tokens/radius';
import { spacing } from '@/design/tokens/spacing';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = radius.sm,
  style,
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.4, 0.7, 0.4]),
  }));

  return (
    <View style={[styles.skeletonContainer, { width, height, borderRadius }, style]}>
      <Animated.View style={[styles.skeletonFill, animatedStyle]} />
    </View>
  );
};

// Pre-built skeleton layouts
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.card, style]}>
    <View style={styles.cardHeader}>
      <Skeleton width={48} height={48} borderRadius={radius.full} />
      <View style={styles.cardHeaderText}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} style={{ marginTop: spacing.xs }} />
      </View>
    </View>
    <Skeleton width="100%" height={14} style={{ marginTop: spacing.md }} />
    <Skeleton width="80%" height={14} style={{ marginTop: spacing.sm }} />
    <View style={styles.cardFooter}>
      <Skeleton width={80} height={28} borderRadius={radius.md} />
      <Skeleton width={100} height={14} />
    </View>
  </View>
);

export const SkeletonListItem: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.listItem, style]}>
    <Skeleton width={44} height={44} borderRadius={radius.lg} />
    <View style={styles.listItemText}>
      <Skeleton width="70%" height={16} />
      <Skeleton width="50%" height={12} style={{ marginTop: spacing.xs }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeletonContainer: {
    overflow: 'hidden',
  },
  skeletonFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.neutral[200],
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.xl,
    padding: spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.base,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  listItemText: {
    flex: 1,
    marginLeft: spacing.md,
  },
});
