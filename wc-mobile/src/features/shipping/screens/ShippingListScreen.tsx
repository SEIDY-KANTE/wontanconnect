/**
 * Shipping List Screen
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ShippingScreenProps } from "@/core/navigation/types";
import { useShippingStore } from "../store/shippingStore";
import { ShippingOfferCard } from "../components/ShippingOfferCard";
import {
  SearchBar,
  EmptyState,
  SkeletonCard,
  BottomSheet,
  Button,
  Input,
  SelectField,
  FilterChip,
  GuestRestrictionModal,
} from "@/components";
import { useIsGuest } from "@/core/store/authStore";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { shadows } from "@/design/tokens/shadows";
import { gradients } from "@/design/tokens/gradients";
import { useFilters } from "@/core/hooks/useFilters";
import {
  countries,
  citiesByCountry,
  countryFlags,
  CountryCode,
} from "@/data/locations";
import { ShippingOffer, ShippingType } from "../model/types";
import { extractNumberFromText, parseNumberInput } from "@/utils/number";

type FilterOption = "all" | ShippingType;
type OptionalCountry = CountryCode | "";

interface ShippingFilters {
  type: FilterOption;
  fromCountry: OptionalCountry;
  fromCity: string;
  toCountry: OptionalCountry;
  toCity: string;
  dateFrom: string;
  dateTo: string;
  capacityMin: string;
  capacityMax: string;
}

const filterOptions: FilterOption[] = ["all", "parcel", "container", "vehicle"];
const DEFAULT_FILTERS: ShippingFilters = {
  type: "all",
  fromCountry: "",
  fromCity: "",
  toCountry: "",
  toCity: "",
  dateFrom: "",
  dateTo: "",
  capacityMin: "",
  capacityMax: "",
};
const FILTER_BUTTON_SIZE = 44;

export const ShippingListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<ShippingScreenProps<"ShippingList">["navigation"]>();
  const insets = useSafeAreaInsets();
  const isGuest = useIsGuest();

  const { isLoading, searchQuery, setSearchQuery, loadOffers, offers } =
    useShippingStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ShippingFilters>({
    ...DEFAULT_FILTERS,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  useEffect(() => {
    if (!filters.fromCountry) {
      if (filters.fromCity) {
        setFilters((prev) => ({ ...prev, fromCity: "" }));
      }
      return;
    }

    const availableCities = citiesByCountry[filters.fromCountry] || [];
    if (!availableCities.length) {
      if (filters.fromCity) {
        setFilters((prev) => ({ ...prev, fromCity: "" }));
      }
      return;
    }

    const hasCity = availableCities.some(
      (option) => option.name === filters.fromCity,
    );
    if (!hasCity && filters.fromCity) {
      setFilters((prev) => ({ ...prev, fromCity: "" }));
    }
  }, [filters.fromCity, filters.fromCountry]);

  useEffect(() => {
    if (!filters.toCountry) {
      if (filters.toCity) {
        setFilters((prev) => ({ ...prev, toCity: "" }));
      }
      return;
    }

    const availableCities = citiesByCountry[filters.toCountry] || [];
    if (!availableCities.length) {
      if (filters.toCity) {
        setFilters((prev) => ({ ...prev, toCity: "" }));
      }
      return;
    }

    const hasCity = availableCities.some(
      (option) => option.name === filters.toCity,
    );
    if (!hasCity && filters.toCity) {
      setFilters((prev) => ({ ...prev, toCity: "" }));
    }
  }, [filters.toCity, filters.toCountry]);

  const countryOptions = useMemo(
    () =>
      countries.map((option) => ({
        value: option.code,
        label: t(option.nameKey),
        leftIcon: <Text style={styles.flag}>{option.flag}</Text>,
      })),
    [t],
  );

  const fromCityOptions = useMemo(
    () =>
      filters.fromCountry
        ? (citiesByCountry[filters.fromCountry] || []).map((option) => ({
            value: option.name,
            label: option.name,
          }))
        : [],
    [filters.fromCountry],
  );

  const toCityOptions = useMemo(
    () =>
      filters.toCountry
        ? (citiesByCountry[filters.toCountry] || []).map((option) => ({
            value: option.name,
            label: option.name,
          }))
        : [],
    [filters.toCountry],
  );

  const dateFromValue = useMemo(() => {
    if (!filters.dateFrom) return null;
    const parsed = new Date(filters.dateFrom);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }, [filters.dateFrom]);

  const dateToValue = useMemo(() => {
    if (!filters.dateTo) return null;
    const parsed = new Date(filters.dateTo);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }, [filters.dateTo]);

  const capacityMinValue = useMemo(
    () => parseNumberInput(filters.capacityMin),
    [filters.capacityMin],
  );
  const capacityMaxValue = useMemo(
    () => parseNumberInput(filters.capacityMax),
    [filters.capacityMax],
  );

  const filteredOffers = useFilters<ShippingOffer, ShippingFilters>({
    items: offers,
    filters,
    searchQuery,
    applySearch: (offer, query) =>
      offer.fromCity.toLowerCase().includes(query) ||
      offer.toCity.toLowerCase().includes(query) ||
      offer.user.name.toLowerCase().includes(query),
    applyFilters: (offer, activeFilters) => {
      if (activeFilters.type !== "all" && offer.type !== activeFilters.type) {
        return false;
      }
      if (
        activeFilters.fromCountry &&
        offer.fromCountry !== activeFilters.fromCountry
      ) {
        return false;
      }
      if (activeFilters.fromCity && offer.fromCity !== activeFilters.fromCity) {
        return false;
      }
      if (
        activeFilters.toCountry &&
        offer.toCountry !== activeFilters.toCountry
      ) {
        return false;
      }
      if (activeFilters.toCity && offer.toCity !== activeFilters.toCity) {
        return false;
      }

      if (dateFromValue !== null || dateToValue !== null) {
        const offerDate = new Date(offer.departureDate).getTime();
        if (dateFromValue !== null && offerDate < dateFromValue) {
          return false;
        }
        if (dateToValue !== null && offerDate > dateToValue) {
          return false;
        }
      }

      if (capacityMinValue !== null || capacityMaxValue !== null) {
        const offerCapacity = offer.capacity
          ? extractNumberFromText(offer.capacity)
          : null;
        if (offerCapacity === null) {
          return false;
        }
        if (capacityMinValue !== null && offerCapacity < capacityMinValue) {
          return false;
        }
        if (capacityMaxValue !== null && offerCapacity > capacityMaxValue) {
          return false;
        }
      }

      return true;
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOffers();
    setRefreshing(false);
  }, [loadOffers]);

  const handleOfferPress = (offerId: string) => {
    navigation.navigate("ShippingDetail", { offerId });
  };

  const handleCreatePress = () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    navigation.navigate("ShippingCreate");
  };

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  const updateFilter = useCallback(
    (
      key: keyof ShippingFilters,
      value: ShippingFilters[keyof ShippingFilters],
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (filters.type !== "all") {
      chips.push({
        key: "type",
        label: t(`shipping.filters.${filters.type}`),
        onRemove: () => updateFilter("type", "all"),
      });
    }

    if (filters.fromCountry) {
      const countryLabel = countries.find(
        (option) => option.code === filters.fromCountry,
      );
      const flag = countryFlags[filters.fromCountry] || "";
      const name = countryLabel ? t(countryLabel.nameKey) : filters.fromCountry;
      chips.push({
        key: "fromCountry",
        label: `${flag} ${name}`.trim(),
        onRemove: () => updateFilter("fromCountry", ""),
      });
    }

    if (filters.fromCity) {
      chips.push({
        key: "fromCity",
        label: `${t("shipping.from")} ${filters.fromCity}`,
        onRemove: () => updateFilter("fromCity", ""),
      });
    }

    if (filters.toCountry) {
      const countryLabel = countries.find(
        (option) => option.code === filters.toCountry,
      );
      const flag = countryFlags[filters.toCountry] || "";
      const name = countryLabel ? t(countryLabel.nameKey) : filters.toCountry;
      chips.push({
        key: "toCountry",
        label: `${flag} ${name}`.trim(),
        onRemove: () => updateFilter("toCountry", ""),
      });
    }

    if (filters.toCity) {
      chips.push({
        key: "toCity",
        label: `${t("shipping.to")} ${filters.toCity}`,
        onRemove: () => updateFilter("toCity", ""),
      });
    }

    if (filters.dateFrom || filters.dateTo) {
      const dateLabel = [filters.dateFrom, filters.dateTo]
        .filter(Boolean)
        .join(" - ");
      chips.push({
        key: "dateRange",
        label: `${t("shipping.date")} ${dateLabel}`,
        onRemove: () =>
          setFilters((prev) => ({ ...prev, dateFrom: "", dateTo: "" })),
      });
    }

    if (filters.capacityMin || filters.capacityMax) {
      const minLabel = filters.capacityMin
        ? `${t("common.min")} ${filters.capacityMin}`
        : "";
      const maxLabel = filters.capacityMax
        ? `${t("common.max")} ${filters.capacityMax}`
        : "";
      const label = [minLabel, maxLabel].filter(Boolean).join(" - ");
      chips.push({
        key: "capacityRange",
        label,
        onRemove: () =>
          setFilters((prev) => ({ ...prev, capacityMin: "", capacityMax: "" })),
      });
    }

    return chips;
  }, [filters, t, updateFilter]);

  const renderHeader = () => (
    <LinearGradient
      colors={gradients.brandSoft}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top }]}
    >
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>{t("shipping.title")}</Text>
          <Text style={styles.subtitle}>{t("shipping.subtitle")}</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreatePress}
        >
          <Ionicons name="add" size={24} color={colors.neutral[0]} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("common.search")}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeChips.length > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setIsFilterOpen(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={
              activeChips.length > 0
                ? colors.primary[600]
                : colors.text.secondary
            }
          />
        </TouchableOpacity>
      </View>

      {activeChips.length > 0 && (
        <View style={styles.activeFilters}>
          {activeChips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              onRemove={chip.onRemove}
            />
          ))}
        </View>
      )}
    </LinearGradient>
  );

  const renderContent = () => {
    if (isLoading && filteredOffers.length === 0) {
      return (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} style={styles.skeletonCard} />
          ))}
        </View>
      );
    }

    // Check if filters are active (not default)
    const hasActiveFilters =
      filters.type !== "all" ||
      filters.fromCountry !== "" ||
      filters.fromCity !== "" ||
      filters.toCountry !== "" ||
      filters.toCity !== "" ||
      filters.dateFrom !== "" ||
      filters.dateTo !== "" ||
      filters.capacityMin !== "" ||
      filters.capacityMax !== "" ||
      searchQuery.trim() !== "";

    if (filteredOffers.length === 0) {
      // Show different empty states based on whether filters are active
      if (hasActiveFilters) {
        return (
          <EmptyState
            icon="search-outline"
            title={t("shipping.noResultsTitle")}
            message={t("shipping.noResultsMessage")}
            actionLabel={t("shipping.clearFilters")}
            onAction={() => {
              resetFilters();
              setSearchQuery("");
            }}
          />
        );
      }

      return (
        <EmptyState
          icon="cube-outline"
          title={t("shipping.emptyTitle")}
          message={t("shipping.emptyMessage")}
          actionLabel={t("shipping.createOffer")}
          onAction={handleCreatePress}
        />
      );
    }

    return (
      <FlatList
        data={filteredOffers}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <ShippingOfferCard
              offer={item}
              onPress={() => handleOfferPress(item.id)}
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderContent()}
      <BottomSheet
        visible={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title={t("shipping.filters.title")}
      >
        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sheetLabel}>{t("shipping.filters.type")}</Text>
          <View style={styles.sheetChipRow}>
            {filterOptions.map((option) => {
              const isActive = filters.type === option;
              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => updateFilter("type", option)}
                  style={[styles.typeChip, isActive && styles.typeChipActive]}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      isActive && styles.typeChipTextActive,
                    ]}
                  >
                    {t(`shipping.filters.${option}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <SelectField
            label={t("shipping.filters.fromCountry")}
            value={filters.fromCountry}
            options={countryOptions}
            onSelect={(value) =>
              updateFilter("fromCountry", value as OptionalCountry)
            }
            placeholder={t("common.all")}
            sheetTitle={t("shipping.filters.fromCountry")}
          />
          <SelectField
            label={t("shipping.filters.fromCity")}
            value={filters.fromCity}
            options={fromCityOptions}
            onSelect={(value) => updateFilter("fromCity", value)}
            placeholder={t("common.all")}
            helperText={
              !filters.fromCountry ? t("common.selectCountryFirst") : undefined
            }
            disabled={!filters.fromCountry}
            sheetTitle={t("shipping.filters.fromCity")}
            emptyText={t("common.noResults")}
          />

          <SelectField
            label={t("shipping.filters.toCountry")}
            value={filters.toCountry}
            options={countryOptions}
            onSelect={(value) =>
              updateFilter("toCountry", value as OptionalCountry)
            }
            placeholder={t("common.all")}
            sheetTitle={t("shipping.filters.toCountry")}
          />
          <SelectField
            label={t("shipping.filters.toCity")}
            value={filters.toCity}
            options={toCityOptions}
            onSelect={(value) => updateFilter("toCity", value)}
            placeholder={t("common.all")}
            helperText={
              !filters.toCountry ? t("common.selectCountryFirst") : undefined
            }
            disabled={!filters.toCountry}
            sheetTitle={t("shipping.filters.toCity")}
            emptyText={t("common.noResults")}
          />

          <Text style={styles.sheetLabel}>
            {t("shipping.filters.dateRange")}
          </Text>
          <View style={styles.rangeRow}>
            <Input
              label={t("shipping.filters.dateFrom")}
              value={filters.dateFrom}
              onChangeText={(value) => updateFilter("dateFrom", value)}
              placeholder="YYYY-MM-DD"
              containerStyle={styles.rangeInput}
            />
            <Input
              label={t("shipping.filters.dateTo")}
              value={filters.dateTo}
              onChangeText={(value) => updateFilter("dateTo", value)}
              placeholder="YYYY-MM-DD"
              containerStyle={styles.rangeInput}
            />
          </View>

          <Text style={styles.sheetLabel}>
            {t("shipping.filters.capacityRange")}
          </Text>
          <View style={styles.rangeRow}>
            <Input
              label={t("common.min")}
              value={filters.capacityMin}
              onChangeText={(value) => updateFilter("capacityMin", value)}
              placeholder="0"
              keyboardType="decimal-pad"
              containerStyle={styles.rangeInput}
            />
            <Input
              label={t("common.max")}
              value={filters.capacityMax}
              onChangeText={(value) => updateFilter("capacityMax", value)}
              placeholder="0"
              keyboardType="decimal-pad"
              containerStyle={styles.rangeInput}
            />
          </View>

          <View style={styles.sheetActions}>
            <Button
              label={t("common.reset")}
              onPress={resetFilters}
              variant="ghost"
              style={styles.sheetActionButton}
            />
            <Button
              label={t("common.done")}
              onPress={() => setIsFilterOpen(false)}
              variant="primary"
              style={styles.sheetActionButton}
            />
          </View>
        </ScrollView>
      </BottomSheet>

      <GuestRestrictionModal
        visible={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        feature={t("shipping.createOffer")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    ...shadows.sm,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.base,
    marginTop: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
  },
  filterButton: {
    width: FILTER_BUTTON_SIZE,
    height: FILTER_BUTTON_SIZE,
    borderRadius: radius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  activeFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  listContent: {
    padding: spacing.base,
  },
  skeletonContainer: {
    padding: spacing.base,
  },
  skeletonCard: {
    marginBottom: spacing.md,
  },
  sheetContent: {
    paddingBottom: spacing.base,
  },
  sheetLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  sheetChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  typeChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  typeChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  typeChipText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  typeChipTextActive: {
    color: colors.neutral[0],
  },
  rangeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rangeInput: {
    flex: 1,
  },
  sheetActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  sheetActionButton: {
    flex: 1,
  },
  flag: {
    fontSize: 18,
  },
});
