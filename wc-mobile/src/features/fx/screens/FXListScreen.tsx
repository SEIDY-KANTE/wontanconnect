/**
 * FX List Screen
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

import { FXScreenProps } from "@/core/navigation/types";
import { useFXStore } from "../store/fxStore";
import { FXOfferCard } from "../components/FXOfferCard";
import { currencyInfo } from "../data/mockData";
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
import { Currency, FXOffer } from "../model/types";
import { parseNumberInput } from "@/utils/number";

type FilterOption = "all" | "buying" | "selling";
type FxSortOption = "newest" | "bestRate" | "closest";
type OptionalCurrency = Currency | "";
type OptionalCountry = CountryCode | "";

interface FxFilters {
  type: FilterOption;
  fromCurrency: OptionalCurrency;
  toCurrency: OptionalCurrency;
  country: OptionalCountry;
  city: string;
  amountMin: string;
  amountMax: string;
  sortBy: FxSortOption;
}

const filterOptions: FilterOption[] = ["all", "buying", "selling"];
const currencyOptions = Object.keys(currencyInfo) as Currency[];
const DEFAULT_SORT: FxSortOption = "newest";
const DEFAULT_FILTERS: FxFilters = {
  type: "all",
  fromCurrency: "",
  toCurrency: "",
  country: "",
  city: "",
  amountMin: "",
  amountMax: "",
  sortBy: DEFAULT_SORT,
};
const CURRENT_LOCATION = { country: "TR" as CountryCode, city: "Istanbul" };
const LOCATION_SCORE = { city: 0, country: 1, other: 2 };
const FILTER_BUTTON_SIZE = 44;

export const FXListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<FXScreenProps<"FXList">["navigation"]>();
  const insets = useSafeAreaInsets();
  const isGuest = useIsGuest();

  const { isLoading, searchQuery, setSearchQuery, loadOffers, offers } =
    useFXStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FxFilters>({ ...DEFAULT_FILTERS });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  useEffect(() => {
    if (!filters.country) {
      if (filters.city) {
        setFilters((prev) => ({ ...prev, city: "" }));
      }
      return;
    }

    const availableCities = citiesByCountry[filters.country] || [];
    if (!availableCities.length) {
      if (filters.city) {
        setFilters((prev) => ({ ...prev, city: "" }));
      }
      return;
    }

    const hasCity = availableCities.some(
      (option) => option.name === filters.city,
    );
    if (!hasCity && filters.city) {
      setFilters((prev) => ({ ...prev, city: "" }));
    }
  }, [filters.city, filters.country]);

  const countryOptions = useMemo(
    () =>
      countries.map((option) => ({
        value: option.code,
        label: t(option.nameKey),
        leftIcon: <Text style={styles.flag}>{option.flag}</Text>,
      })),
    [t],
  );

  const currencySelectOptions = useMemo(
    () =>
      currencyOptions.map((currency) => ({
        value: currency,
        label: `${currency} - ${t(`currencies.${currency}`)}`,
        leftIcon: (
          <Text style={styles.flag}>
            {currencyInfo[currency]?.flag || "💱"}
          </Text>
        ),
      })),
    [t],
  );

  const cityOptions = useMemo(
    () =>
      filters.country
        ? (citiesByCountry[filters.country] || []).map((option) => ({
            value: option.name,
            label: option.name,
          }))
        : [],
    [filters.country],
  );

  const sortOptions = useMemo(
    () => [
      { value: "newest", label: t("fx.filters.sortNewest") },
      { value: "bestRate", label: t("fx.filters.sortBestRate") },
      { value: "closest", label: t("fx.filters.sortClosest") },
    ],
    [t],
  );
  const amountMinValue = useMemo(
    () => parseNumberInput(filters.amountMin),
    [filters.amountMin],
  );
  const amountMaxValue = useMemo(
    () => parseNumberInput(filters.amountMax),
    [filters.amountMax],
  );

  const filteredOffers = useFilters<FXOffer, FxFilters>({
    items: offers,
    filters,
    searchQuery,
    applySearch: (offer, query) =>
      offer.fromCurrency.toLowerCase().includes(query) ||
      offer.toCurrency.toLowerCase().includes(query) ||
      offer.location.city.toLowerCase().includes(query) ||
      offer.user.name.toLowerCase().includes(query),
    applyFilters: (offer, activeFilters) => {
      if (activeFilters.type !== "all" && offer.type !== activeFilters.type) {
        return false;
      }
      if (
        activeFilters.fromCurrency &&
        offer.fromCurrency !== activeFilters.fromCurrency
      ) {
        return false;
      }
      if (
        activeFilters.toCurrency &&
        offer.toCurrency !== activeFilters.toCurrency
      ) {
        return false;
      }
      if (
        activeFilters.country &&
        offer.location.country !== activeFilters.country
      ) {
        return false;
      }
      if (activeFilters.city && offer.location.city !== activeFilters.city) {
        return false;
      }

      if (amountMinValue !== null && offer.amountFrom < amountMinValue) {
        return false;
      }
      if (amountMaxValue !== null && offer.amountFrom > amountMaxValue) {
        return false;
      }

      return true;
    },
    sortBy: (a, b, activeFilters) => {
      if (activeFilters.sortBy === "bestRate") {
        const aRate = a.rate ?? (a.amountTo ? a.amountTo / a.amountFrom : 0);
        const bRate = b.rate ?? (b.amountTo ? b.amountTo / b.amountFrom : 0);
        return bRate - aRate;
      }

      if (activeFilters.sortBy === "closest") {
        const getScore = (offer: FXOffer) => {
          if (offer.location.city === CURRENT_LOCATION.city) {
            return LOCATION_SCORE.city;
          }
          if (offer.location.country === CURRENT_LOCATION.country) {
            return LOCATION_SCORE.country;
          }
          return LOCATION_SCORE.other;
        };
        const scoreA = getScore(a);
        const scoreB = getScore(b);
        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOffers();
    setRefreshing(false);
  }, [loadOffers]);

  const handleOfferPress = (offerId: string) => {
    navigation.navigate("FXDetail", { offerId });
  };

  const handleCreatePress = () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    navigation.navigate("FXCreate");
  };

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  const updateFilter = useCallback(
    (key: keyof FxFilters, value: FxFilters[keyof FxFilters]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (filters.type !== "all") {
      chips.push({
        key: "type",
        label: t(`fx.filters.${filters.type}`),
        onRemove: () => updateFilter("type", "all"),
      });
    }

    if (filters.fromCurrency) {
      chips.push({
        key: "fromCurrency",
        label: `${t("fx.from")} ${filters.fromCurrency}`,
        onRemove: () => updateFilter("fromCurrency", ""),
      });
    }

    if (filters.toCurrency) {
      chips.push({
        key: "toCurrency",
        label: `${t("fx.to")} ${filters.toCurrency}`,
        onRemove: () => updateFilter("toCurrency", ""),
      });
    }

    if (filters.country) {
      const countryLabel = countries.find(
        (option) => option.code === filters.country,
      );
      const flag = countryFlags[filters.country] || "";
      const name = countryLabel ? t(countryLabel.nameKey) : filters.country;
      chips.push({
        key: "country",
        label: `${flag} ${name}`.trim(),
        onRemove: () => updateFilter("country", ""),
      });
    }

    if (filters.city) {
      chips.push({
        key: "city",
        label: filters.city,
        onRemove: () => updateFilter("city", ""),
      });
    }

    if (filters.amountMin || filters.amountMax) {
      const minLabel = filters.amountMin
        ? `${t("common.min")} ${filters.amountMin}`
        : "";
      const maxLabel = filters.amountMax
        ? `${t("common.max")} ${filters.amountMax}`
        : "";
      const label = [minLabel, maxLabel].filter(Boolean).join(" - ");
      chips.push({
        key: "amountRange",
        label,
        onRemove: () =>
          setFilters((prev) => ({ ...prev, amountMin: "", amountMax: "" })),
      });
    }

    if (filters.sortBy !== DEFAULT_SORT) {
      const sortLabel =
        filters.sortBy === "bestRate"
          ? t("fx.filters.sortBestRate")
          : t("fx.filters.sortClosest");
      chips.push({
        key: "sortBy",
        label: sortLabel,
        onRemove: () => updateFilter("sortBy", DEFAULT_SORT),
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
          <Text style={styles.title}>{t("fx.title")}</Text>
          <Text style={styles.subtitle}>{t("fx.subtitle")}</Text>
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
      filters.fromCurrency !== "" ||
      filters.toCurrency !== "" ||
      filters.country !== "" ||
      filters.city !== "" ||
      filters.amountMin !== "" ||
      filters.amountMax !== "" ||
      searchQuery.trim() !== "";

    if (filteredOffers.length === 0) {
      // Show different empty states based on whether filters are active
      if (hasActiveFilters) {
        return (
          <EmptyState
            icon="search-outline"
            title={t("fx.noResultsTitle")}
            message={t("fx.noResultsMessage")}
            actionLabel={t("fx.clearFilters")}
            onAction={() => {
              resetFilters();
              setSearchQuery("");
            }}
          />
        );
      }

      return (
        <EmptyState
          icon="swap-horizontal-outline"
          title={t("fx.emptyTitle")}
          message={t("fx.emptyMessage")}
          actionLabel={t("fx.createOffer")}
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
            <FXOfferCard
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
        title={t("fx.filters.title")}
      >
        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sheetLabel}>{t("fx.filters.type")}</Text>
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
                    {t(`fx.filters.${option}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <SelectField
            label={t("fx.filters.fromCurrency")}
            value={filters.fromCurrency}
            options={currencySelectOptions}
            onSelect={(value) =>
              updateFilter("fromCurrency", value as OptionalCurrency)
            }
            placeholder={t("common.all")}
            sheetTitle={t("fx.filters.fromCurrency")}
          />
          <SelectField
            label={t("fx.filters.toCurrency")}
            value={filters.toCurrency}
            options={currencySelectOptions}
            onSelect={(value) =>
              updateFilter("toCurrency", value as OptionalCurrency)
            }
            placeholder={t("common.all")}
            sheetTitle={t("fx.filters.toCurrency")}
          />

          <SelectField
            label={t("fx.filters.country")}
            value={filters.country}
            options={countryOptions}
            onSelect={(value) =>
              updateFilter("country", value as OptionalCountry)
            }
            placeholder={t("common.all")}
            sheetTitle={t("fx.filters.country")}
          />
          <SelectField
            label={t("fx.filters.city")}
            value={filters.city}
            options={cityOptions}
            onSelect={(value) => updateFilter("city", value)}
            placeholder={t("common.all")}
            helperText={
              !filters.country ? t("common.selectCountryFirst") : undefined
            }
            disabled={!filters.country}
            sheetTitle={t("fx.filters.city")}
            emptyText={t("common.noResults")}
          />

          <Text style={styles.sheetLabel}>{t("fx.filters.amountRange")}</Text>
          <View style={styles.rangeRow}>
            <Input
              label={t("common.min")}
              value={filters.amountMin}
              onChangeText={(value) => updateFilter("amountMin", value)}
              placeholder="0"
              keyboardType="decimal-pad"
              containerStyle={styles.rangeInput}
            />
            <Input
              label={t("common.max")}
              value={filters.amountMax}
              onChangeText={(value) => updateFilter("amountMax", value)}
              placeholder="0"
              keyboardType="decimal-pad"
              containerStyle={styles.rangeInput}
            />
          </View>

          <SelectField
            label={t("fx.filters.sortBy")}
            value={filters.sortBy}
            options={sortOptions}
            onSelect={(value) => updateFilter("sortBy", value as FxSortOption)}
            sheetTitle={t("fx.filters.sortBy")}
          />

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
        feature={t("fx.createOffer")}
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
