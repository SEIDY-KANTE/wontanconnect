/**
 * My FX Offers Screen
 */

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View, FlatList, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ProfileScreenProps } from "@/core/navigation/types";
import { useFXStore } from "@/features/fx/store/fxStore";
import { FXOfferCard } from "@/features/fx/components/FXOfferCard";
import { FXOffer } from "@/features/fx/model/types";
import { useAppStore } from "@/core/store/appStore";
import {
  BottomSheet,
  Card,
  Divider,
  EmptyState,
  Header,
  ListItem,
  Modal,
  SkeletonCard,
  GuestRestrictionModal,
} from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { useIsGuest, useAuthStore } from "@/core/store/authStore";

const ACTION_ICON_SIZE = 20;

export const MyFXOffersScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<ProfileScreenProps<"MyFXOffers">["navigation"]>();
  const { offers, isLoading, loadOffers, updateOfferStatus, deleteOffer } =
    useFXStore();
  const { showToast } = useAppStore();
  const isGuest = useIsGuest();
  const authUser = useAuthStore((state) => state.user);

  const [selectedOffer, setSelectedOffer] = useState<FXOffer | null>(null);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  const currentUserId = authUser?.id ?? "";

  const myOffers = useMemo(
    () =>
      offers
        .filter((offer) => offer.user.id === currentUserId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    [currentUserId, offers],
  );

  useEffect(() => {
    if (!offers.length) {
      loadOffers();
    }
  }, [loadOffers, offers.length]);

  const handleCreate = () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    navigation.navigate("FXTab", { screen: "FXCreate" });
  };

  const handleOfferPress = (offerId: string) => {
    navigation.navigate("FXTab", { screen: "FXDetail", params: { offerId } });
  };

  const openActions = (offer: FXOffer) => {
    setSelectedOffer(offer);
    setIsActionOpen(true);
  };

  const closeActions = () => {
    setIsActionOpen(false);
  };

  const handleEdit = () => {
    if (!selectedOffer) return;
    closeActions();
    navigation.navigate("FXTab", {
      screen: "FXCreate",
      params: { offerId: selectedOffer.id },
    });
  };

  const handleMarkCompleted = () => {
    if (!selectedOffer) return;
    updateOfferStatus(selectedOffer.id, "completed");
    closeActions();
    showToast("success", t("common.status.completed"));
  };

  const handleDeleteRequest = () => {
    closeActions();
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedOffer) return;
    deleteOffer(selectedOffer.id);
    setIsDeleteOpen(false);
    setSelectedOffer(null);
    showToast("success", t("common.deleteSuccess"));
  };

  const handleDeleteCancel = () => {
    setIsDeleteOpen(false);
  };

  const canMarkCompleted = selectedOffer?.status === "active";

  const renderRightAction = () => (
    <TouchableOpacity style={styles.headerAction} onPress={handleCreate}>
      <Ionicons name="add" size={22} color={colors.primary[600]} />
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isLoading && myOffers.length === 0) {
      return (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((index) => (
            <SkeletonCard
              key={`fx-skeleton-${index}`}
              style={styles.skeletonCard}
            />
          ))}
        </View>
      );
    }

    if (myOffers.length === 0) {
      return (
        <EmptyState
          icon="swap-horizontal-outline"
          title={t("fx.myOffersEmptyTitle")}
          message={t("fx.myOffersEmptyMessage")}
          actionLabel={t("fx.createOffer")}
          onAction={handleCreate}
        />
      );
    }

    return (
      <FlatList
        data={myOffers}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <FXOfferCard
              offer={item}
              onPress={() => handleOfferPress(item.id)}
              showStatusBadge
              onActionPress={() => openActions(item)}
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={t("fx.myOffers")}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={renderRightAction()}
        variant="gradient"
        elevated
      />
      {renderContent()}

      <BottomSheet visible={isActionOpen} onClose={closeActions}>
        <Card padding="none" style={styles.actionCard}>
          <ListItem
            title={t("common.edit")}
            onPress={handleEdit}
            showChevron={false}
            leftIcon={
              <Ionicons
                name="create-outline"
                size={ACTION_ICON_SIZE}
                color={colors.text.secondary}
              />
            }
            style={styles.actionItem}
          />
          <Divider spacing="sm" style={styles.actionDivider} />
          <ListItem
            title={t("common.markCompleted")}
            onPress={handleMarkCompleted}
            showChevron={false}
            disabled={!canMarkCompleted}
            leftIcon={
              <Ionicons
                name="checkmark-circle-outline"
                size={ACTION_ICON_SIZE}
                color={
                  canMarkCompleted ? colors.success.main : colors.text.tertiary
                }
              />
            }
            style={styles.actionItem}
          />
          <Divider spacing="sm" style={styles.actionDivider} />
          <ListItem
            title={t("common.delete")}
            onPress={handleDeleteRequest}
            showChevron={false}
            leftIcon={
              <Ionicons
                name="trash-outline"
                size={ACTION_ICON_SIZE}
                color={colors.error.main}
              />
            }
            style={styles.actionItem}
          />
        </Card>
      </BottomSheet>

      <Modal
        visible={isDeleteOpen}
        onClose={handleDeleteCancel}
        title={t("common.deleteConfirmTitle")}
        message={t("common.deleteConfirmMessage")}
        primaryAction={{
          label: t("common.delete"),
          onPress: handleDeleteConfirm,
          variant: "danger",
        }}
        secondaryAction={{
          label: t("common.cancel"),
          onPress: handleDeleteCancel,
        }}
      />

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
  listContent: {
    padding: spacing.base,
    paddingBottom: spacing["4xl"],
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCard: {
    marginTop: spacing.sm,
  },
  actionItem: {
    backgroundColor: "transparent",
    borderRadius: 0,
  },
  actionDivider: {
    marginVertical: 0,
  },
  skeletonContainer: {
    padding: spacing.base,
  },
  skeletonCard: {
    marginBottom: spacing.md,
  },
});
