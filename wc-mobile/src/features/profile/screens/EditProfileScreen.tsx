/**
 * Edit Profile Screen
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ProfileScreenProps } from '@/core/navigation/types';
import { useProfileStore } from '@/features/profile/store/profileStore';
import { useAppStore, Language } from '@/core/store/appStore';
import { changeLanguage } from '@/i18n';
import { Avatar, BottomSheet, Button, Card, Header, Input, SelectField, Tag } from '@/components';
import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { radius } from '@/design/tokens/radius';
import { countries, citiesByCountry, CountryCode } from '@/data/locations';

const AVATAR_OPTIONS = [
  {
    id: 'avatar-1',
    uri: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: 'avatar-2',
    uri: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    id: 'avatar-3',
    uri: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
  {
    id: 'avatar-4',
    uri: 'https://randomuser.me/api/portraits/women/4.jpg',
  },
];

export const EditProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ProfileScreenProps<'EditProfile'>['navigation']>();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useProfileStore();
  const { language, setLanguage, showToast } = useAppStore();

  const [name, setName] = useState(profile.name);
  const [country, setCountry] = useState<CountryCode>(profile.country as CountryCode);
  const [city, setCity] = useState(profile.city);
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(language);
  const [avatar, setAvatar] = useState<string | undefined>(profile.avatar);
  const [isAvatarSheetOpen, setIsAvatarSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const countryOptions = useMemo(
    () =>
      countries.map((option) => ({
        value: option.code,
        label: t(option.nameKey),
        leftIcon: <Text style={styles.flag}>{option.flag}</Text>,
      })),
    [t]
  );

  const cityOptions = useMemo(
    () =>
      (citiesByCountry[country] || []).map((option) => ({
        value: option.name,
        label: option.name,
      })),
    [country]
  );

  const languageOptions = useMemo(
    () => [
      {
        value: 'fr',
        label: t('settings.languages.fr'),
        leftIcon: <Text style={styles.flag}>🇫🇷</Text>,
      },
      {
        value: 'en',
        label: t('settings.languages.en'),
        leftIcon: <Text style={styles.flag}>🇬🇧</Text>,
      },
    ],
    [t]
  );

  useEffect(() => {
    const availableCities = citiesByCountry[country] || [];
    if (!availableCities.length) {
      setCity('');
      return;
    }
    if (!availableCities.some((option) => option.name === city)) {
      setCity(availableCities[0].name);
    }
  }, [city, country]);

  const handleCountrySelect = (value: string) => {
    const nextCountry = countries.find((option) => option.code === value)?.code;
    if (nextCountry) {
      setCountry(nextCountry);
    }
  };

  const handleLanguageSelect = (value: string) => {
    setPreferredLanguage(value as Language);
  };

  const handleSave = async () => {
    if (!name.trim() || !country || !city) return;
    setIsSaving(true);

    updateProfile({
      name: name.trim(),
      country,
      city,
      avatar,
    });

    if (preferredLanguage !== language) {
      await setLanguage(preferredLanguage);
      await changeLanguage(preferredLanguage);
    }

    showToast('success', t('profile.edit.saveSuccess'));
    setIsSaving(false);
    navigation.goBack();
  };

  const handleAvatarSelect = (selectedAvatar?: string) => {
    setAvatar(selectedAvatar);
    setIsAvatarSheetOpen(false);
  };

  const isSaveDisabled = !name.trim() || !country || !city;

  return (
    <View style={styles.container}>
      <Header
        title={t('profile.edit.title')}
        showBack
        onBack={() => navigation.goBack()}
        variant="gradient"
        elevated
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.delay(100)}>
            <Text style={styles.sectionTitle}>{t('profile.edit.avatarTitle')}</Text>
            <Card style={styles.avatarCard}>
              <View style={styles.avatarRow}>
                <Avatar
                  source={avatar}
                  name={name || profile.name}
                  size="xl"
                  verified={profile.isVerified}
                />
                <View style={styles.avatarInfo}>
                  <Text style={styles.avatarName}>{name || profile.name}</Text>
                  <Text style={styles.avatarSubtitle}>{t('profile.edit.avatarSubtitle')}</Text>
                </View>
              </View>
              <Button
                label={t('profile.edit.changePhoto')}
                onPress={() => setIsAvatarSheetOpen(true)}
                variant="ghost"
                style={styles.avatarButton}
              />
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <Text style={styles.sectionTitle}>{t('profile.edit.detailsTitle')}</Text>
            <Input
              label={t('profile.edit.name')}
              value={name}
              onChangeText={setName}
              placeholder={t('profile.edit.namePlaceholder')}
            />
            <SelectField
              label={t('profile.edit.country')}
              value={country}
              options={countryOptions}
              onSelect={handleCountrySelect}
              placeholder={t('common.selectCountry')}
              sheetTitle={t('profile.edit.country')}
            />
            <SelectField
              label={t('profile.edit.city')}
              value={city}
              options={cityOptions}
              onSelect={setCity}
              placeholder={t('common.selectCity')}
              helperText={!cityOptions.length ? t('common.selectCountryFirst') : undefined}
              disabled={!cityOptions.length}
              sheetTitle={t('profile.edit.city')}
              emptyText={t('common.noResults')}
            />
            <SelectField
              label={t('profile.edit.language')}
              value={preferredLanguage}
              options={languageOptions}
              onSelect={handleLanguageSelect}
              placeholder={t('settings.language')}
              sheetTitle={t('profile.edit.language')}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)}>
            <Text style={styles.sectionTitle}>{t('profile.edit.trustTitle')}</Text>
            <Card style={styles.trustCard}>
              <View style={styles.trustHeader}>
                <Tag
                  label={t('profile.edit.verified')}
                  variant={profile.isVerified ? 'success' : 'warning'}
                  size="sm"
                  icon={
                    <Ionicons
                      name={profile.isVerified ? 'checkmark-circle' : 'alert-circle'}
                      size={12}
                      color={profile.isVerified ? colors.success.dark : colors.warning.dark}
                    />
                  }
                />
                <Text style={styles.trustSubtitle}>{t('profile.edit.trustSubtitle')}</Text>
              </View>
              <View style={styles.trustStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.stats.deals}</Text>
                  <Text style={styles.statLabel}>{t('profile.stats.deals')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.stats.rating}</Text>
                  <Text style={styles.statLabel}>{t('profile.stats.rating')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.stats.offers}</Text>
                  <Text style={styles.statLabel}>{t('profile.stats.offers')}</Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.base }]}>
          <Button
            label={t('common.save')}
            onPress={handleSave}
            variant="primary"
            size="lg"
            fullWidth
            loading={isSaving}
            disabled={isSaveDisabled}
          />
        </View>
      </KeyboardAvoidingView>

      <BottomSheet
        visible={isAvatarSheetOpen}
        onClose={() => setIsAvatarSheetOpen(false)}
        title={t('profile.edit.avatarSheetTitle')}
      >
        <View style={styles.avatarOptions}>
          {AVATAR_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleAvatarSelect(option.uri)}
              style={styles.avatarOption}
            >
              <Avatar source={option.uri} name={name} size="lg" />
              {avatar === option.uri && (
                <View style={styles.avatarSelected}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary[600]} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <Button
          label={t('profile.edit.removePhoto')}
          onPress={() => handleAvatarSelect(undefined)}
          variant="ghost"
          style={styles.removeButton}
        />
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing['4xl'],
  },
  sectionTitle: {
    ...typography.labelMedium,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  avatarCard: {
    marginBottom: spacing.xl,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  avatarInfo: {
    flex: 1,
  },
  avatarName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  avatarSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  avatarButton: {
    marginTop: spacing.base,
  },
  trustCard: {
    marginBottom: spacing.xl,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  trustSubtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  trustStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.light,
  },
  footer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  avatarOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  avatarOption: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  avatarSelected: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
  },
  removeButton: {
    marginTop: spacing.base,
  },
  flag: {
    fontSize: 18,
  },
});
