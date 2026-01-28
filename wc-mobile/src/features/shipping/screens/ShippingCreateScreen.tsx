/**
 * Shipping Create Screen
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';

import { ShippingScreenProps } from '@/core/navigation/types';
import { useShippingStore } from '../store/shippingStore';
import { useAppStore } from '@/core/store/appStore';
import { ShippingType } from '../model/types';
import { shippingTypeIcons } from '../data/mockData';
import { BottomSheet, Button, Input, SelectField } from '@/components';
import { colors } from '@/design/tokens/colors';
import { spacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';
import { radius } from '@/design/tokens/radius';
import { gradients } from '@/design/tokens/gradients';
import { shadows } from '@/design/tokens/shadows';
import { countries, citiesByCountry, CountryCode } from '@/data/locations';

const shippingTypes: ShippingType[] = ['parcel', 'container', 'vehicle'];
const defaultFromCountry: CountryCode = 'TR';
const defaultToCountry: CountryCode = 'GN';
const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

export const ShippingCreateScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ShippingScreenProps<'ShippingCreate'>['navigation']>();
  const insets = useSafeAreaInsets();
  const { offers, addOffer, updateOffer, getOfferById, loadOffers } = useShippingStore();
  const { showToast } = useAppStore();
  const route = useRoute<ShippingScreenProps<'ShippingCreate'>['route']>();
  const offerId = route.params?.offerId;
  const isEditing = Boolean(offerId);

  const [type, setType] = useState<ShippingType>('parcel');
  const [fromCountry, setFromCountry] = useState<CountryCode>(defaultFromCountry);
  const [fromCity, setFromCity] = useState(
    citiesByCountry[defaultFromCountry][0]?.name ?? ''
  );
  const [toCountry, setToCountry] = useState<CountryCode>(defaultToCountry);
  const [toCity, setToCity] = useState(
    citiesByCountry[defaultToCountry][0]?.name ?? ''
  );
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const countryOptions = useMemo(
    () =>
      countries.map((option) => ({
        value: option.code,
        label: t(option.nameKey),
        leftIcon: <Text style={styles.flag}>{option.flag}</Text>,
      })),
    [t]
  );

  const fromCityOptions = useMemo(
    () =>
      (citiesByCountry[fromCountry] || []).map((option) => ({
        value: option.name,
        label: option.name,
      })),
    [fromCountry]
  );

  const toCityOptions = useMemo(
    () =>
      (citiesByCountry[toCountry] || []).map((option) => ({
        value: option.name,
        label: option.name,
      })),
    [toCountry]
  );

  useEffect(() => {
    const availableCities = citiesByCountry[fromCountry] || [];
    if (!availableCities.length) {
      setFromCity('');
      return;
    }
    if (!availableCities.some((option) => option.name === fromCity)) {
      setFromCity(availableCities[0].name);
    }
  }, [fromCountry, fromCity]);

  useEffect(() => {
    const availableCities = citiesByCountry[toCountry] || [];
    if (!availableCities.length) {
      setToCity('');
      return;
    }
    if (!availableCities.some((option) => option.name === toCity)) {
      setToCity(availableCities[0].name);
    }
  }, [toCountry, toCity]);

  const handleFromCountrySelect = (value: string) => {
    const nextCountry = countries.find((option) => option.code === value)?.code;
    if (nextCountry) {
      setFromCountry(nextCountry);
    }
  };

  const handleToCountrySelect = (value: string) => {
    const nextCountry = countries.find((option) => option.code === value)?.code;
    if (nextCountry) {
      setToCountry(nextCountry);
    }
  };

  const minimumDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  const formattedDepartureDate = useMemo(() => {
    if (!departureDate) return '';
    return departureDate.toLocaleDateString(locale, DATE_FORMAT);
  }, [departureDate, locale]);

  const departureDateValue = useMemo(() => {
    if (!departureDate) return '';
    const year = departureDate.getFullYear();
    const month = String(departureDate.getMonth() + 1).padStart(2, '0');
    const day = String(departureDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [departureDate]);

  const openDatePicker = () => {
    if (Platform.OS === 'ios') {
      setTempDate(departureDate ?? minimumDate);
    }
    setIsDatePickerOpen(true);
  };

  const parseOfferDate = (dateString: string) => {
    const parsed = new Date(`${dateString}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const handleAndroidChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setIsDatePickerOpen(false);
    if (event.type === 'set' && selectedDate) {
      setDepartureDate(selectedDate);
    }
  };

  const handleIosChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleIosConfirm = () => {
    setDepartureDate(tempDate);
    setIsDatePickerOpen(false);
  };

  const handleIosCancel = () => {
    setIsDatePickerOpen(false);
  };

  const offer = offerId ? getOfferById(offerId) : undefined;

  useEffect(() => {
    if (!offerId) return;
    if (offers.length === 0) {
      loadOffers();
    }
  }, [loadOffers, offerId, offers.length]);

  useEffect(() => {
    if (!offerId || !offer || hasInitialized) return;

    setType(offer.type);
    const nextFromCountry =
      countries.find((option) => option.code === offer.fromCountry)?.code ?? defaultFromCountry;
    const nextToCountry =
      countries.find((option) => option.code === offer.toCountry)?.code ?? defaultToCountry;
    setFromCountry(nextFromCountry);
    setFromCity(offer.fromCity);
    setToCountry(nextToCountry);
    setToCity(offer.toCity);
    const parsedDate = parseOfferDate(offer.departureDate);
    setDepartureDate(parsedDate);
    setTempDate(parsedDate);
    setCapacity(offer.capacity ?? '');
    setPrice(offer.price ?? '');
    setDescription(offer.description ?? '');
    setHasInitialized(true);
  }, [hasInitialized, offer, offerId]);

  const handleSubmit = async () => {
    if (!fromCountry || !fromCity || !toCountry || !toCity || !departureDate) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (isEditing && offerId) {
      updateOffer(offerId, {
        type,
        fromCity,
        fromCountry,
        toCity,
        toCountry,
        departureDate: departureDateValue,
        capacity: capacity || undefined,
        price: price || undefined,
        description: description || undefined,
      });

      showToast('success', t('shipping.form.updateSuccess'));
    } else {
      addOffer({
        type,
        fromCity,
        fromCountry,
        toCity,
        toCountry,
        departureDate: departureDateValue,
        capacity: capacity || undefined,
        price: price || undefined,
        description: description || undefined,
      });

      showToast('success', t('shipping.form.success'));
    }

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={gradients.brandSoft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? t('shipping.form.editTitle') : t('shipping.form.title')}
        </Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Selector */}
          <Text style={styles.inputLabel}>{t('shipping.form.type')}</Text>
          <View style={styles.typeSelector}>
            {shippingTypes.map((shippingType) => {
              const isActive = type === shippingType;
              const iconName = shippingTypeIcons[shippingType] as keyof typeof Ionicons.glyphMap;
              
              return (
                <TouchableOpacity
                  key={shippingType}
                  onPress={() => setType(shippingType)}
                  style={[styles.typeOption, isActive && styles.typeOptionActive]}
                >
                  <Ionicons
                    name={iconName}
                    size={24}
                    color={isActive ? colors.neutral[0] : colors.text.secondary}
                  />
                  <Text style={[styles.typeLabel, isActive && styles.typeLabelActive]}>
                    {t(`shipping.types.${shippingType}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cities */}
          <SelectField
            label={t('shipping.form.fromCountry')}
            value={fromCountry}
            options={countryOptions}
            onSelect={handleFromCountrySelect}
            placeholder={t('common.selectCountry')}
            sheetTitle={t('shipping.form.fromCountry')}
          />
          <SelectField
            label={t('shipping.form.fromCity')}
            value={fromCity}
            options={fromCityOptions}
            onSelect={setFromCity}
            placeholder={t('common.selectCity')}
            helperText={!fromCityOptions.length ? t('common.selectCountryFirst') : undefined}
            disabled={!fromCityOptions.length}
            sheetTitle={t('shipping.form.fromCity')}
            emptyText={t('common.noResults')}
          />

          <SelectField
            label={t('shipping.form.toCountry')}
            value={toCountry}
            options={countryOptions}
            onSelect={handleToCountrySelect}
            placeholder={t('common.selectCountry')}
            sheetTitle={t('shipping.form.toCountry')}
          />
          <SelectField
            label={t('shipping.form.toCity')}
            value={toCity}
            options={toCityOptions}
            onSelect={setToCity}
            placeholder={t('common.selectCity')}
            helperText={!toCityOptions.length ? t('common.selectCountryFirst') : undefined}
            disabled={!toCityOptions.length}
            sheetTitle={t('shipping.form.toCity')}
            emptyText={t('common.noResults')}
          />

          {/* Date */}
          <View style={styles.dateField}>
            <Input
              label={t('shipping.form.departureDate')}
              value={formattedDepartureDate}
              placeholder={t('common.selectDate')}
              editable={false}
              selectTextOnFocus={false}
              rightIcon={
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.text.tertiary}
                />
              }
            />
            <TouchableOpacity
              style={styles.dateFieldOverlay}
              onPress={openDatePicker}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={t('shipping.form.departureDate')}
            />
          </View>

          {/* Capacity */}
          <Input
            label={t('shipping.form.capacity')}
            value={capacity}
            onChangeText={setCapacity}
            placeholder={t('shipping.form.capacityPlaceholder')}
            helperText={t('common.optional')}
          />

          {/* Price */}
          <Input
            label={t('shipping.form.price')}
            value={price}
            onChangeText={setPrice}
            placeholder={t('shipping.form.pricePlaceholder')}
            helperText={t('common.optional')}
          />

          {/* Description */}
          <Input
            label={t('shipping.form.description')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('shipping.form.descriptionPlaceholder')}
            multiline
            numberOfLines={3}
          />
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.submitContainer, { paddingBottom: insets.bottom || spacing.base }]}>
          <Button
            label={isEditing ? t('common.save') : t('shipping.form.publish')}
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={!fromCountry || !fromCity || !toCountry || !toCity || !departureDate}
          />
        </View>
      </KeyboardAvoidingView>

      {Platform.OS === 'android' && isDatePickerOpen && (
        <DateTimePicker
          value={departureDate ?? minimumDate}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          onChange={handleAndroidChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <BottomSheet
          visible={isDatePickerOpen}
          onClose={handleIosCancel}
          title={t('shipping.form.departureDate')}
        >
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              onChange={handleIosChange}
              textColor={colors.text.primary}
              accentColor={colors.primary[600]}
            />
          </View>
          <View style={styles.datePickerActions}>
            <Button
              label={t('common.cancel')}
              onPress={handleIosCancel}
              variant="ghost"
              style={styles.datePickerButton}
            />
            <Button
              label={t('common.done')}
              onPress={handleIosConfirm}
              variant="primary"
              style={styles.datePickerButton}
            />
          </View>
        </BottomSheet>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  headerRight: {
    width: 36,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
  },
  inputLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  typeOptionActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  typeLabel: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },
  typeLabelActive: {
    color: colors.neutral[0],
  },
  flag: {
    fontSize: 18,
  },
  dateField: {
    marginBottom: spacing.base,
  },
  dateFieldOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  datePickerContainer: {
    paddingVertical: spacing.sm,
  },
  datePickerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  datePickerButton: {
    flex: 1,
  },
  submitContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
});
