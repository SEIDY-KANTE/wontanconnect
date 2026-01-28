/**
 * Avatar Component
 * 
 * User profile image with fallback initials.
 */

import React from 'react';
import { StyleSheet, View, Text, Image, ViewStyle } from 'react-native';

import { colors } from '@/design/tokens/colors';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  verified?: boolean;
  style?: ViewStyle;
}

const sizeConfig: Record<AvatarSize, { size: number; fontSize: number; badgeSize: number }> = {
  xs: { size: 28, fontSize: 10, badgeSize: 10 },
  sm: { size: 36, fontSize: 12, badgeSize: 12 },
  md: { size: 44, fontSize: 14, badgeSize: 14 },
  lg: { size: 56, fontSize: 18, badgeSize: 16 },
  xl: { size: 80, fontSize: 24, badgeSize: 20 },
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getColorFromName = (name?: string): string => {
  const colorOptions = [
    colors.primary[500],
    colors.secondary[500],
    colors.success.main,
    colors.info.main,
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
  ];
  
  if (!name) return colorOptions[0];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colorOptions[Math.abs(hash) % colorOptions.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  verified = false,
  style,
}) => {
  const config = sizeConfig[size];
  const backgroundColor = getColorFromName(name);

  return (
    <View style={[styles.container, { width: config.size, height: config.size }, style]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            { width: config.size, height: config.size, borderRadius: config.size / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: config.size,
              height: config.size,
              borderRadius: config.size / 2,
              backgroundColor,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize: config.fontSize }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}
      
      {verified && (
        <View
          style={[
            styles.badge,
            {
              width: config.badgeSize,
              height: config.badgeSize,
              borderRadius: config.badgeSize / 2,
            },
          ]}
        >
          <Text style={[styles.badgeIcon, { fontSize: config.badgeSize * 0.6 }]}>✓</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.neutral[0],
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.success.main,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  badgeIcon: {
    color: colors.neutral[0],
    fontWeight: '700',
  },
});
