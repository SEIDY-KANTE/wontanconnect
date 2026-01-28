/**
 * My FX Exchanges Screen
 *
 * Lists all FX exchange sessions for the current user.
 */

import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ProfileScreenProps } from "@/core/navigation/types";
import { EmptyState } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { shadows } from "@/design/tokens/shadows";
import { gradients } from "@/design/tokens/gradients";
import { useExchangeStore } from "@/features/exchange/store/exchangeStore";
import { ExchangeCard } from "@/features/exchange/components";
import { ExchangeSession } from "@/features/exchange/model/types";
import { useAuthStore } from "@/core/store/authStore";

type FilterStatus = "all" | "active" | "completed" | "pending";

export const MyFXExchangesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<ProfileScreenProps<"MyFXExchanges">["navigation"]>();
  const insets = useSafeAreaInsets();

  const { sessions, loadSessions } = useExchangeStore();
  const authUser = useAuthStore((state) => state.user);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("all");

  const currentUserId = authUser?.id ?? "";

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  // Filter FX exchanges
  const fxExchanges = sessions.filter((s) => s.type === "FX");

  // Apply status filter
  const filteredExchanges = fxExchanges.filter((session) => {
    const isUserSession =
      session.initiatorUserId === currentUserId ||
      session.takerUserId === currentUserId;

    if (!isUserSession) return false;

    switch (filter) {
      case "active":
        return session.status === "IN_PROGRESS";
      case "completed":
        return session.status === "COMPLETED";
      case "pending":
        return session.status === "PENDING_APPROVAL";
      default:
        return true;
    }
  });

  const handleExchangePress = (session: ExchangeSession) => {
    navigation.navigate("ExchangeDetail", { exchangeId: session.id });
  };

  const filters: { key: FilterStatus; label: string }[] = [
    { key: "all", label: t("common.all") },
    { key: "pending", label: t("exchange.status.pending_approval") },
    { key: "active", label: t("exchange.status.in_progress") },
    { key: "completed", label: t("exchange.status.completed") },
  ];

  const renderItem = ({
    item,
    index,
  }: {
    item: ExchangeSession;
    index: number;
  }) => (
    <ExchangeCard
      session={item}
      onPress={() => handleExchangePress(item)}
      index={index}
    />
  );

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
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("exchange.fxExchanges")}</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                filter === item.key && styles.filterChipSelected,
              ]}
              onPress={() => setFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === item.key && styles.filterChipTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredExchanges}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary[600]]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="swap-horizontal-outline"
            title={t("exchange.emptyTitle")}
            message={t("exchange.emptyMessage")}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  backButton: {
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
  filtersContainer: {
    backgroundColor: colors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  filtersList: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  filterChip: {
    marginRight: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterChipSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterChipText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },
  filterChipTextSelected: {
    color: colors.neutral[0],
  },
  listContent: {
    padding: spacing.base,
    paddingBottom: spacing.xl,
  },
});
