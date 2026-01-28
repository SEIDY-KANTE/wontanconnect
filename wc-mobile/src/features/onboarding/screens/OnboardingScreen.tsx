/**
 * Onboarding Screen
 * 
 * 3-slide introduction to the app.
 */

import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackScreenProps } from '@/core/navigation/types';
import { useAppStore } from '@/core/store/appStore';
import { Button } from '@/components';
import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'globe-outline',
    titleKey: 'onboarding.slide1.title',
    subtitleKey: 'onboarding.slide1.subtitle',
    color: colors.primary[500],
  },
  {
    id: '2',
    icon: 'swap-horizontal-outline',
    titleKey: 'onboarding.slide2.title',
    subtitleKey: 'onboarding.slide2.subtitle',
    color: colors.secondary[500],
  },
  {
    id: '3',
    icon: 'cube-outline',
    titleKey: 'onboarding.slide3.title',
    subtitleKey: 'onboarding.slide3.subtitle',
    color: colors.success.main,
  },
];

export const OnboardingScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<RootStackScreenProps<'Onboarding'>['navigation']>();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAppStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    await completeOnboarding();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={styles.slide}>
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
          <Ionicons name={item.icon} size={80} color={item.color} />
        </View>
        <Text style={styles.title}>{t(item.titleKey)}</Text>
        <Text style={styles.subtitle}>{t(item.subtitleKey)}</Text>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                isActive && styles.dotActive,
                { backgroundColor: isActive ? colors.primary[600] : colors.neutral[300] },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {!isLastSlide && (
        <View style={styles.skipContainer}>
          <Button
            label={t('onboarding.skip')}
            onPress={handleSkip}
            variant="ghost"
            size="sm"
          />
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {renderPagination()}

      <View style={styles.buttonContainer}>
        <Button
          label={isLastSlide ? t('onboarding.getStarted') : t('common.next')}
          onPress={handleNext}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: spacing.base,
    zIndex: 10,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3xl'],
  },
  title: {
    ...typography.displayMedium,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing['2xl'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: spacing.xs,
  },
  dotActive: {
    width: 24,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
